const { Expo } = require("expo-server-sdk");

const expo = new Expo();

/**
 * Sends a push notification to all of a user's registered devices.
 * Fetches delivery receipts shortly after sending and prunes any
 * tokens Expo reports as no longer registered.
 */
async function sendPushNotification(db, userId, title, body, data = {}) {
    try {
        const userDoc = await db.collection("users").doc(userId).get();
        if (!userDoc.exists) {
            console.log(`[Push] User ${userId} not found, skipping push.`);
            return;
        }

        const userData = userDoc.data();

        if (userData?.notificationSettings?.pushEnabled !== true) {
            console.log(`[Push] User ${userId} has push notifications disabled, skipping.`);
            return;
        }

        const pushTokens = userData?.pushTokens || [];
        if (pushTokens.length === 0) {
            console.log(`[Push] No push tokens for user ${userId}, skipping.`);
            return;
        }

        const validTokens = pushTokens.filter((t) => Expo.isExpoPushToken(t));
        const invalidTokens = pushTokens.filter((t) => !Expo.isExpoPushToken(t));

        // Malformed tokens (fail basic format check) can be pruned immediately,
        // no need to even send/wait for a receipt on these.
        if (invalidTokens.length > 0) {
            console.warn(`[Push] Removing malformed tokens for ${userId}:`, invalidTokens);
            await removeDeadTokens(db, userId, invalidTokens);
        }

        if (validTokens.length === 0) return;

        const messages = validTokens.map((pushToken) => ({
            to: pushToken,
            sound: "default",
            title,
            body,
            data,
        }));

        const chunks = expo.chunkPushNotifications(messages);
        const tickets = [];

        for (const chunk of chunks) {
            const chunkTickets = await expo.sendPushNotificationsAsync(chunk);
            tickets.push(...chunkTickets);
        }

        console.log(`[Push] Sent to ${userId}:`, tickets);

        // Pair each ticket with the token that produced it, so we know
        // which specific token to prune if its receipt comes back bad.
        const ticketTokenPairs = tickets.map((ticket, i) => ({
            ticket,
            token: validTokens[i],
        }));

        await checkReceiptsAndPrune(db, userId, ticketTokenPairs);
    } catch (error) {
        console.error(`[Push] Failed to send push to ${userId}:`, error);
    }
}

/**
 * Fetches delivery receipts for a batch of tickets and removes any
 * tokens Expo reports as DeviceNotRegistered (i.e. dead/uninstalled).
 * Expo recommends waiting a bit before checking receipts, but since this
 * runs after a Firestore write already completed, sending is usually
 * enough of a delay in practice; if not, receipts just return unresolved
 * and get skipped this round.
 */
async function checkReceiptsAndPrune(db, userId, ticketTokenPairs) {
    const ticketIds = ticketTokenPairs
    .filter(({ ticket }) => ticket.status === "ok" && ticket.id)
    .map(({ ticket }) => ticket.id);

    if (ticketIds.length === 0) return;

    const receiptChunks = expo.chunkPushNotificationReceiptIds(ticketIds);
    const deadTokens = [];

    for (const chunk of receiptChunks) {
        try {
            const receipts = await expo.getPushNotificationReceiptsAsync(chunk);
            for (const receiptId in receipts) {
                const receipt = receipts[receiptId];
                if (receipt.status === "error" && receipt.details?.error === "DeviceNotRegistered") {
                    const pair = ticketTokenPairs.find((p) => p.ticket.id === receiptId);
                    if (pair) deadTokens.push(pair.token);
                }
            }
        } catch (error) {
            console.warn("[Push] Failed to fetch receipts chunk:", error);
        }
    }

    if (deadTokens.length > 0) {
        console.warn(`[Push] Pruning dead tokens for ${userId}:`, deadTokens);
        await removeDeadTokens(db, userId, deadTokens);
    }
}

async function removeDeadTokens(db, userId, tokensToRemove) {
    const { FieldValue } = require("firebase-admin/firestore");
    await db.collection("users").doc(userId).update({
        pushTokens: FieldValue.arrayRemove(...tokensToRemove),
    });
}

module.exports = { sendPushNotification };
