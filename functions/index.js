// ==========================================
// IMPORTS & INITIALIZATION
// ==========================================
const { setGlobalOptions } = require("firebase-functions/v2");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentWritten, onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { algoliasearch } = require("algoliasearch");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");

const Notification = require("./models/notification");
const { GAMIFICATION_RANKS } = require("./constants/gamification");

// Initialize Firebase Admin globally
initializeApp();
const db = getFirestore();

// Set global configuration (Applies region & instance limits to ALL functions automatically)
setGlobalOptions({ 
    region: "europe-west1", 
    maxInstances: 10 
});

// ==========================================
// CONFIGURATION CONSTANTS & LAZY INITIALIZATION
// ==========================================
const ALGOLIA_INDEX_NAME = "users";
const ALGOLIA_PUBLICATIONS_INDEX = "publications";

// Keeps the client interface empty until the function is explicitly invoked in production
let algoliaClient = null;

const getAlgoliaClient = () => {
    if (!algoliaClient) {
        const APP_ID = process.env.ALGOLIA_APP_ID;
        const ADMIN_KEY = process.env.ALGOLIA_ADMIN_KEY; 

        if (!APP_ID || !ADMIN_KEY) {
            console.error("CRITICAL: Algolia Environment Variables are missing inside the environment context!");
        }

        algoliaClient = algoliasearch(APP_ID, ADMIN_KEY);
    }
    return algoliaClient;
};

// ==========================================
// ALGOLIA USER SYNC FUNCTION
// ==========================================
exports.syncUserToAlgolia = onDocumentWritten("users/{userId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const data = snapshot.after.data();
    const objectID = event.params.userId;
    
    // Safely retrieve client at execution time
    const client = getAlgoliaClient();

    try {
        if (!data) {
            await client.deleteObject({
                indexName: ALGOLIA_INDEX_NAME,
                objectID: objectID
            });
            console.log(`User ${objectID} successfully deleted from Algolia.`);
            return;
        }

        await client.saveObject({
            indexName: ALGOLIA_INDEX_NAME,
            body: {
                objectID, 
                ...data
            }
        });
        console.log(`User ${objectID} successfully synced to Algolia.`);
    } catch (error) {
        console.error("Error syncing with Algolia:", error);
    }
});

// ==========================================
// USER RATING UPDATE FUNCTION
// ==========================================
exports.updateUserRating = onDocumentCreated("reviews/{reviewId}", async (event) => {
    const newReview = event.data.data();
    if (!newReview) return null;

    const revieweeId = newReview.revieweeId;
    const newRating = Number(newReview.rating);
    const userRef = db.collection('users').doc(revieweeId);

    try {
        await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            
            if (!userDoc.exists) {
                console.log(`User ${revieweeId} not found. Cannot update rating.`);
                return;
            }

            const userData = userDoc.data();
            const currentRating = Number(userData.rating) || 0;
            const currentCount = Number(userData.reviewCount) || 0;

            const nextCount = currentCount + 1;
            const nextRating = ((currentRating * currentCount) + newRating) / nextCount;

            transaction.update(userRef, {
                rating: Number(nextRating.toFixed(2)),
                reviewCount: nextCount
            });
        });

        console.log(`Rating for user ${revieweeId} updated successfully.`);
    } catch (error) {
        console.error("Error processing the rating Cloud Function:", error);
    }
});

// ==========================================
// ALGOLIA PUBLICATION SYNC FUNCTION
// ==========================================
exports.syncPublicationToAlgolia = onDocumentWritten("publications/{publicationId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const data = snapshot.after.data();
    const objectID = event.params.publicationId;
    
    // Safely retrieve client at execution time
    const client = getAlgoliaClient();

    try {
        if (!data) {
            await client.deleteObject({
                indexName: ALGOLIA_PUBLICATIONS_INDEX,
                objectID: objectID
            });
            console.log(`Publication ${objectID} successfully deleted from Algolia.`);
            return;
        }

        await client.saveObject({
            indexName: ALGOLIA_PUBLICATIONS_INDEX,
            body: {
                objectID,
                ...data
            }
        });
        console.log(`Publication ${objectID} successfully synced to Algolia.`);
    } catch (error) {
        console.error("Error syncing publication with Algolia:", error);
    }
});

// ==========================================
// HELPER: UPDATE USER GAMIFICATION
// ==========================================
async function updateUserGamification(userId) {
    if (!userId) return;

    const userRef = db.collection('users').doc(userId);

    await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        
        if (!userDoc.exists) return;

        const userData = userDoc.data();
        const currentCount = (userData.gamification?.completedSwapsCount || 0) + 1;

        const highestAchievedRank = [...GAMIFICATION_RANKS]
            .reverse()
            .find(rank => currentCount >= rank.milestone) || GAMIFICATION_RANKS[0];

        transaction.update(userRef, {
            'gamification.completedSwapsCount': currentCount,
            'gamification.rank': highestAchievedRank.title
        });
    });
}

