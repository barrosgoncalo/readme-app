import * as Location from 'expo-location';

/**
 * Normalizes absolute geographic coordinates into a human-readable street address.
 * @param {Object} coords - Spatial latitude and longitude object.
 * @returns {Promise<string>} Clean formatted address string.
 */
export const reverseGeocodeCoordinates = async (coords) => {
    const response = await Location.reverseGeocodeAsync(coords);
    const place = response[0];

    if (!place) {
        return `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
    }

    const street = place.street || place.name || "Custom Spot";
    const streetNumber = place.streetNumber ? ` ${place.streetNumber}` : "";
    const district = place.district ? `, ${place.district}` : "";
    const city = place.city ? `, ${place.city}` : "";

    return `${street}${streetNumber}${district}${city}`;
};
