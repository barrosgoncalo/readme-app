import React, { useState } from 'react';
import { 
    View, 
    TextInput, 
    TouchableOpacity, 
    ActivityIndicator, 
    StyleSheet, 
    Keyboard, 
    Alert 
} from 'react-native';
import { Iconify } from 'react-native-iconify';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

export default function MapSearchBar({ theme, mapRef, onLocationFound }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const handleSearchAddress = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        Keyboard.dismiss();
        
        try {
            const geocoded = await Location.geocodeAsync(searchQuery);
            if (geocoded.length > 0) {
                const { latitude, longitude } = geocoded[0];
                
                // Fly map to new searched spot
                mapRef.current?.animateToRegion({
                    latitude,
                    longitude,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                }, 1000);

                // Pass coordinates back up to reverse-geocode and place the pin
                onLocationFound({ latitude, longitude });
            } else {
                Alert.alert("Location Not Found", "We couldn't find that address. Try adding a city or postal code.");
            }
        } catch (error) {
            console.warn("Search geocoding error:", error);
            Alert.alert("Error", "Something went wrong searching for that address.");
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <View style={[styles.searchContainer, { backgroundColor: theme.backgroundElement, borderColor: theme.borderLight }]}>
            <Iconify icon="lucide:search" size={20} color={theme.subtext} />
            <TextInput
                style={[styles.searchInput, { color: theme.textItemTitle }]}
                placeholder="Search a street, cafe, or city..."
                placeholderTextColor={theme.subtext}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearchAddress}
                returnKeyType="search"
                autoCorrect={false}
            />
            {isSearching ? (
                <ActivityIndicator size="small" color={theme.primary || '#E58A1F'} />
            ) : searchQuery.length > 0 ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={20} color={theme.subtext} />
                </TouchableOpacity>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    searchContainer: {
        position: 'absolute',
        top: 16,
        left: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        height: 52,
        borderRadius: 26,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        marginRight: 8,
        fontSize: 15,
        fontWeight: '500',
        height: '100%',
    },
});
