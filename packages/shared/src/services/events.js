// @readme/shared/src/services/events.js

import { DB } from './DB';

const EVENTS_COLLECTION = 'events';

export async function createEvent({ ownerId, title, description, type, startsAt, location }) {
    return await DB.create(EVENTS_COLLECTION, {
        ownerId,
        title,
        description,
        type,
        startsAt,
        location,
        attendeeCount: 0,
    });
}

export async function getUpcomingEvents() {
    const now = new Date().toISOString();
    
    const events = await DB.get(EVENTS_COLLECTION, [
        { field: 'startsAt', operator: '>=', value: now }
    ]);
    
    return events.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
}

export async function getEvent(eventId) {
    return await DB.get(EVENTS_COLLECTION, eventId);
}

export async function getAttendees(eventId) {
    const attendees = await DB.get(`events/${eventId}/attendees`, []);
    
    return attendees.map((d) => ({ uid: d.id, joinedAt: d.joinedAt }));
}

export async function isAttending(eventId, uid) {
    const snap = await DB.get(`events/${eventId}/attendees`, uid);
    return !!snap;
}

export async function joinEvent(eventId, uid) {
    const event = await getEvent(eventId);
    if (!event) return;

    const currentCount = event.attendeeCount || 0;

    await Promise.all([
        DB.create(`events/${eventId}/attendees`, { joinedAt: new Date().toISOString() }, uid),
        DB.update(EVENTS_COLLECTION, eventId, { attendeeCount: currentCount + 1 })
    ]);
}

export async function leaveEvent(eventId, uid) {
    const event = await getEvent(eventId);
    if (!event) return;

    const currentCount = event.attendeeCount || 0;

    await Promise.all([
        DB.remove(`events/${eventId}/attendees`, uid),
        DB.update(EVENTS_COLLECTION, eventId, { attendeeCount: Math.max(0, currentCount - 1) })
    ]);
}
