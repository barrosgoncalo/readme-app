import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import BookCover from '../../../components/BookCover.jsx';
import styles from './OfferStep2.module.css';

const LISBON = { lat: 38.7223, lng: -9.1393 };
const DEFAULT_LOCATION = { title: 'Lisbon', address: 'Lisbon, Portugal', ...LISBON };

export default function OfferStep2({ publication, selectedCount, location, onLocationChange }) {
    const mapRef = useRef(null);
    const markerRef = useRef(null);
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
    }, [location, onLocationChange]);

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
                    lat,
                    lon
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
        <div className={styles.step2}>
            <section className={styles.targetSection}>
                <h2 className={styles.sectionTitle}>Offering {selectedCount} book(s) for</h2>
                <div className={styles.targetBook}>
                    <BookCover
                        book={publication.book}
                        size="medium"
                        className={styles.cover}
                    />
                    <div className={styles.details}>
                        <p className={styles.title}>{publication.book.title}</p>
                        <p className={styles.author}>{publication.book.author}</p>
                    </div>
                </div>
            </section>

            <section className={styles.locationSection}>
                <h2 className={styles.sectionTitle}>Meeting location</h2>

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
                        ref={mapRef}
                        onClick={handleMapClick}
                        className={styles.map}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        />
                        {location && (
                            <Marker
                                position={[location.lat, location.lon]}
                                ref={markerRef}
                            >
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
            </section>
        </div>
    );
}
