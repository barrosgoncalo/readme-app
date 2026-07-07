const { setGlobalOptions } = require("firebase-functions/v2");
const { onDocumentWritten, onDocumentCreated } = require("firebase-functions/v2/firestore");
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

// ==========================================
// ALGOLIA USER SYNC FUNCTION
// ==========================================
// Gen 2 function immune to the region bug
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
