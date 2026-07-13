const { FieldValue } = require("firebase-admin/firestore");

class Notification {
    constructor({ type, actorId, actorName, targetId, message }) {
        this.type = type;
        this.actorId = actorId;
        this.actorName = actorName; 
        this.targetId = targetId;
        this.message = message;
        this.isRead = false;
    }

    toFirestore() {
        return {
            type: this.type,
            actorId: this.actorId,
            actorName: this.actorName,
            targetId: this.targetId,
            message: this.message,
            isRead: this.isRead,
            createdAt: FieldValue.serverTimestamp()
        };
    }

    // Static helper to quickly save to a specific user's subcollection
    static async sendToUser(db, targetUserId, notificationInstance) {
        const notifRef = db.collection("users").doc(targetUserId).collection("notifications").doc();
        const payload = notificationInstance.toFirestore();
        payload.id = notifRef.id;
        
        await notifRef.set(payload);
        return payload.id;
    }
}

module.exports = Notification;
