import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import EventsPage from './Events/index.jsx';
import PublicationDetails from './Publications/PublicationDetails.jsx';
import EventDetails from './Events/Details.jsx';
import SlideOverPanel from '../components/SlideOverPanel.jsx';
import { WEB_ROUTES } from '../constants/webRoutes';

const PANEL_BREAKPOINT = 900;

function usePanelMode() {
    const [panel, setPanel] = useState(() => typeof window !== 'undefined' && window.innerWidth >= PANEL_BREAKPOINT);

    useEffect(() => {
        const mq = window.matchMedia(`(min-width: ${PANEL_BREAKPOINT}px)`);
        const handler = (e) => setPanel(e.matches);
        mq.addEventListener('change', handler);
        setPanel(mq.matches);
        return () => mq.removeEventListener('change', handler);
    }, []);

    return panel;
}

export function PublicationDetailRoute() {
    return <PublicationDetails />;
}

export function EventDetailRoute() {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const panelMode = usePanelMode();

    if (!panelMode) {
        return <EventDetails />;
    }

    return (
        <>
            <EventsPage />
            <SlideOverPanel
                open
                onClose={() => navigate(WEB_ROUTES.EVENTS)}
                title="Event"
            >
                <EventDetails embedded eventId={eventId} onClose={() => navigate(WEB_ROUTES.EVENTS)} />
            </SlideOverPanel>
        </>
    );
}
