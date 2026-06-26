import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users } from 'lucide-react';
import { WEB_ROUTES } from '../../../constants/webRoutes';
import styles from './EventCard.module.css';

export default function EventCard({ event }) {
    const navigate = useNavigate();
    const date = new Date(event.startsAt);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const typeBadgeColors = {
        reading: '#5E7FBB',
        lecture: '#8B6B9E',
        roundtable: '#6BA587',
    };

    return (
        <button
            type="button"
            className={styles.card}
            onClick={() => navigate(WEB_ROUTES.eventDetails(event.id))}
        >
            <div
                className={styles.accent}
                style={{ backgroundColor: typeBadgeColors[event.type] || '#999' }}
            />

            <div className={styles.body}>
                <div>
                    <p className={styles.title}>{event.title}</p>
                    <div className={styles.meta}>
                        <div className={styles.metaItem}>
                            <Calendar size={14} />
                            <span>{dateStr} at {timeStr}</span>
                        </div>
                        <div className={styles.metaItem}>
                            <MapPin size={14} />
                            <span>{event.location.label}</span>
                        </div>
                    </div>
                </div>
                <div className={styles.footer}>
                    <span className={styles.badge}>{event.type}</span>
                    <div className={styles.attendees}>
                        <Users size={14} />
                        <span>{event.attendeeCount}</span>
                    </div>
                </div>
            </div>
        </button>
    );
}
