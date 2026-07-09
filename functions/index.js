const { setGlobalOptions } = require("firebase-functions/v2");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentWritten, onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { algoliasearch } = require("algoliasearch");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

// Initialize Firebase Admin for server-side database access
initializeApp();
const db = getFirestore();

// Set global options for all functions
setGlobalOptions({ maxInstances: 10 });

const ALGOLIA_APP_ID = "RHUIQIPTCY";
// Note: In production, consider using Firebase Secret Manager for admin keys
const ALGOLIA_ADMIN_KEY = "e8307a98c93b8ca65d21e1ba2faa1e55"; 
const ALGOLIA_INDEX_NAME = "users";

// Direct initialization of the v5 client (without initIndex)
const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY);

const ALGOLIA_PUBLICATIONS_INDEX = "publications";


// ==========================================
// ALGOLIA USER SYNC FUNCTION
// ==========================================
exports.syncUserToAlgolia = onDocumentWritten({ document: "users/{userId}", region: "europe-west1" }, async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const data = snapshot.after.data();
    const objectID = event.params.userId;

    try {
        // If the document was deleted in Firestore, delete it in Algolia
        if (!data) {
            await client.deleteObject({
                indexName: ALGOLIA_INDEX_NAME,
                objectID: objectID
            });
            console.log(`User ${objectID} successfully deleted from Algolia.`);
            return;
        }

        // If it was created or updated, save it to Algolia
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
exports.updateUserRating = onDocumentCreated({ document: "reviews/{reviewId}", region: "europe-west1" }, async (event) => {
    // 1. Get the data from the newly created review
    const newReview = event.data.data();
    if (!newReview) return null;

    const revieweeId = newReview.revieweeId; // The user receiving the rating
    const newRating = Number(newReview.rating); // The rating given (1 to 5)

    // 2. Reference to the evaluated user's document
    const userRef = db.collection('users').doc(revieweeId);

    try {
        // 3. Use a transaction to ensure integrity if multiple reviews arrive at the exact same time
        await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            
            if (!userDoc.exists) {
                console.log(`User ${revieweeId} not found. Cannot update rating.`);
                return;
            }

            const userData = userDoc.data();
            const currentRating = Number(userData.rating) || 0;
            const currentCount = Number(userData.reviewCount) || 0;

            // 4. Moving average formula to calculate the new rating
            const nextCount = currentCount + 1;
            const nextRating = ((currentRating * currentCount) + newRating) / nextCount;

            // 5. Update the user's profile with the new denormalized data
            transaction.update(userRef, {
                rating: Number(nextRating.toFixed(2)), // Keep it to 2 decimal places
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
exports.syncPublicationToAlgolia = onDocumentWritten({ document: "publications/{publicationId}", region: "europe-west1" }, async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const data = snapshot.after.data();
    const objectID = event.params.publicationId;

    try {
        // If the document was deleted in Firestore, delete it in Algolia
        if (!data) {
            await client.deleteObject({
                indexName: ALGOLIA_PUBLICATIONS_INDEX,
                objectID: objectID
            });
            console.log(`Publication ${objectID} successfully deleted from Algolia.`);
            return;
        }

        // If it was created or updated, save it to Algolia
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
// DELETE BOOKS ON SWAP COMPLETED FUNCTION
// ==========================================

exports.deleteBooksOnSwapComplete = onDocumentUpdated({ document: "chats/{chatId}/messages/{messageId}", region: "europe-west1" }, async (event) => {
    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();

    // Safety check: ensure data exists
    if (!beforeData || !afterData) return;

    // We only care about messages of type 'offer'
    if (afterData.type !== 'offer') return;

    const beforeStatus = beforeData.offerDetails?.status;
    const afterStatus = afterData.offerDetails?.status;

    // Check if the status JUST changed to 'completed'
    if (beforeStatus !== 'completed' && afterStatus === 'completed') {
        const targetBookId = afterData.offerDetails?.targetBookId;
        const finalSelectedBookId = afterData.offerDetails?.finalSelectedBookId || afterData.offerDetails?.selectedBookId;

        console.log(`Swap completed! Deleting books: Target(${targetBookId}), Selected(${finalSelectedBookId})`);

        try {
            // Using a batch to delete both simultaneously
            const batch = db.batch();

            if (targetBookId) {
                batch.delete(db.collection('publications').doc(targetBookId));
            }
            if (finalSelectedBookId) {
                batch.delete(db.collection('publications').doc(finalSelectedBookId));
            }

            await batch.commit();
            console.log("Successfully deleted swapped books via Admin SDK.");
        } catch (error) {
            console.error("Error deleting books on swap completion:", error);
        }
    }
});


// ==========================================
// VERIFY SWAP CODE FUNCTION
// ==========================================

exports.verifySwapCode = onCall({ region: "europe-west1" }, async (request) => {
    // Extract data sent from the React Native app
    const { chatId, messageId, scannedCode } = request.data;
    const uid = request.auth?.uid;

    // Security check: Ensure the user is logged in
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

        // Compare the codes on the server
        if (scannedCode !== expectedCode) {
            // Throwing an error here sends it straight to the React Native 'catch' block
            throw new HttpsError("invalid-argument", "The scanned code is incorrect.");
        }

        // If correct, update the status! 
        // NOTE: This will automatically trigger your OTHER function (deleteBooksOnSwapComplete)
        await messageRef.update({
            "offerDetails.status": "completed"
        });

        return { success: true };
    } catch (error) {
        console.error("Verification error:", error);
        // Re-throw HttpsErrors so the client receives the exact message
        if (error instanceof HttpsError) throw error;
        throw new HttpsError("internal", "An error occurred during verification.");
    }
});
