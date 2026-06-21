import { db } from './firebase.web';
import {
    collection, addDoc, getDocs, getDoc, doc, query, where, setDoc, deleteDoc, updateDoc, writeBatch,
} from 'firebase/firestore';

const EVENTS_COLLECTION = 'events';

export async function createEvent({ ownerId, title, description, type, startsAt, location }) {
    const now = new Date().toISOString();
    const eventRef = await addDoc(collection(db, EVENTS_COLLECTION), {
        ownerId,
        title,
        description,
        type,
        startsAt,
        location,
        attendeeCount: 0,
        createdAt: now,
    });
    return eventRef.id;
}

export async function getUpcomingEvents() {
    const now = new Date().toISOString();
    const q = query(collection(db, EVENTS_COLLECTION), where('startsAt', '>=', now));
    const snapshot = await getDocs(q);
    const events = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    events.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
    return events;
}

export async function getEvent(eventId) {
    const snap = await getDoc(doc(db, EVENTS_COLLECTION, eventId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getAttendees(eventId) {
    const attendeesRef = collection(db, EVENTS_COLLECTION, eventId, 'attendees');
    const snapshot = await getDocs(attendeesRef);
    return snapshot.docs.map((d) => ({ uid: d.id, joinedAt: d.data().joinedAt }));
}

export async function isAttending(eventId, uid) {
    const snap = await getDoc(doc(db, EVENTS_COLLECTION, eventId, 'attendees', uid));
    return snap.exists();
}

export async function joinEvent(eventId, uid) {
    const batch = writeBatch(db);

    const attendeeRef = doc(db, EVENTS_COLLECTION, eventId, 'attendees', uid);
    batch.set(attendeeRef, {
        joinedAt: new Date().toISOString(),
    });

    const eventRef = doc(db, EVENTS_COLLECTION, eventId);
    const event = await getEvent(eventId);
    batch.update(eventRef, {
        attendeeCount: event.attendeeCount + 1,
    });

    await batch.commit();
}

export async function leaveEvent(eventId, uid) {
    const batch = writeBatch(db);

    const attendeeRef = doc(db, EVENTS_COLLECTION, eventId, 'attendees', uid);
    batch.delete(attendeeRef);

    const event = await getEvent(eventId);
    const eventRef = doc(db, EVENTS_COLLECTION, eventId);
    batch.update(eventRef, {
        attendeeCount: Math.max(0, event.attendeeCount - 1),
    });

    await batch.commit();
}
