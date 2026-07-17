// Web-only geocoding helpers backed by Nominatim (OpenStreetMap), since the
// browser has no equivalent to expo-location's native geocoding. Mirrors the
// address-formatting/coordinate conventions used by packages/shared's
// mobile-only use-seller-locations.ts / use-location-proposal.ts so both
// platforms produce compatible `createOfferModel` location shapes.

export async function reverseGeocode(lat, lon) {
    const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
    );
    if (!res.ok) return null;

    const data = await res.json().catch(() => null);
    if (!data?.address) return null;

    return {
        title: data.address.city || data.address.village || data.address.town || 'Location',
        address: data.display_name,
        latitude: lat,
        longitude: lon,
    };
}

export async function forwardGeocode(query) {
    const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
    );
    if (!res.ok) return null;

    const results = await res.json().catch(() => null);
    if (!results?.length) return null;

    return {
        latitude: parseFloat(results[0].lat),
        longitude: parseFloat(results[0].lon),
    };
}
