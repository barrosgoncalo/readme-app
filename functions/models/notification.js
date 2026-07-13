const { FieldValue } = require("firebase-admin/firestore");

class Notification {
    constructor({ type, actorId, actorName, actorPhotoURL, targetId, message }) {
        this.type = type;
        this.actorId = actorId;
        this.actorName = actorName; 
        this.actorPhotoURL = actorPhotoURL || null; // Saved in instance state
        this.targetId = targetId;
        this.message = message;
        this.isRead = false;
    }

    toFirestore() {
        return {
            type: this.type,
            actorId: this.actorId,
            actorName: this.actorName,
            actorPhotoURL: this.actorPhotoURL, // Added to the Firestore database payload
            targetId: this.targetId,
            message: this.message,
            isRead: this.isRead,
            createdAt: FieldValue.serverTimestamp()
        };
    }

    static async sendToUser(db, targetUserId, notificationInstance, customId = null) {
        const notificationsRef = db.collection("users").doc(targetUserId).collection("notifications");
        const notifRef = customId ? notificationsRef.doc(customId) : notificationsRef.doc();
        
        const payload = notificationInstance.toFirestore();
        payload.id = notifRef.id;
        
        await notifRef.set(payload);
        return payload.id;
    }
}

module.exports = Notification;
