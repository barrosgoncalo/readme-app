import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@readme/shared/src/contexts/AuthContext/web';
import { getEvent, getAttendees, isAttending, joinEvent, leaveEvent } from '@readme/shared/src/services/events';
import { getUsersByIds } from '@readme/shared/src/services/users';
import { WEB_ROUTES } from '../../constants/webRoutes';
import Spinner from '../../components/Spinner.jsx';
import ErrorAlert from '../../components/ErrorAlert.jsx';
import Button from '../../components/Button.jsx';
import styles from './Details.module.css';

export default function EventDetails() {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const uid = currentUser?.uid;

    const [event, setEvent] = useState(null);
    const [attendees, setAttendees] = useState([]);
    const [attending, setAttending] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userNames, setUserNames] = useState({});
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const eventData = await getEvent(eventId);
            if (!eventData) {
                setError('Event not found.');
                return;
            }

            const attendeeList = await getAttendees(eventId);
            const isGoing = uid ? await isAttending(eventId, uid) : false;

            setEvent(eventData);
            setAttendees(attendeeList);
            setAttending(isGoing);

            // Hydrate organiser + attendee names
            const uids = new Set([eventData.ownerId, ...attendeeList.map((a) => a.uid)]);
            if (uids.size > 0) {
                const names = await getUsersByIds(Array.from(uids));
                setUserNames(names);
            }
        } catch (err) {
            setError(err.message || 'Could not load event.');
        } finally {
            setLoading(false);
        }
    }, [eventId, uid]);

    useEffect(() => { load(); }, [load]);

    async function handleToggleAttendance() {
        if (!uid || !event) return;
        setBusy(true);
        try {
            if (attending) {
                await leaveEvent(eventId, uid);
            } else {
                await joinEvent(eventId, uid);
            }
            await load();
        } catch (err) {
            setError(err.message || 'Could not update attendance.');
        } finally {
            setBusy(false);
        }
    }

    if (loading) return <div className={styles.page}><Spinner center label="Loading event" /></div>;
    if (!event) {
        return (
            <div className={styles.page}>
                <ErrorAlert>{error || 'Event not found.'}</ErrorAlert>
                <Button onClick={() => navigate(WEB_ROUTES.EVENTS)}>Back to events</Button>
            </div>
        );
    }

    const date = new Date(event.startsAt);
    const dateStr = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const isOrganiser = uid === event.ownerId;
    const organiserName = userNames[event.ownerId]?.username || 'Unknown';

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <button type="button" className={styles.backLink} onClick={() => navigate(WEB_ROUTES.EVENTS)}>
                    ← Back to events
                </button>
            </div>

            <ErrorAlert>{error}</ErrorAlert>

            <div className={styles.card}>
                <div className={styles.titleSection}>
                    <h1 className={styles.title}>{event.title}</h1>
                    <span className={styles.badge}>{event.type}</span>
                </div>

                <p className={styles.description}>{event.description}</p>

                <div className={styles.details}>
                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>When:</span>
                        <span>{dateStr} at {timeStr}</span>
                    </div>
                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Where:</span>
                        <span>{event.location.label}</span>
                    </div>
                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Organiser:</span>
                        <span>{organiserName}</span>
                    </div>
                </div>

                <div className={styles.attendeesSection}>
                    <h2 className={styles.sectionTitle}>Attendees ({event.attendeeCount})</h2>
                    {attendees.length === 0 ? (
                        <p className={styles.noAttendees}>No one has joined yet.</p>
                    ) : (
                        <div className={styles.attendeesList}>
                            {attendees.map((attendee) => (
                                <div key={attendee.uid} className={styles.attendeeChip}>
                                    {userNames[attendee.uid]?.username || attendee.uid}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {isOrganiser ? (
                    <div className={styles.organiserBadge}>You're the organiser</div>
                ) : (
                    <Button
                        onClick={handleToggleAttendance}
                        disabled={busy}
                        variant={attending ? 'ghost' : undefined}
                    >
                        {attending ? 'Leave event' : 'Join event'}
                    </Button>
                )}
            </div>
        </div>
    );
}
