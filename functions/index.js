// ==========================================
// IMPORTS & INITIALIZATION
// ==========================================
const { setGlobalOptions } = require("firebase-functions/v2");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { onDocumentWritten, onDocumentCreated, onDocumentDeleted, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { algoliasearch } = require("algoliasearch");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, Timestamp, FieldValue } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");
const { getAuth } = require("firebase-admin/auth");

const Notification = require("./models/notification");
const { PUBLICATION_STATUS_AVAILABLE, NEGOTIATION_STATUS } = require("./constants/negotiation");
const { GAMIFICATION_RANKS } = require("./constants/gamification");
const { sendPushNotification } = require("./utils/pushNotification");

const functions = require("firebase-functions");

initializeApp({
    storageBucket: "readme---bookworms.firebasestorage.app"
});
const db = getFirestore();

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

// Helper function
async function markOffersUnavailableForBook(bookId) {
    // Query 1: offers where this book is the target
    const targetQuery = db.collectionGroup('messages')
    .where('type', '==', 'offer')
    .where('offerDetails.status', '==', NEGOTIATION_STATUS.PENDING)
    .where('offerDetails.targetBookId', '==', bookId);

    // Query 2: offers where this book was one of the offered books
    const offeredQuery = db.collectionGroup('messages')
    .where('type', '==', 'offer')
    .where('offerDetails.status', '==', NEGOTIATION_STATUS.PENDING)
    .where('offerDetails.offeredBookIds', 'array-contains', bookId);

    const [targetSnap, offeredSnap] = await Promise.all([
        targetQuery.get(),
        offeredQuery.get(),
    ]);

    // Merge + dedupe by doc path, since a doc could theoretically match both
    const docsById = new Map();
    [...targetSnap.docs, ...offeredSnap.docs].forEach((doc) => {
        docsById.set(doc.ref.path, doc.ref);
    });

    if (docsById.size === 0) {
        console.log(`No pending offers reference book ${bookId}.`);
        return;
    }

    const batch = db.batch();
    docsById.forEach((ref) => {
        batch.update(ref, {
            'offerDetails.status': NEGOTIATION_STATUS.UNAVAILABLE,
            'offerDetails.unavailableAt': Timestamp.now(),
        });
    });

    await batch.commit();
    console.log(`Marked ${docsById.size} offer(s) as unavailable for book ${bookId}.`);
}

// Helper: delete all docs matching a query, chunked into batches of 500
async function deleteQueryResultsInBatches(query) {
    const snapshot = await query.get();
    if (snapshot.empty) return 0;

    const chunks = [];
    let currentBatch = db.batch();
    let count = 0;

    snapshot.forEach((doc) => {
        currentBatch.delete(doc.ref);
        count++;
        if (count % 500 === 0) {
            chunks.push(currentBatch.commit());
            currentBatch = db.batch();
        }
    });

    if (count % 500 !== 0) {
        chunks.push(currentBatch.commit());
    }

    await Promise.all(chunks);
    return count;
}

/**
 * Deletes all `follows` docs matching a query, and decrements the
 * corresponding counter field on the *other* party's user doc for each one.
 *
 * @param {FirebaseFirestore.Query} query
 * @param {(doc: FirebaseFirestore.QueryDocumentSnapshot) => string} getOtherUid
 *   Extracts the other user's UID from each follow doc.
 * @param {string} counterField - which field on the other user's doc to decrement
 */
async function deleteFollowsAndDecrementCounters(query, getOtherUid, counterField) {
    const snapshot = await query.get();
    if (snapshot.empty) return 0;

    const docs = snapshot.docs;
    const CHUNK_SIZE = 250; // 2 writes per doc (delete + decrement) — stays under the 500 write/batch cap

    const chunks = [];
    for (let i = 0; i < docs.length; i += CHUNK_SIZE) {
        chunks.push(docs.slice(i, i + CHUNK_SIZE));
    }

    for (const chunk of chunks) {
        const batch = db.batch();
        chunk.forEach((doc) => {
            batch.delete(doc.ref);
            const otherUid = getOtherUid(doc);
            if (otherUid) {
                batch.update(db.collection('users').doc(otherUid), {
                    [counterField]: FieldValue.increment(-1),
                });
            }
        });
        await batch.commit();
    }

    return docs.length;
}

