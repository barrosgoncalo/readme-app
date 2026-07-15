import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useAuth } from '@readme/shared/src/contexts/AuthContext';
import { UsersService } from '@readme/shared/src/services/users';
import { useTheme } from '@readme/shared/src/hooks/use-theme';
import { Iconify } from 'react-native-iconify';

export default function FollowRequestsScreen({ navigation }) {
    const theme = useTheme();
    const { currentUser } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        setLoading(true);
        try {
            // 1. Get the list of IDs requesting to follow
            const requestDocs = await UsersService.fetchPendingFollowRequests(currentUser.uid);
            
            // 2. Fetch the actual user profile for each ID using your CORRECT method name
            const profiles = await Promise.all(
                requestDocs.map(async (doc) => {
                    // Changed from getUserProfile to fetchUserProfile
                    const profile = await UsersService.fetchUserProfile(doc.requesterUid); 
                    return { ...profile, requestId: doc.id };
                })
            );
            
            // Filter out any null profiles just in case a user was deleted
            setRequests(profiles.filter(p => p !== null)); 
        } catch (error) {
            console.error("Error loading requests:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (requesterUid) => {
        try {
            // Optimistically remove from UI
            setRequests(prev => prev.filter(req => req.uid !== requesterUid));
            
            // Fixed parameter order: (targetUserId, requesterUid)
            await UsersService.acceptFollowRequest(currentUser.uid, requesterUid);
        } catch (error) {
            console.error("Error accepting request:", error);
            loadRequests(); // Re-load if it fails
        }
    };

    const handleDecline = async (requesterUid) => {
        try {
            setRequests(prev => prev.filter(req => req.uid !== requesterUid));
            
            // Fixed parameter order: (targetUserId, requesterUid)
            await UsersService.declineFollowRequest(currentUser.uid, requesterUid);
        } catch (error) {
            console.error("Error declining request:", error);
            loadRequests(); // Re-load if it fails
        }
    };

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: theme.background, padding: 20 }}>
            {/* Simple Back Button Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginTop: 40 }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 15 }}>
                    <Iconify icon="lucide:arrow-left" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text }}>Follow Requests</Text>
            </View>

            <FlatList
                data={requests}
                keyExtractor={(item) => item.uid}
                ListEmptyComponent={
                    <Text style={{ color: theme.textMuted, textAlign: 'center', marginTop: 50 }}>
                        No pending follow requests.
                    </Text>
                }
                renderItem={({ item }) => (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            {item.photoURL ? (
                                <Image source={{ uri: item.photoURL }} style={{ width: 50, height: 50, borderRadius: 25, marginRight: 15 }} />
                            ) : (
                                <View style={{ width: 50, height: 50, borderRadius: 25, marginRight: 15, backgroundColor: theme.border, justifyContent: 'center', alignItems: 'center' }}>
                                    <Iconify icon="lucide:user" size={24} color={theme.textMuted} />
                                </View>
                            )}
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text }}>{item.username}</Text>
                            </View>
                        </View>

                        {/* Action Buttons */}
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            {/* Accept Button */}
                            <TouchableOpacity 
                                onPress={() => handleAccept(item.uid)}
                                style={{ backgroundColor: theme.primary, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 }}
                            >
                                <Text style={{ color: 'white', fontWeight: 'bold' }}>Accept</Text>
                            </TouchableOpacity>

                            {/* Decline Button */}
                            <TouchableOpacity 
                                onPress={() => handleDecline(item.uid)}
                                style={{ backgroundColor: theme.cardBackground, borderWidth: 1, borderColor: theme.border, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 }}
                            >
                                <Text style={{ color: theme.text, fontWeight: 'bold' }}>Decline</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />
        </View>
    );
}
