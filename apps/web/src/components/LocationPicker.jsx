import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { SELLER_ICON, CUSTOM_ICON, ORIGINAL_ICON, SELECTED_ICON } from '../utils/leafletIcons.js';
import { forwardGeocode } from '../utils/geocoding';
import { useSellerLocations } from '../hooks/useSellerLocations';
import { useLocationProposal } from '../hooks/useLocationProposal';
import styles from './LocationPicker.module.css';

const LISBON = { lat: 38.7223, lng: -9.1393 };

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

// Frames the map around whichever pins are currently visible (seller pins +
// original-offer pin), mirroring mobile's use-fit-markers.ts. Keyed off pin
// ids rather than object identity so it only re-fits when the actual set of
// visible pins changes, not on every parent re-render.
function FitMarkers({ points, active }) {
    const map = useMap();
    const key = points.map(p => p.id).join(',');

    useEffect(() => {
        if (!active || points.length === 0) return;
        if (points.length === 1) {
            map.setView([points[0].latitude, points[0].longitude], 14);
        } else {
            map.fitBounds(points.map(p => [p.latitude, p.longitude]), { padding: [60, 60] });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key, active]);

    return null;
}

/**
 * @param {object} location - controlled selection, mirrored out via onLocationChange
 * @param {(location: object|null) => void} onLocationChange
 * @param {string} [sellerUid] - the other party whose pre-set meeting locations to show as pins
 * @param {object} [originalLocation] - the original offer's location (counter-offer flow only), shown as a distinct pin
 */
export default function LocationPicker({ location, onLocationChange, sellerUid, originalLocation }) {
    const { sellerLocations, loading: sellerLoading } = useSellerLocations(sellerUid);
    const {
        selectedLocation, setSelectedLocation,
        isProposingAlternative, customLocation, geocodingCustom,
        setCurrentRegion,
        activeLocationSelection, canSend,
        handleReverseGeocode, handleStartProposingAlternative, handleCancelAlternative,
    } = useLocationProposal();

    const [center, setCenter] = useState(LISBON);
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const hasCenteredRef = useRef(false);

    const originalPin = originalLocation && !sellerLocations.some(p => p.id === originalLocation.id)
        ? originalLocation
        : null;
    const visiblePins = originalPin ? [...sellerLocations, originalPin] : sellerLocations;

    // Bridge the proposal hook's active selection back to the controlled
    // `location` prop, only once it's a settled (non-loading) value.
    useEffect(() => {
        onLocationChange(canSend ? activeLocationSelection : null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeLocationSelection, canSend]);

    // Keep the "current region" the proposal hook seeds the custom pin at
    // in sync with wherever the map is actually centered.
    useEffect(() => {
        setCurrentRegion({ latitude: center.lat, longitude: center.lng });
    }, [center, setCurrentRegion]);

    // Frame the map on whichever pins first become available.
    useEffect(() => {
        if (hasCenteredRef.current || sellerLoading) return;
        const initial = originalPin || sellerLocations[0];
        if (initial) {
            setCenter({ lat: initial.latitude, lng: initial.longitude });
            hasCenteredRef.current = true;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sellerLoading, sellerLocations, originalLocation]);

    // Defensive: never strand the user on a pin-less, non-clickable map —
    // drop straight into "propose a location" if there's nothing to pick from.
    useEffect(() => {
        if (!sellerLoading && sellerLocations.length === 0 && !isProposingAlternative) {
            handleStartProposingAlternative();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sellerLoading, sellerLocations.length]);

    function handleSelectPin(pin) {
        setSelectedLocation(pin);
        setCenter({ lat: pin.latitude, lng: pin.longitude });
    }

    function handleToggleAlternative() {
        if (isProposingAlternative) {
            handleCancelAlternative();
            const fallback = selectedLocation || originalPin || sellerLocations[0];
            if (fallback) setCenter({ lat: fallback.latitude, lng: fallback.longitude });
        } else {
            handleStartProposingAlternative();
        }
    }

    function handleMapClick(e) {
        if (!isProposingAlternative) return;
        const { lat, lng } = e.latlng;
        handleReverseGeocode({ latitude: lat, longitude: lng });
    }

    function handleMarkerDragEnd(e) {
        const { lat, lng } = e.target.getLatLng();
        handleReverseGeocode({ latitude: lat, longitude: lng });
    }

    async function handleSearch() {
        if (!searchQuery.trim()) return;

        setSearching(true);
        try {
            const result = await forwardGeocode(searchQuery);
            if (result) {
                setCenter({ lat: result.latitude, lng: result.longitude });
                await handleReverseGeocode(result);
                setSearchQuery('');
            }
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setSearching(false);
        }
    }

    const clearBtnAction = isProposingAlternative
        ? handleCancelAlternative
        : () => setSelectedLocation(null);

    return (
        <div className={styles.locationSection}>
            {isProposingAlternative && (
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
            )}

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
                    <FitMarkers points={visiblePins} active={!isProposingAlternative && !sellerLoading} />

                    {!isProposingAlternative && sellerLocations.map(pin => (
                        <Marker
                            key={pin.id}
                            position={[pin.latitude, pin.longitude]}
                            icon={selectedLocation?.id === pin.id ? SELECTED_ICON : SELLER_ICON}
                            eventHandlers={{ click: () => handleSelectPin(pin) }}
                        />
                    ))}

                    {!isProposingAlternative && originalPin && (
                        <Marker
                            position={[originalPin.latitude, originalPin.longitude]}
                            icon={selectedLocation?.id === originalPin.id ? SELECTED_ICON : ORIGINAL_ICON}
                            eventHandlers={{ click: () => handleSelectPin(originalPin) }}
                        />
                    )}

                    {isProposingAlternative && customLocation && (
                        <Marker
                            position={[customLocation.latitude, customLocation.longitude]}
                            icon={CUSTOM_ICON}
                            draggable
                            eventHandlers={{ dragend: handleMarkerDragEnd }}
                        />
                    )}

                    <MapClickHandler onMapClick={handleMapClick} />
                </MapContainer>
            </div>

            {activeLocationSelection && (
                <div className={styles.locationInfo}>
                    <div className={styles.locationInfoHeader}>
                        <div>
                            <p className={styles.locationTitle}>
                                {geocodingCustom ? 'Locating...' : activeLocationSelection.title}
                            </p>
                            <p className={styles.locationAddress}>{activeLocationSelection.address}</p>
                        </div>
                        <button type="button" className={styles.clearBtn} onClick={clearBtnAction} aria-label="Clear selected location">
                            &times;
                        </button>
                    </div>
                    {isProposingAlternative && (
                        <p className={styles.locationTip}>
                            Search an address above, drag the pin, or tap anywhere on the map.
                        </p>
                    )}
                </div>
            )}

            <button type="button" className={styles.toggleBtn} onClick={handleToggleAlternative}>
                {isProposingAlternative ? "Cancel and use seller's locations" : 'Or propose a different location'}
            </button>
        </div>
    );
}
