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
                // 1. Request permission BEFORE attempting to geocode
                const { status } = await Location.requestForegroundPermissionsAsync();
                
                if (status !== 'granted') {
                    console.warn('Location permission denied. Defaulting to fallback pin.');
                    setSellerLocations([{ id: 'fallback', title: 'Lisbon Center', address: 'Lisbon, Portugal', latitude: 38.7223, longitude: -9.1393 }]);
                    setLoading(false);
                    return;
                }

                // 2. Fetch the user's data from Firestore
                const sellerDocRef = doc(db, 'users', sellerUid);
                const sellerDocSnap = await getDoc(sellerDocRef);

                if (!sellerDocSnap.exists()) return;
                
                const { institutionalAddress: addressData } = sellerDocSnap.data();
                if (!addressData) return;

                const city = addressData.city || '';
                const country = addressData.country || 'Portugal';
                const cityCountry = `${city}, ${country}`.trim();

                // Helper to geocode strings
                const getGeocodedPin = async (fullAddressString, pinId, pinTitle) => {
                    try {
                        const result = await Location.geocodeAsync(fullAddressString);
                        console.log(`[GEOCODE] ${pinTitle}: "${fullAddressString}" ->`, result);
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

                // addressLine2 is a complementary detail of addressLine1 (apartment, floor, building, etc.),
                // never a separate address — so it's folded into the same string, not geocoded on its own.
                const street = (addressData.addressLine1 || '').replace(/n(?:º)?\s*(\d+)/i, 'nº $1');
                let fullAddress = street;
                if (addressData.addressLine2) {
                    fullAddress = `${fullAddress}, ${addressData.addressLine2}`;
                }
                if (fullAddress && !fullAddress.toLowerCase().includes(city.toLowerCase())) {
                    fullAddress = `${fullAddress}, ${cityCountry}`;
                }

                // Try the full address first, then progressively looser versions —
                // a failed geocode of the most specific string shouldn't mean giving up
                // entirely and showing an unrelated hardcoded city.
                const addressAttempts = [fullAddress];
                if (addressData.addressLine2 && street) {
                    addressAttempts.push(`${street}, ${cityCountry}`); // drop the complementary detail
                }
                if (cityCountry) {
                    addressAttempts.push(cityCountry);
                }

                let mappedLocations = [];
                if (addressData.addressLine1) {
                    for (const attempt of addressAttempts) {
                        const pin = await getGeocodedPin(attempt, `loc_${sellerUid}`, 'Location');
                        if (pin) {
                            mappedLocations.push(pin);
                            break;
                        }
                    }
                }

                if (mappedLocations.length === 0) {
                    console.warn(`All geocode attempts failed for seller ${sellerUid}:`, addressAttempts);
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