/**
 * For a batch of publication IDs being deleted, finds every user whose
 * favoriteBooks array references any of them, and removes those IDs
 * from each affected user's array via arrayRemove.
 */
async function removeDeletedPublicationsFromFavorites(pubIds) {
    if (pubIds.length === 0) return 0;

    const QUERY_CHUNK_SIZE = 10; // array-contains-any limit
    let affectedUserCount = 0;

    for (let i = 0; i < pubIds.length; i += QUERY_CHUNK_SIZE) {
        const idChunk = pubIds.slice(i, i + QUERY_CHUNK_SIZE);

        const affectedUsersSnap = await db.collection('users')
            .where('favoriteBooks', 'array-contains-any', idChunk)
            .get();

        if (affectedUsersSnap.empty) continue;

        // arrayRemove accepts multiple values — removes any of idChunk
        // present in each user's array, regardless of which one matched.
        const WRITE_CHUNK_SIZE = 500;
        const docs = affectedUsersSnap.docs;
        for (let j = 0; j < docs.length; j += WRITE_CHUNK_SIZE) {
            const writeBatch = db.batch();
            docs.slice(j, j + WRITE_CHUNK_SIZE).forEach((doc) => {
                writeBatch.update(doc.ref, {
                    favoriteBooks: FieldValue.arrayRemove(...idChunk),
                });
            });
            await writeBatch.commit();
        }

        affectedUserCount += affectedUsersSnap.size;
    }

    return affectedUserCount;
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

        const bucket = getStorage().bucket();

        for (const doc of snapshot.docs) {
            const chatRef = doc.ref;
            const chatId = doc.id;

            console.log(`--- Processing Chat ID: ${chatId} ---`);

            const messagesSnap = await chatRef.collection("messages").get();
            const referencedBookIds = new Set();

            messagesSnap.forEach(msgDoc => {
                const data = msgDoc.data();
                if (data.type === 'offer' && data.offerDetails) {
                    const offer = data.offerDetails;

                    if (offer.targetBookId) referencedBookIds.add(offer.targetBookId);
                    if (offer.finalSelectedBookId) referencedBookIds.add(offer.finalSelectedBookId);

                    if (Array.isArray(offer.offeredBookIds)) {
                        offer.offeredBookIds.forEach(id => {
                            if (id) referencedBookIds.add(id);
                        });
                    }
                }
            });

            console.log(`[LOG] Extracted ${referencedBookIds.size} unique book IDs from chat ${chatId}:`, Array.from(referencedBookIds));

            await db.recursiveDelete(chatRef);
            console.log(`[LOG] Successfully purged Firestore document for chat ID: ${chatId}`);

            for (const bookId of referencedBookIds) {
                console.log(`[LOG] Evaluating book ID: ${bookId} for storage deletion...`);
                try {
                    const pubDoc = await db.collection("publications").doc(bookId).get();

                    if (pubDoc.exists) {
                        console.log(`[LOG] Publication ${bookId} STILL EXISTS in Firestore. Skipping storage deletion.`);
                        continue; // Move to the next book
                    }

                    console.log(`[LOG] Publication ${bookId} is deleted. Initiating safety queries...`);

                    const targetQuery = await db.collectionGroup('messages')
                        .where('offerDetails.targetBookId', '==', bookId)
                        .limit(1)
                        .get();

                    const offeredQuery = await db.collectionGroup('messages')
                        .where('offerDetails.offeredBookIds', 'array-contains', bookId)
                        .limit(1)
                        .get();

                    console.log(`[LOG] Safety Check Results for ${bookId} - Found as target: ${!targetQuery.empty} | Found as offered: ${!offeredQuery.empty}`);

                    if (targetQuery.empty && offeredQuery.empty) {
                        console.log(`[LOG] Book ${bookId} is completely orphaned. Wiping from Storage...`);
                        await bucket.deleteFiles({ 
                            prefix: `books/${bookId}/` 
                        });
                        console.log(`✅ Safely purged completely orphaned images for book: ${bookId}`);
                    } else {
                        console.log(`[LOG] Skipped image deletion for ${bookId}: still referenced in other active chats.`);
                    }

                } catch (internalError) {
                    // This catch block is highly detailed so we can spot missing indexes instantly
                    console.error(`❌ [ERROR] Failed processing book ${bookId} in chat ${chatId}. Reason:`, internalError);

                    if (internalError.message && internalError.message.includes('FAILED_PRECONDITION')) {
                        console.error(`🚨 MISSING INDEX DETECTED! Firestore blocked the query for ${bookId}. Click the link in the error above to create it.`);
                    }
                }
            }
            console.log(`--- Finished Processing Chat ID: ${chatId} ---`);
        }

        console.log("All old conversations and their orphaned media successfully processed.");
    } catch (error) {
        console.error("Fatal error during overall chat cleanup cycle:", error);
    }
});

