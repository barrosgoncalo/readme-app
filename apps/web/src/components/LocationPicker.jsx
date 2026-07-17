import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '../utils/leafletIcons.js';
import styles from './LocationPicker.module.css';

const LISBON = { lat: 38.7223, lng: -9.1393 };
// createOfferModel (shared) stores/reads latitude/longitude — matches mobile's
// convention — while the map itself (Leaflet + Nominatim) works in lat/lng.
const DEFAULT_LOCATION = { title: 'Lisbon', address: 'Lisbon, Portugal', latitude: LISBON.lat, longitude: LISBON.lng };

function RecenterMap({ center }) {
    const map = useMap();
    useEffect(() => {
        map.setView([center.lat, center.lng]);
    }, [center, map]);
    return null;
}

// Leaflet measures its container on mount. Inside a modal, the container can
// report a stale/zero size for that first measurement, which silently breaks
// click-to-coordinate translation (clicks land in the wrong spot or do
// nothing). Forcing a recompute right after mount fixes it.
function InvalidateSizeOnMount() {
    const map = useMap();
    useEffect(() => {
        const id = requestAnimationFrame(() => map.invalidateSize());
        return () => cancelAnimationFrame(id);
    }, [map]);
    return null;
}

function MapClickHandler({ onMapClick }) {
    useMapEvents({ click: onMapClick });
    return null;
}

export default function LocationPicker({ location, onLocationChange }) {
    const [center, setCenter] = useState(LISBON);
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        if (!location && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    setCenter({ lat: latitude, lng: longitude });
                    reverseGeocode(latitude, longitude);
                },
                () => {
                    setCenter(LISBON);
                    onLocationChange(DEFAULT_LOCATION);
                }
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function reverseGeocode(lat, lon) {
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
            );
            const data = await res.json();
            if (data.address) {
                onLocationChange({
                    id: null,
                    title: data.address.city || data.address.village || data.address.town || 'Location',
                    address: data.display_name,
                    latitude: lat,
                    longitude: lon
                });
            }
        } catch (err) {
            console.error('Reverse geocode error:', err);
        }
    }

    async function handleSearch() {
        if (!searchQuery.trim()) return;

        setSearching(true);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
            );
            const results = await res.json();
            if (results.length > 0) {
                const first = results[0];
                const lat = parseFloat(first.lat);
                const lon = parseFloat(first.lon);
                setCenter({ lat, lng: lon });
                reverseGeocode(lat, lon);
                setSearchQuery('');
            }
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setSearching(false);
        }
    }

    function handleMapClick(e) {
        const { lat, lng } = e.latlng;
        setCenter({ lat, lng });
        reverseGeocode(lat, lng);
    }

    return (
        <div className={styles.locationSection}>
            <div className={styles.searchBox}>
                <input
                    type="text"
                    placeholder="Search location..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleSearch()}
                    className={styles.searchInput}
                />
                <button
                    onClick={handleSearch}
                    disabled={searching || !searchQuery.trim()}
                    className={styles.searchBtn}
                >
                    {searching ? 'Searching...' : 'Search'}
                </button>
            </div>

            <div className={styles.mapWrapper}>
                <MapContainer
                    center={[center.lat, center.lng]}
                    zoom={13}
                    className={styles.map}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />
                    <RecenterMap center={center} />
                    <InvalidateSizeOnMount />
                    <MapClickHandler onMapClick={handleMapClick} />
                    {location && (
                        <Marker position={[location.latitude, location.longitude]}>
                            <Popup>{location.title}</Popup>
                        </Marker>
                    )}
                </MapContainer>
            </div>

            {location && (
                <div className={styles.locationInfo}>
                    <p className={styles.locationTitle}>{location.title}</p>
                    <p className={styles.locationAddress}>{location.address}</p>
                </div>
            )}
        </div>
    );
}
