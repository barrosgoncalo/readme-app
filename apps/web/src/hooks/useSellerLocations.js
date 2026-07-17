// Web port of packages/shared/src/hooks/use-seller-locations.ts.
// That hook imports expo-location, which has no browser build — this is a
// behavioral port using Nominatim forward-geocoding instead, kept in sync
// on: address formatting, fallback-to-Lisbon behavior, and pin id
// conventions (mobile's hook is left untouched).
import { useEffect, useState } from 'react';
import { DB } from '@readme/shared/src/services/DB';
import { forwardGeocode } from '../utils/geocoding';

const FALLBACK_PIN = {
    id: 'fallback',
    title: 'Lisbon Center',
    address: 'Lisbon, Portugal',
    latitude: 38.7223,
    longitude: -9.1393,
};

export function useSellerLocations(sellerUid) {
    const [sellerLocations, setSellerLocations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!sellerUid) {
            setSellerLocations([]);
            setLoading(false);
            return;
        }

        let cancelled = false;
        setLoading(true);

        async function fetchAndGeocode() {
            try {
                const sellerDoc = await DB.get('users', sellerUid);
                const addressData = sellerDoc?.institutionalAddress;
                if (!addressData) {
                    if (!cancelled) setSellerLocations([FALLBACK_PIN]);
                    return;
                }

                const city = addressData.city || '';
                const country = addressData.country || 'Portugal';
                const cityCountry = `${city}, ${country}`.trim();

                const getGeocodedPin = async (fullAddressString, pinId, pinTitle) => {
                    try {
                        const result = await forwardGeocode(fullAddressString);
                        if (result) {
                            return {
                                id: pinId,
                                title: pinTitle,
                                address: fullAddressString,
                                latitude: result.latitude,
                                longitude: result.longitude,
                            };
                        }
                    } catch (err) {
                        console.warn(`Geocoding failed for ${pinTitle}:`, err);
                    }
                    return null;
                };

                const geocodePromises = [];

                let address1 = (addressData.addressLine1 || '').replace(/n(?:º)?\s*(\d+)/i, 'nº $1');
                if (address1 && !address1.toLowerCase().includes(city.toLowerCase())) {
                    address1 = `${address1}, ${cityCountry}`;
                }
                if (addressData.addressLine1) {
                    geocodePromises.push(getGeocodedPin(address1, `primary_loc_${sellerUid}`, 'Primary Location'));
                }

                if (addressData.addressLine2) {
                    let address2 = addressData.addressLine2;
                    if (!address2.toLowerCase().includes('portugal')) {
                        address2 = /\d{4}-\d{3}/.test(address2) ? `${address2}, Portugal` : `${address2}, ${cityCountry}`;
                    }
                    geocodePromises.push(getGeocodedPin(address2, `secondary_loc_${sellerUid}`, 'Alternative Location'));
                }

                const resolvedPins = await Promise.all(geocodePromises);
                let mappedLocations = resolvedPins.filter(Boolean);

                if (mappedLocations.length === 0) {
                    mappedLocations = [FALLBACK_PIN];
                }

                if (!cancelled) setSellerLocations(mappedLocations);
            } catch (err) {
                console.error('Error resolving seller locations:', err);
                if (!cancelled) setSellerLocations([FALLBACK_PIN]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        fetchAndGeocode();
        return () => { cancelled = true; };
    }, [sellerUid]);

    return { sellerLocations, loading };
}