// ==========================================
// SCHEDULED OLD NOTIFICATIONS PURGE (CRON)
// ==========================================
exports.purgeOldNotifications = onSchedule("0 0 * * *", async (event) => {
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    const cutoffValue = Timestamp.fromDate(fifteenDaysAgo);

    try {
        const snapshot = await db.collectionGroup("notifications")
            .where("createdAt", "<=", cutoffValue)
            .get();

        if (snapshot.empty) {
            console.log("Cleanup complete: No old notifications found.");
            return;
        }

        console.log(`Found ${snapshot.size} old notifications. Initiating deletion process...`);

        const batches = [];
        let currentBatch = db.batch();
        let currentBatchSize = 0;

        for (const doc of snapshot.docs) {
            currentBatch.delete(doc.ref);
            currentBatchSize++;

            if (currentBatchSize === 500) {
                batches.push(currentBatch.commit());
                currentBatch = db.batch();
                currentBatchSize = 0;
            }
        }

        if (currentBatchSize > 0) {
            batches.push(currentBatch.commit());
        }

        await Promise.all(batches);

        console.log(`Successfully purged ${snapshot.size} notifications older than 15 days.`);
    } catch (error) {
        console.error("Fatal error during notifications cleanup cycle:", error);
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

        await sendPushNotification(
            db,
            targetUid,
            "New follow request",
            `${actorName} requested to follow you.`,
            { type: "FOLLOW_REQUEST", requestId: event.params.requestId }
        );
    } catch (error) {
        console.error("Error generating follow request notification:", error);
    }
    return null;
});

// ─── TRIGGER: ON FOLLOW REQUEST DELETED (ACCEPTED OR DECLINED) ───
exports.onFollowRequestDeleted = onDocumentDeleted("followRequests/{requestId}", async (event) => {
    const deletedRequestData = event.data.data();
    if (!deletedRequestData) return null;

    const requesterUid = deletedRequestData.requesterUid;
    const targetUid = deletedRequestData.targetUid;

    try {
        // Reconstruct the exact custom ID used during creation
        const customId = `req_${requesterUid}_${targetUid}`;
        
        // Point directly to the notification document in the recipient's subcollection
        const notificationRef = db
            .collection("users")
            .doc(targetUid)
            .collection("notifications")
            .doc(customId);

        // Delete the notification
        await notificationRef.delete();
        
        console.log(`Successfully deleted pending follow request notification ${customId} for user: ${targetUid}`);
    } catch (error) {
        console.error("Error deleting follow request notification:", error);
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

        await sendPushNotification(
            db,
            followerUid,
            "Follow accepted",
            `${actorName} accepted your follow request.`,
            { type: "NEW_FOLLOW", followId: event.params.followId }
        );
    } catch (error) {
        console.error("Error generating new follow notification:", error);
    }
    return null;
});

// TRIGGER: ON NEW OFFER / COUNTER-OFFER MESSAGE
exports.onOfferMessageCreated = onDocumentCreated("chats/{chatId}/messages/{messageId}", async (event) => {
    const messageData = event.data.data();
    if (!messageData) return null;
    if (messageData.type !== 'offer') return null;

    const chatId = event.params.chatId;
    const senderId = messageData.senderId;
    const offer = messageData.offerDetails;
    const isCounter = offer?.isCounter === true;

    try {
        // Determine the recipient: the chat participant who isn't the sender
        const chatDoc = await db.collection('chats').doc(chatId).get();
        if (!chatDoc.exists) return null;

        const participants = chatDoc.data().participants || [];
        const recipientId = participants.find(uid => uid !== senderId);
        if (!recipientId) return null;

        const actorDoc = await db.collection("users").doc(senderId).get();
        const actorData = actorDoc.data();
        const actorName = actorData?.username || actorData?.displayName || "Someone";
        const actorPhotoURL = actorData?.photoURL || actorData?.avatarUrl || null;

        const notifType = isCounter ? "COUNTER_OFFER" : "SWAP_OFFER";
        const message = isCounter
            ? `${actorName} sent you a counter offer.`
            : `${actorName} sent you a swap offer.`;

        const offerNotif = new Notification({
            type: notifType,
            actorId: senderId,
            actorName: actorName,
            actorPhotoURL: actorPhotoURL,
            targetId: event.params.messageId,
            message: message
        });

        await Notification.sendToUser(db, recipientId, offerNotif, `offer_${event.params.messageId}`);
        console.log(`Offer notification (isCounter=${isCounter}) sent to user: ${recipientId}`);

        await sendPushNotification(
            db,
            recipientId,
            isCounter ? "New counter offer" : "New swap offer",
            message,
            { type: notifType, chatId, messageId: event.params.messageId }
        );
    } catch (error) {
        console.error("Error generating offer notification:", error);
    }
    return null;
});

