import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    ScrollView, 
    StyleSheet, 
    Dimensions,
    Alert,
    StatusBar,
    ActivityIndicator,
    RefreshControl,
    useColorScheme
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Iconify } from 'react-native-iconify';

import { Colors, Fonts } from '@readme/shared/src/constants/theme';
// --- SERVICE IMPORTS ---
import { fetchUserProfile, toggleFollowUser } from '@readme/shared/src/services/users'; 
import { fetchUserPublications } from '@readme/shared/src/services/publications';

const { width } = Dimensions.get('window');

export default function PublicProfileScreen({ navigation, route }) {
    const userId = route.params?.sellerUserId;

    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const styles = buildProfileStyles(theme);

    // --- STATE MANAGEMENT ---
    const [profile, setProfile] = useState(null);
    const [publications, setPublications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('publications');
    const [isFollowing, setIsFollowing] = useState(false);

    const isValidPhoto = profile?.photoURL && profile.photoURL !== 'null' && profile.photoURL.trim() !== '';

    // --- DATA FETCHING ---
    const loadProfileData = async (showRefreshIndicator = false) => {
        if (!userId) {
            Alert.alert("Error", "User ID not found.");
            setLoading(false);
            return;
        }

        if (showRefreshIndicator) setRefreshing(true);
        else setLoading(true);

        try {
            // Fetch profile data and publications concurrently
            const [profileData, publicationsData] = await Promise.all([
                fetchUserProfile(userId),
                fetchUserPublications(userId)
            ]);

            setProfile(profileData);
            setPublications(publicationsData || []);
            setIsFollowing(profileData?.isCurrentUserFollowing || false);
        } catch (error) {
            console.error("Error loading profile data:", error);
            Alert.alert("Error", "Failed to load profile details. Please try again.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadProfileData();
    }, [userId]);

    console.log("EXACT IMAGE VALUE:", profile?.photoURL);
    console.log("IS IT A STRING?", typeof profile?.photoURL);

    // --- ACTIONS ---
    const handleFollowToggle = async () => {
        // Optimistic UI Update
        const previousFollowingState = isFollowing;
        setIsFollowing(!previousFollowingState);

        try {
            await toggleFollowUser(userId, !previousFollowingState);
        } catch (error) {
            console.error("Error updating follow status:", error);
            // Revert on error
            setIsFollowing(previousFollowingState);
            Alert.alert("Error", "Could not update follow status.");
        }
    };

    const handleOpenOptions = () => {
        Alert.alert("User Options", `What would you like to do with ${profile?.username || 'this user'}?`, [
            { text: "Cancel", style: "cancel" },
            { text: "Report User", onPress: () => console.log("Report") },
            { text: "Block User", onPress: () => console.log("Block"), style: "destructive" }
        ]);
    };

    // --- RENDER SECTIONS ---
    const renderPublications = () => {
        if (publications.length === 0) {
            return (
                <View style={styles.reviewsContainer}>
                    <Text style={styles.emptyStateText}>No publications listed yet.</Text>
                </View>
            );
        }

        return (
            <View style={styles.gridContainer}>
                {publications.map((item) => (
                    <TouchableOpacity 
                        key={item.id} 
                        style={styles.publicationCard}
                        onPress={() => navigation.navigate('PublicationDetails', { publicationId: item.id })}
                    >
                        <View style={styles.bookCoverPlaceholder}>
                            {item.book?.images && item.book.images.length > 0 ? (
                                <Image 
                                    source={{ uri: item.book.images[0] }} 
                                    style={styles.bookCoverImage}
                                    contentFit="cover"
                                />
                            ) : (
                                    <Iconify icon="lucide:book" size={32} color={theme.textMuted || "#A0A0A0"} />
                                )}
                        </View>
                        <Text style={styles.bookTitle} numberOfLines={1}>
                            {item.book?.title || 'Untitled Book'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    const renderReviews = () => (
        <View style={styles.reviewsContainer}>
            <Text style={styles.emptyStateText}>No reviews yet.</Text>
        </View>
    );

    // Global loading handler
    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* --- TOP BUTTONS CONTAINER --- */}
            <SafeAreaView edges={['top']} style={styles.topButtonsContainer}>
                <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
                    <Iconify icon="lucide:arrow-left" size={24} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.iconButton} onPress={handleOpenOptions}>
                    <Iconify icon="lucide:more-vertical" size={24} color="#FFFFFF" />
                </TouchableOpacity>
            </SafeAreaView>

            <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => loadProfileData(true)} tintColor={theme.primary} />
                }
            >
                
                {/* --- IMAGE AT THE VERY TOP --- */}
                <View style={[styles.imageContainer, {
                        backgroundColor: '#EACCA5',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }]}
                >
                    {isValidPhoto ? (
                        <Image 
                            source={{ uri: profile.photoURL }} 
                            style={styles.profileImage}
                            contentFit="cover"
                            transition={300}
                        />
                    ) : (
                        <Iconify icon="lucide:user" size={80} color="#FFFFFF" />
                    )}
                </View>

                {/* --- PROFILE INFO & BIO --- */}
                <View style={styles.infoContainer}>
                    <View style={styles.nameRow}>
                        <Text style={styles.name}>{profile?.username || 'Unknown User'}</Text>
                        {profile?.isVerified && (
                            <Iconify icon="mdi:check-decagram" size={24} color="#22C55E" style={{ marginLeft: 6 }} />
                        )}
                    </View>
                    
                    <Text style={styles.bio}>{profile?.bio || 'No bio available.'}</Text>

                    {/* --- STATS ROW --- */}
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Iconify icon="lucide:user" size={25} color={theme.subtext} />
                            <Text style={styles.statText}>
                                {((profile?.followers || 0) + (isFollowing && !profile?.isCurrentUserFollowing ? 1 : 0))}
                            </Text>
                        </View>
                        <View style={styles.statItem}>
                            <Iconify icon="lucide:copy-check" size={25} color={theme.subtext} />
                            <Text style={styles.statText}>{publications.length}</Text>
                        </View>

                        <View style={{ flex: 1 }} /> 

                        {/* --- FOLLOW BUTTON --- */}
                        <TouchableOpacity 
                            style={[styles.followButton, isFollowing && styles.followingButton]}
                            onPress={handleFollowToggle}
                        >
                            <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                                {isFollowing ? "Following" : "Follow"}
                            </Text>
                            <Iconify 
                                icon={isFollowing ? "lucide:check" : "lucide:plus"} 
                                size={18} 
                                color={isFollowing ? theme.primary : '#FFFFFF'} 
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* --- TAB NAVIGATION --- */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity 
                        style={[styles.tab, activeTab === 'publications' && styles.activeTab]}
                        onPress={() => setActiveTab('publications')}
                    >
                        <Text style={[styles.tabText, activeTab === 'publications' && styles.activeTabText]}>Publications</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
                        onPress={() => setActiveTab('reviews')}
                    >
                        <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>Reviews</Text>
                    </TouchableOpacity>
                </View>

                {/* --- TAB CONTENT --- */}
                <View style={styles.tabContentContainer}>
                    {activeTab === 'publications' ? renderPublications() : renderReviews()}
                </View>

            </ScrollView>
        </View>
    );
}

// ==========================================
// DYNAMIC THEMED STYLES
// ==========================================
export const buildProfileStyles = (theme) => {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.background,
        },
        topButtonsContainer: {
            position: 'absolute',
            top: 5,
            left: 0,
            right: 0,
            zIndex: 10,
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingTop: 10,
        },
        iconButton: {
            width: 44,
            height: 44,
            backgroundColor: theme.headerBackground,
            borderRadius: 12,
            justifyContent: 'center',
            alignItems: 'center',
            opacity: 0.9,
        },
        scrollContent: {
            paddingBottom: 40,
        },
        imageContainer: {
            height: 380,
            backgroundColor: theme.coverPlaceholder,
            borderRadius: 50,
            overflow: 'hidden',
            shadowColor: theme.shadowBase,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 1,
            shadowRadius: 10,
            elevation: 5,
            position: 'relative',
        },
        profileImage: {
            width: '100%',
            height: '100%',
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
        },
        infoContainer: {
            paddingHorizontal: 24,
            marginTop: 24,
        },
        nameRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 8,
        },
        name: {
            fontSize: 30,
            fontWeight: '700',
            color: theme.textDisplay,
        },
        bio: {
            fontSize: 16,
            lineHeight: 24,
            color: theme.subtext,
            marginBottom: 20,
        },
        statsRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 24,
        },
        statItem: {
            flexDirection: 'row',
            alignItems: 'center',
            marginRight: 20,
        },
        statText: {
            fontFamily: Fonts.inter_semi,
            fontSize: 20,
            color: theme.textItemTitle,
            marginLeft: 10,
        },
        followButton: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.primary, 
            paddingVertical: 10,
            paddingHorizontal: 20,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: theme.primary,
        },
        followButtonText: {
            color: '#FFFFFF',
            fontSize: 15,
            fontWeight: '600',
            marginRight: 6,
        },
        followingButton: {
            backgroundColor: 'transparent',
        },
        followingButtonText: {
            color: theme.primary,
        },
        tabContainer: {
            flexDirection: 'row',
            borderBottomWidth: 1,
            borderBottomColor: theme.borderLight,
            paddingHorizontal: 24,
        },
        tab: {
            paddingVertical: 14,
            marginRight: 32,
        },
        activeTab: {
            borderBottomWidth: 3,
            borderBottomColor: theme.primary,
        },
        tabText: {
            fontFamily: Fonts.inter_regular,
            fontSize: 16,
            color: theme.textMuted,
        },
        activeTabText: {
            fontFamily: Fonts.inter_semi,
            color: theme.textItemTitle,
        },
        tabContentContainer: {
            paddingHorizontal: 20,
            paddingTop: 20,
        },
        gridContainer: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
        },
        publicationCard: {
            width: '48%',
            backgroundColor: theme.cardBackground || '#F9F9FB',
            borderRadius: 16,
            padding: 8,
            marginBottom: 16,
        },
        bookCoverPlaceholder: {
            width: '100%',
            height: 180,
            backgroundColor: theme.coverPlaceholder || '#EBEBEB',
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 10,
            overflow: 'hidden',
        },
        bookCoverImage: {
            width: '100%',
            height: '100%',
        },
        bookTitle: {
            fontFamily: Fonts.inter_semi,
            fontSize: 14,
            color: theme.textItemTitle || '#333333',
        },
        reviewsContainer: {
            padding: 40,
            alignItems: 'center',
        },
        emptyStateText: {
            fontFamily: Fonts.inter_regular,
            color: theme.textMuted || '#999999',
            fontSize: 15,
        }
    });
};
