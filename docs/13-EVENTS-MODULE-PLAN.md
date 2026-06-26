# Events module — implementation plan

> Status: implemented. Shipped as of this session with full list, create, and detail pages.

## Context

The web app had Books ✅, Trades ✅, and Profile ✅, but no way for the community to gather around events. Events are the social layer that turns a catalog into a community — members create reading groups, lectures, and roundtable discussions; others join and meet in person.

The Firestore schema (`events/{eventId}` with `attendees/` and `messages/` subcollections) and security rules were already designed in advance. This slice implements **list, create, detail, and join/leave** — the per-event chat (`messages` subcollection) is deferred to a follow-up slice to keep scope tight.

### Decisions locked

- **Scope:** List + create + detail + join/leave. No chat (messages) in this slice.
- **Location:** Free-text label only for now. Lat/lng will be added later by the Map slice with geocoding.
- **Organisers:** Can create events. Cannot leave their own events (no edit/delete UI yet). Display a "You're the organiser" badge instead of a join button.

---

## Implementation summary

### 1. Backend (shared services)

**`packages/shared/src/services/events.js` + `events.web.js`**
- `createEvent({ ownerId, title, description, type, startsAt, location })` — creates event with `attendeeCount: 0`
- `getUpcomingEvents()` — returns all events where `startsAt >= now`, sorted ascending
- `getEvent(eventId)` — fetches a single event
- `getAttendees(eventId)` — list of attendees with UIDs and join times
- `isAttending(eventId, uid)` — boolean check
- `joinEvent(eventId, uid)` — atomic Firestore transaction: create attendee doc + increment count
- `leaveEvent(eventId, uid)` — atomic transaction: delete attendee doc + decrement count

### 2. Web routing

- Added `EVENTS: '/events'` to `webRoutes.js`
- Registered `/events` route pointing to the new list page
- Kept existing `/events/:eventId` route pointing to the detail page
- Replaced the stub **Community** nav item with **Events** (removed dead chat link)

### 3. Web UI

**List page (`apps/web/src/pages/Events/index.jsx`)**
- Fetches upcoming events on mount, sorted by date
- Empty state with CTA to create first event
- Inline create form (toggled by button, matches AddBookForm pattern)
- EventCard list with date, location, type badge, attendee count

**Create form (`CreateEventForm.jsx`)**
- Fields: title, description (textarea), type (select: reading/lecture/roundtable), date/time (datetime-local input), location label
- Converts datetime-local to ISO string on submit
- Mirrors AddBookForm UX (cancel, busy state, error alert)

**Detail page (`Details.jsx`)**
- Fetches event + attendees + organiser/attendee names in parallel
- Shows full event details: title, type, formatted date/time, location, organiser, description
- Attendee list with chips showing usernames
- **Join/Leave button** with optimistic update (same as Trades favorite toggle)
  - If user is organiser: shows "You're the organiser" badge instead
  - Otherwise: toggle button calls `joinEvent` / `leaveEvent` + reloads
- Loading state: `<Spinner>`. Not found: friendly error message + back link

**EventCard (`EventCard.jsx`)**
- Left-side coloured accent bar (type-dependent: reading/lecture/roundtable)
- Title, date/time, location label, type badge, attendee count icon
- Clickable → navigates to `/events/:eventId`

### 4. Out of scope (intentionally)

- Per-event chat (`messages`) — scheduled for a follow-up slice; needs `onSnapshot` listeners
- Event editing / deletion — organisers can't modify events yet
- Lat/lng discovery — Map slice will add geocoding later
- Mobile Expo screens — separate task

---

## Testing

1. Build passes: `npx vite build` (1836+ modules)
2. Nav shows new **Events** item with CalendarDays icon
3. Click Events → list page, initially empty
4. Create event → form opens, fill in fields, submit
5. Event appears in list, formatted with date/time, location, attendee count = 0
6. Click event → detail page loads with full info
7. (2nd account) Open same `/events/:eventId` URL, click **Join** → count flips to 1, name appears in attendees
8. Reload → attendee list persists
9. Click **Leave** → count back to 0
10. (1st account) Check "You're the organiser" badge on their own event (no join button)

---

## Files changed

**Created**
- `packages/shared/src/services/events.js` + `events.web.js`
- `apps/web/src/pages/Events/index.jsx` + `Events.module.css`
- `apps/web/src/pages/Events/Details.jsx` + `Details.module.css`
- `apps/web/src/pages/Events/components/EventCard.jsx` (+ css)
- `apps/web/src/pages/Events/components/CreateEventForm.jsx` (+ css)
- `docs/13-EVENTS-MODULE-PLAN.md`

**Modified**
- `apps/web/src/constants/webRoutes.js` — added `EVENTS`
- `apps/web/src/routes/AppRouter.jsx` — registered Events route
- `apps/web/src/components/AppShell.jsx` — swapped Community nav for Events

**Unchanged**
- Firestore schema (already correct)
- Security rules (no changes needed — `events` collection already readable/writable per rules)