// TRIGGER: ON OFFER ACCEPTED
exports.onOfferAccepted = onDocumentUpdated("chats/{chatId}/messages/{messageId}", async (event) => {
    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();

    if (!beforeData || !afterData) return null;
    if (afterData.type !== 'offer') return null;

    const beforeStatus = beforeData.offerDetails?.status;
    const afterStatus = afterData.offerDetails?.status;

    if (beforeStatus === afterStatus || afterStatus !== 'accepted') return null;

    const chatId = event.params.chatId;
    const recipientId = afterData.senderId;

    try {
        const chatDoc = await db.collection('chats').doc(chatId).get();
        if (!chatDoc.exists) return null;

        const participants = chatDoc.data().participants || [];
        const actorId = participants.find(uid => uid !== recipientId);
        if (!actorId) return null;

        const actorDoc = await db.collection("users").doc(actorId).get();
        const actorData = actorDoc.data();
        const actorName = actorData?.username || actorData?.displayName || "Someone";
        const actorPhotoURL = actorData?.photoURL || actorData?.avatarUrl || null;

        const message = `${actorName} accepted your swap offer!`;

        const acceptedNotif = new Notification({
            type: "OFFER_ACCEPTED",
            actorId: actorId,
            actorName: actorName,
            actorPhotoURL: actorPhotoURL,
            targetId: event.params.messageId,
            message: message
        });

        await Notification.sendToUser(db, recipientId, acceptedNotif, `accepted_${event.params.messageId}`);
        console.log(`Offer-accepted notification sent to user: ${recipientId}`);

        await sendPushNotification(
            db,
            recipientId,
            "Offer accepted!",
            message,
            { type: "OFFER_ACCEPTED", chatId, messageId: event.params.messageId }
        );
    } catch (error) {
        console.error("Error generating offer-accepted notification:", error);
    }
    return null;
});

// ==========================================
// TRIGGER: ON OFFER DECLINED
// ==========================================
exports.onOfferDeclined = onDocumentUpdated("chats/{chatId}/messages/{messageId}", async (event) => {
    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();

    if (!beforeData || !afterData) return null;
    if (afterData.type !== 'offer') return null;

    const beforeStatus = beforeData.offerDetails?.status;
    const afterStatus = afterData.offerDetails?.status;

    if (beforeStatus === afterStatus || afterStatus !== 'declined') return null;

    const chatId = event.params.chatId;
    const recipientId = afterData.senderId;

    try {
        const chatDoc = await db.collection('chats').doc(chatId).get();
        if (!chatDoc.exists) return null;

        const participants = chatDoc.data().participants || [];
        const actorId = participants.find(uid => uid !== recipientId);
        if (!actorId) return null;

        const actorDoc = await db.collection("users").doc(actorId).get();
        const actorData = actorDoc.data();
        const actorName = actorData?.username || actorData?.displayName || "Someone";
        const actorPhotoURL = actorData?.photoURL || actorData?.avatarUrl || null;

        const message = `${actorName} declined your swap offer.`;

        const declinedNotif = new Notification({
            type: "OFFER_DECLINED",
            actorId: actorId,
            actorName: actorName,
            actorPhotoURL: actorPhotoURL,
            targetId: event.params.messageId,
            message: message
        });

        await Notification.sendToUser(db, recipientId, declinedNotif, `declined_${event.params.messageId}`);
        console.log(`Offer-declined notification sent to user: ${recipientId}`);

        await sendPushNotification(
            db,
            recipientId,
            "Offer declined",
            message,
            { type: "OFFER_DECLINED", chatId, messageId: event.params.messageId }
        );
    } catch (error) {
        console.error("Error generating offer-declined notification:", error);
    }
    return null;
});

