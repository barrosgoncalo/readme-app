import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@readme/shared/src/services/firebase';

export function useSellerLocations(sellerUid) {
    const [sellerLocations, setSellerLocations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!sellerUid) {
            setLoading(false);
            return;
        }

        const fetchAndGeocode = async () => {
            try {
                const sellerDocRef = doc(db, 'users', sellerUid);
                const sellerDocSnap = await getDoc(sellerDocRef);

                if (!sellerDocSnap.exists()) return;
                
                const { institutionalAddress: addressData } = sellerDocSnap.data();
                if (!addressData) return;

                const city = addressData.city || '';
                const country = addressData.country || 'Portugal';
                const cityCountry = `${city}, ${country}`.trim();

                const geocodePromises = [];

                // Helper to geocode strings
                const getGeocodedPin = async (fullAddressString, pinId, pinTitle) => {
                    try {
                        const result = await Location.geocodeAsync(fullAddressString);
                        if (result.length > 0) {
                            return {
                                id: pinId,
                                title: pinTitle,
                                address: fullAddressString,
                                latitude: result[0].latitude,
                                longitude: result[0].longitude
                            };
                        }
                    } catch (error) {
                        console.warn(`Geocoding failed for ${pinTitle}:`, error);
                    }
                    return null;
                };

                // Format Address 1
                let address1 = (addressData.addressLine1 || '').replace(/n(?:º)?\s*(\d+)/i, 'nº $1');
                if (address1 && !address1.toLowerCase().includes(city.toLowerCase())) {
                    address1 = `${address1}, ${cityCountry}`;
                }
                if (addressData.addressLine1) {
                    geocodePromises.push(getGeocodedPin(address1, 'primary_loc', 'Primary Location'));
                }

                // Format Address 2
                if (addressData.addressLine2) {
                    let address2 = addressData.addressLine2;
                    if (!address2.toLowerCase().includes('portugal')) {
                        address2 = /\d{4}-\d{3}/.test(address2) ? `${address2}, Portugal` : `${address2}, ${cityCountry}`;
                    }
                    geocodePromises.push(getGeocodedPin(address2, 'secondary_loc', 'Alternative Location'));
                }

                const resolvedPins = await Promise.all(geocodePromises);
                let mappedLocations = resolvedPins.filter(Boolean);

                if (mappedLocations.length === 0) {
                    mappedLocations = [{ id: 'fallback', title: 'Lisbon Center', address: 'Lisbon, Portugal', latitude: 38.7223, longitude: -9.1393 }];
                }

                setSellerLocations(mappedLocations);
            } catch (error) {
                console.error('Error resolving seller profile:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAndGeocode();
    }, [sellerUid]);

    return { sellerLocations, loading };
}
