import * as Location from 'expo-location';

export const LocationService = {
    /**
     * Normalizes absolute geographic coordinates into a human-readable street address.
     * @param {Object} coords - Spatial latitude and longitude object.
     * @returns {Promise<string>} Clean formatted address string.
     */
    reverseGeocodeCoordinates: async (coords) => {
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
    },

    /**
     * Builds deep link URLs for Apple Maps, Google Maps, and Waze based on a location.
     * @param {Object} location - The location object containing latitude, longitude, and title/address.
     * @returns {Object} An object containing the formatted deep link URLs.
     */
    buildNavigationLinks: (location) => {
        const { latitude, longitude, title, address } = location;
        const label = encodeURIComponent(title || address || "Book Exchange Spot");

        return {
            appleMapsUrl: `maps://?q=${label}&ll=${latitude},${longitude}`,
            googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
            wazeUrl: `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`
        };
    }
};