// ==========================================
// TRIGGER: ON SWAP CANCELLED
// ==========================================
exports.onSwapCancelled = onDocumentUpdated("chats/{chatId}/messages/{messageId}", async (event) => {
    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();

    if (!beforeData || !afterData) return null;
    if (afterData.type !== 'offer') return null;

    const beforeStatus = beforeData.offerDetails?.status;
    const afterStatus = afterData.offerDetails?.status;

    if (beforeStatus === afterStatus || afterStatus !== 'cancelled') return null;

    const chatId = event.params.chatId;
    const actorId = afterData.offerDetails?.cancelledBy;
    if (!actorId) return null;

    try {
        const chatDoc = await db.collection('chats').doc(chatId).get();
        if (!chatDoc.exists) return null;

        const participants = chatDoc.data().participants || [];
        const recipientId = participants.find(uid => uid !== actorId); // the other person in the swap
        if (!recipientId) return null;

        const actorDoc = await db.collection("users").doc(actorId).get();
        const actorData = actorDoc.data();
        const actorName = actorData?.username || actorData?.displayName || "Someone";
        const actorPhotoURL = actorData?.photoURL || actorData?.avatarUrl || null;

        const message = `${actorName} cancelled the swap agreement.`;

        const cancelledNotif = new Notification({
            type: "SWAP_CANCELLED",
            actorId: actorId,
            actorName: actorName,
            actorPhotoURL: actorPhotoURL,
            targetId: event.params.messageId,
            message: message
        });

        await Notification.sendToUser(db, recipientId, cancelledNotif, `cancelled_${event.params.messageId}`);
        console.log(`Swap-cancelled notification sent to user: ${recipientId}`);

        await sendPushNotification(
            db,
            recipientId,
            "Swap cancelled",
            message,
            { type: "SWAP_CANCELLED", chatId, messageId: event.params.messageId }
        );
    } catch (error) {
        console.error("Error generating swap-cancelled notification:", error);
    }
    return null;
});

exports.onPublicationBecameUnavailable = onDocumentWritten("publications/{publicationId}", async (event) => {
    const publicationId = event.params.publicationId;
    const before = event.data.before?.exists ? event.data.before.data() : null;
    const after = event.data.after?.exists ? event.data.after.data() : null;

    if (!before) return;

    console.log(`Checking pub: ${publicationId}`);
    console.log(`Before status: "${before.status}" | Constant expected: "${PUBLICATION_STATUS_AVAILABLE}"`);
    console.log(`After status: "${after?.status}"`);

    const wasAvailable = before.status === PUBLICATION_STATUS_AVAILABLE;
    const isNowUnavailableOrDeleted = !after || after.status !== PUBLICATION_STATUS_AVAILABLE;

    console.log(`wasAvailable: ${wasAvailable} | isNowUnavailableOrDeleted: ${isNowUnavailableOrDeleted}`);

    if (!wasAvailable || !isNowUnavailableOrDeleted) {
        console.log("Exiting early: Transition criteria not met.");
        return;
    }

    try {
        await markOffersUnavailableForBook(publicationId);
    } catch (error) {
        console.error(`Error marking offers unavailable for book ${publicationId}:`, error);
    }
});

// ==========================================
// TRIGGER: ON AUTH ACCOUNT DELETED
// ==========================================
const functionsV1 = require('firebase-functions/v1');

/**
 * Triggered automatically whenever a user's Firebase Authentication account is deleted.
 * Handles disabling chats, injecting system messages, deleting profile picture files,
 * deleting all publications, and clearing follow/block relationships.
 */
