import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { ExternalLink } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import '../../../utils/leafletIcons.js';
import styles from './LocationMapPreview.module.css';

export default function LocationMapPreview({ location }) {
    const lat = location?.lat;
    const lng = location?.lon !== undefined ? location.lon : location?.lng;

    const hasCoords = typeof lat === 'number' && typeof lng === 'number';

    return (
        <div className={styles.preview}>
            {hasCoords ? (
                <div className={styles.mapWrapper}>
                    <MapContainer
                        center={[lat, lng]}
                        zoom={15}
                        scrollWheelZoom={false}
                        className={styles.map}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        />
                        <Marker position={[lat, lng]}>
                            <Popup>{location.title || location.address || 'Localização'}</Popup>

                        </Marker>
                    </MapContainer>
                </div>
            ) : (
                <p className={styles.noCoords}>
                    No map coordinates saved for this location (older offer).
                </p>
            )}

            <div className={styles.details}>
                <p className={styles.address}>{location?.address || location?.title || location?.label}</p>

                {hasCoords && (
                    <a
                        href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.openLink}
                    >
                        Open in Google Maps
                        <ExternalLink size={14} />
                    </a>
                )}
            </div>
        </div>
    );
}
