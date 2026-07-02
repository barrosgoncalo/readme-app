import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@readme/shared/src/contexts/AuthContext/web';
import { getUpcomingEvents, createEvent as createEventService } from '@readme/shared/src/services/events';
import { doGetBlockedUids } from '@readme/shared/src/services/blockUser';
import Spinner from '../../components/Spinner.jsx';
import ErrorAlert from '../../components/ErrorAlert.jsx';
import Button from '../../components/Button.jsx';
import EventCard from './components/EventCard.jsx';
import CreateEventForm from './components/CreateEventForm.jsx';
import styles from './Events.module.css';

export default function Events() {
    const { currentUser } = useAuth();
    const uid = currentUser?.uid;

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [upcoming, blockedUids] = await Promise.all([
                getUpcomingEvents(),
                uid ? doGetBlockedUids(uid).catch(() => new Set()) : Promise.resolve(new Set()),
            ]);
            setEvents(upcoming.filter(e => !blockedUids.has(e.ownerId)));
        } catch (err) {
            setError(err.message || 'Could not load events.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    async function handleCreate(data) {
        if (!uid) return;
        setCreating(true);
        setCreateError(null);
        try {
            await createEventService({
                ownerId: uid,
                title: data.title,
                description: data.description,
                type: data.type,
                startsAt: data.startsAt,
                location: { label: data.locationLabel },
            });
            setShowForm(false);
            await load();
        } catch (err) {
            setCreateError(err.message || 'Could not create event.');
        } finally {
            setCreating(false);
        }
    }

    if (loading) return <div className={styles.page}><Spinner center label="Loading events" /></div>;

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Events</h1>
                {!showForm && events.length > 0 && (
                    <Button onClick={() => setShowForm(true)}>Create event</Button>
                )}
            </div>

            <ErrorAlert>{error}</ErrorAlert>

            {showForm && (
                <CreateEventForm
                    onSubmit={handleCreate}
                    onCancel={() => { setShowForm(false); setCreateError(null); }}
                    submitting={creating}
                    error={createError}
                />
            )}

            {events.length === 0 && !showForm ? (
                <div className={styles.empty}>
                    <p className={styles.emptyTitle}>No upcoming events</p>
                    <p>Create the first event to get started.</p>
                    <div style={{ maxWidth: 240, margin: '16px auto 0' }}>
                        <Button onClick={() => setShowForm(true)}>Create event</Button>
                    </div>
                </div>
            ) : (
                <div className={styles.list}>
                    {events.map((event) => (
                        <EventCard key={event.id} event={event} />
                    ))}
                </div>
            )}
        </div>
    );
}