exports.onAuthAccountDeleted = functionsV1
    .region('europe-west1')
    .auth.user().onDelete(async (user) => {
        const userId = user.uid; 
        const batch = db.batch();
        const bucket = getStorage().bucket();

        let hasWrites = false; 
        try {
            const userDocSnap = await db.collection('users').doc(userId).get();
            const userData = userDocSnap.exists ? userDocSnap.data() : null;

            // 1. Delete Publications
            const publicationsSnapshot = await db.collection('publications')
                .where('uid', '==', userId)
                .get();
            if (!publicationsSnapshot.empty) {
                publicationsSnapshot.forEach(doc => {
                    batch.delete(doc.ref);
                });
                hasWrites = true;
                console.log(`Queued ${publicationsSnapshot.size} publications for deletion for user ${userId}`);

                try {
                    const deletedPubIds = publicationsSnapshot.docs.map(doc => doc.id);
                    const affectedCount = await removeDeletedPublicationsFromFavorites(deletedPubIds);
                    console.log(`Removed deleted publications from favoriteBooks for ${affectedCount} user(s).`);
                } catch (favRefCleanupError) {
                    console.warn(`Failed to clean up stale favoriteBooks references for user ${userId}'s publications:`, favRefCleanupError);
                }
            }

            // 2. Disable Chats
            const chatsSnapshot = await db.collection('chats')
                .where('participants', 'array-contains', userId)
                .get();
            if (!chatsSnapshot.empty) {
                chatsSnapshot.forEach(doc => {
                    batch.update(doc.ref, {
                        status: 'disabled',
                        disabledReason: 'deleted' 
                    });
                    const messageRef = doc.ref.collection('messages').doc();
                    batch.set(messageRef, {
                        id: messageRef.id,
                        type: 'system',
                        action: 'deleted', 
                        createdAt: FieldValue.serverTimestamp(),
                        senderId: 'system'
                    });
                });
                hasWrites = true;
                console.log(`Queued status updates for ${chatsSnapshot.size} chats.`);
            }

            // 3. Clean up Follows, Requests, AND Blocks
            try {
                const [
                    followingDeleted,
                    followersDeleted,
                    sentRequestsDeleted,
                    receivedRequestsDeleted,
                    outgoingBlocksDeleted,
                    incomingBlocksDeleted
                ] = await Promise.all([
                        deleteFollowsAndDecrementCounters(
                            db.collection('follows').where('followerUid', '==', userId),
                            (doc) => doc.data().followingUid,
                            'followersCount'
                        ),
                        deleteFollowsAndDecrementCounters(
                            db.collection('follows').where('followingUid', '==', userId),
                            (doc) => doc.data().followerUid,
                            'followingCount'
                        ),
                        deleteQueryResultsInBatches(db.collection('followRequests').where('requesterUid', '==', userId)),
                        deleteQueryResultsInBatches(db.collection('followRequests').where('targetUid', '==', userId)),

                        deleteQueryResultsInBatches(db.collection('blocks').where('blockerUid', '==', userId)),
                        deleteQueryResultsInBatches(db.collection('blocks').where('blockedUid', '==', userId)),
                    ]);
                console.log(`Cleaned up relationships for user ${userId}: ${followingDeleted} following, ${followersDeleted} followers, ${sentRequestsDeleted} sent reqs, ${receivedRequestsDeleted} received reqs, ${outgoingBlocksDeleted} outgoing blocks, ${incomingBlocksDeleted} incoming blocks.`);
            } catch (relationshipCleanupError) {
                console.warn(`Failed to clean up relationships (follows/blocks) for user ${userId}:`, relationshipCleanupError);
            }

            // 4. Clean up Favorited Publications Count
            try {
                const favoriteBookIds = userData?.favoriteBooks || [];
                if (favoriteBookIds.length > 0) {
                    const CHUNK_SIZE = 500;
                    const chunks = [];
                    for (let i = 0; i < favoriteBookIds.length; i += CHUNK_SIZE) {
                        chunks.push(favoriteBookIds.slice(i, i + CHUNK_SIZE));
                    }
                    for (const chunk of chunks) {
                        const favBatch = db.batch();
                        chunk.forEach((pubId) => {
                            favBatch.update(db.collection('publications').doc(pubId), {
                                'stats.likesCount': FieldValue.increment(-1),
                            });
                        });
                        await favBatch.commit();
                    }
                    console.log(`Decremented likesCount on ${favoriteBookIds.length} publication(s) previously favorited by user ${userId}.`);
                }
            } catch (favoritesCleanupError) {
                console.warn(`Failed to decrement favorite counts for user ${userId}:`, favoritesCleanupError);
            }

            // 5. Delete User Document
            batch.delete(db.collection('users').doc(userId));
            hasWrites = true;

            // 6. Delete Profile Pictures from Storage
            try {
                await bucket.deleteFiles({ 
                    prefix: `profile_pictures/${userId}/` 
                });
                console.log(`Successfully deleted profile picture storage files for user ${userId}`);
            } catch (storageError) {
                console.warn(`Failed to delete storage files for user ${userId} (they might not have had a custom photo):`, storageError);
            }

            // 7. Commit the batch
            if (hasWrites) {
                await batch.commit();
                console.log(`Successfully completed Firestore cleanup batch for user ${userId}`);
            } else {
                console.log(`No Firestore documents to clean up for user ${userId}`);
            }
            return null;
        } catch (error) {
            console.error(`Error processing account deletion cleanup for user ${userId}:`, error);
            throw error; 
        }
    });