// ==========================================
// DELETE BOOKS ON SWAP COMPLETED FUNCTION
// ==========================================
exports.deleteBooksOnSwapComplete = onDocumentUpdated("chats/{chatId}/messages/{messageId}", async (event) => {
    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();

    if (!beforeData || !afterData) return;
    if (afterData.type !== 'offer') return;

    const beforeStatus = beforeData.offerDetails?.status;
    const afterStatus = afterData.offerDetails?.status;

    if (beforeStatus !== 'completed' && afterStatus === 'completed') {
        const targetBookId = afterData.offerDetails?.targetBookId;
        const finalSelectedBookId = afterData.offerDetails?.finalSelectedBookId || afterData.offerDetails?.selectedBookId;

        console.log(`Swap completed! Deleting books: Target(${targetBookId}), Selected(${finalSelectedBookId})`);

        try {
            const batch = db.batch();

            if (targetBookId) {
                batch.delete(db.collection('publications').doc(targetBookId));
            }
            if (finalSelectedBookId) {
                batch.delete(db.collection('publications').doc(finalSelectedBookId));
            }

            await batch.commit();
            console.log("Successfully deleted swapped books via Admin SDK.");

            // --- ADDED GAMIFICATION LOGIC ---
            // Fetch chat participants to update their gamification stats
            const chatId = event.params.chatId;
            const chatDoc = await db.collection('chats').doc(chatId).get();
            
            if (chatDoc.exists) {
                const participants = chatDoc.data().participants || [];
                
                await Promise.all(
                    participants.map(userId => updateUserGamification(userId))
                );
                console.log(`Successfully updated gamification stats for users: ${participants.join(", ")}`);
            }
            // --------------------------------

        } catch (error) {
            console.error("Error deleting books or updating gamification on swap completion:", error);
        }
    }
});

// ==========================================
// VERIFY SWAP CODE FUNCTION
// ==========================================
exports.verifySwapCode = onCall(async (request) => {
    const { chatId, messageId, scannedCode } = request.data;
    const uid = request.auth?.uid;

    if (!uid) {
        throw new HttpsError("unauthenticated", "User must be authenticated to verify a swap.");
    }

    try {
        const messageRef = db.collection('chats').doc(chatId).collection('messages').doc(messageId);
        const doc = await messageRef.get();

        if (!doc.exists) {
            throw new HttpsError("not-found", "Chat message not found.");
        }

        const data = doc.data();
        const expectedCode = data.offerDetails?.verificationCode;

        if (scannedCode !== expectedCode) {
            throw new HttpsError("invalid-argument", "The scanned code is incorrect.");
        }

        await messageRef.update({
            "offerDetails.status": "completed"
        });

        return { success: true };
    } catch (error) {
        console.error("Verification error:", error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError("internal", "An error occurred during verification.");
    }
});

// ==========================================
// SCHEDULED INACTIVE CHAT PURGE (CRON)
// ==========================================
exports.purgeInactiveChats = onSchedule("0 0 * * *", async (event) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const cutoffValue = Timestamp.fromDate(thirtyDaysAgo);

    try {
        const snapshot = await db.collection("chats")
            .where("updatedAt", "<=", cutoffValue)
            .get();

        if (snapshot.empty) {
            console.log("Cleanup complete: No inactive chats found.");
            return;
        }

        console.log(`Found ${snapshot.size} inactive chats. Initiating deletion process...`);

        for (const doc of snapshot.docs) {
            await db.recursiveDelete(doc.ref);
            console.log(`Successfully purged chat ID: ${doc.id}`);
        }

        console.log("All old conversations successfully processed.");
    } catch (error) {
        console.error("Fatal error during chat cleanup cycle:", error);
    }
});

// ─── TRIGGER: ON FOLLOW REQUEST CREATED ───
exports.onFollowRequestCreated = onDocumentCreated("followRequests/{requestId}", async (event) => {
    const requestData = event.data.data();
    if (!requestData) return null;

    const requesterUid = requestData.requesterUid;
    const targetUid = requestData.targetUid;

    try {
        const actorDoc = await db.collection("users").doc(requesterUid).get();
        const actorData = actorDoc.data();
        const actorName = actorData?.username || actorData?.displayName || "Someone";
        // Fetching the user's photo profile URL
        const actorPhotoURL = actorData?.photoURL || actorData?.avatarUrl || null;

        const followRequestNotif = new Notification({
            type: "FOLLOW_REQUEST",
            actorId: requesterUid,
            actorName: actorName,
            actorPhotoURL: actorPhotoURL, // Passed into the constructor
            targetId: event.params.requestId,
            message: `${actorName} requested to follow you.`
        });

        const customId = `req_${requesterUid}_${targetUid}`;
        await Notification.sendToUser(db, targetUid, followRequestNotif, customId);
        
        console.log(`Follow request notification successfully sent to user: ${targetUid}`);
    } catch (error) {
        console.error("Error generating follow request notification:", error);
    }
    return null;
});

// ─── TRIGGER: ON FOLLOW COMPLETED (ACCEPTED) ───
exports.onFollowCreated = onDocumentCreated("follows/{followId}", async (event) => {
    const followData = event.data.data();
    if (!followData) return null;

    const followerUid = followData.followerUid;
    const followingUid = followData.followingUid;

    try {
        const actorDoc = await db.collection("users").doc(followingUid).get();
        const actorData = actorDoc.data();
        const actorName = actorData?.username || actorData?.displayName || "Someone";
        // Fetching the user's photo profile URL
        const actorPhotoURL = actorData?.photoURL || actorData?.avatarUrl || null;

        const newFollowNotif = new Notification({
            type: "NEW_FOLLOW",
            actorId: followingUid,
            actorName: actorName,
            actorPhotoURL: actorPhotoURL, // Passed into the constructor
            targetId: event.params.followId,
            message: `${actorName} accepted your follow request.`
        });

        const customId = `accept_${followerUid}_${followingUid}`;
        
        await Notification.sendToUser(db, followerUid, newFollowNotif, customId);
        
        console.log(`Acceptance notification successfully sent to user: ${followerUid}`);
    } catch (error) {
        console.error("Error generating new follow notification:", error);
    }
    return null;
});
