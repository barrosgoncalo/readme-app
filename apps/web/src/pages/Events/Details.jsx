import { useParams } from 'react-router-dom';

export default function EventDetails() {
    const { eventId } = useParams();

    return (
        <div style={{ maxWidth: 'var(--max-content-width)', margin: '0 auto', padding: 'var(--space-5) var(--space-4)' }}>
            <h1 style={{ fontFamily: 'var(--font-serif)', color: 'var(--primary)' }}>Event details</h1>
            <p style={{ color: 'var(--subtext)' }}>Event ID: {eventId}</p>
            <p style={{ color: 'var(--subtext)' }}>
                Full event details — description, attendees, location, and join/leave actions — will
                live here.
            </p>
        </div>
    );
}