// ==========================================
// ADMIN: SET USER ADMIN STATUS
// ==========================================
exports.setAdminStatus = onCall(async (request) => {
    // 1. Force authentication check
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Authentication is required to perform this action.");
    }

    // 2. TOKEN-BACKED CLAIM CHECK: Only existing admins can assign other admins
    if (request.auth.token.role !== "admin") {
        throw new HttpsError("permission-denied", "Unauthorized. Only administrators can change user roles.");
    }

    const { targetUid, makeAdmin } = request.data;

    if (!targetUid) {
        throw new HttpsError("invalid-argument", "The 'targetUid' parameter is required.");
    }

    const newRole = makeAdmin === true ? "admin" : "user";

    try {
        // 3. Cryptographically bake the role into the target user's Auth Token
        await getAuth().setCustomUserClaims(targetUid, { role: newRole });

        // 4. Sync the role with their Firestore user document for UI queries
        await db.collection("users").doc(targetUid).update({
            role: newRole
        });

        console.log(`[ADMIN] User ${targetUid} role successfully set to '${newRole}' by Admin ${request.auth.uid}.`);
        
        return { 
            success: true, 
            message: `User role successfully changed to ${newRole}.` 
        };
    } catch (error) {
        console.error("Error setting admin claims:", error);
        throw new HttpsError("internal", "An error occurred while updating user privileges.");
    }
});

exports.banUser = functions.https.onCall(async (data, context) => {
    // Confirma se o utilizador que está a fazer o pedido está autenticado e é Admin
    if (!context.auth || context.auth.token.role !== 'admin') {
        throw new functions.https.HttpsError(
            'permission-denied',
            'Apenas administradores podem banir utilizadores.'
        );
    }

    const targetUid = data.uid;
    const banReason = data.reason || 'Without specified motive';

    if (!targetUid)
        throw new functions.https.HttpsError(
            'invalid-argument',
            'The UID of the user to ban is mandatory.'
        );

    const db = admin.firestore();

    try {
        // Obter os dados atuais do utilizador na coleção 'users'
        const userRef = db.collection('users').doc(targetUid);
        const userSnap = await userRef.get();

        if (!userSnap.exists)
            throw new functions.https.HttpsError(
                'not-found',
                'User not found in users collection.'
            );

        const userData = userSnap.data();

        // Preparar o documento com a metadata do banimento
        const bannedData = {
            ...userData,
            bannedAt: admin.firestore.FieldValue.serverTimestamp(),
            bannedBy: context.auth.uid, // Regista qual foi o admin que deu o ban
            banReason: banReason
        };

        // Utilizar um Batch para garantir a integridade dos dados
        const batch = db.batch();
        const bannedRef = db.collection('banned').doc(targetUid);

        // Adiciona à coleção 'banned' com o mesmo UID
        batch.set(bannedRef, bannedData);
        // Remove da coleção 'users'
        batch.delete(userRef);

        // Executa as duas operações no Firestore em simultâneo
        await batch.commit();

        // Desativar a conta na Firebase Auth (bloqueia o login real)
        await admin.auth().updateUser(targetUid, {
            disabled: true
        });

        // Opcional: Aqui podes também chamar a lógica para limpar as publicações/ofertas dele
        // ou mudar o estado dos reports associados a este utilizador para ACTIONED.

        return {
            success: true,
            message: `Utilizador ${targetUid} foi movido para a coleção banned e desativado.`
        };

    } catch (error) {
        console.error("Erro ao executar banUser:", error);
        throw new functions.https.HttpsError(
            'internal',
            'Ocorreu um erro interno ao banir o utilizador.'
        );
    }
});
