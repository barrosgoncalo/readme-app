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
import { withOpacity } from '@readme/shared/src/utils/colorUtils';

// --- SERVICE IMPORTS ---
import { auth } from '@readme/shared/src/services/firebase';
import { doBlockUser } from '@readme/shared/src/services/blockUser';
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

    // --- ACTIONS ---
    const handleFollowToggle = async () => {
        const previousFollowingState = isFollowing;
        setIsFollowing(!previousFollowingState);

        try {
            await toggleFollowUser(userId, !previousFollowingState);
        } catch (error) {
            console.error("Error updating follow status:", error);
            setIsFollowing(previousFollowingState);
            Alert.alert("Error", "Could not update follow status.");
        }
    };

    const handleBlockUser = async () => {
        const currentUserUid = auth?.currentUser?.uid;
        
        if (!currentUserUid) {
            Alert.alert("Error", "You must be logged in to block a user.");
            return;
        }

        try {
            await doBlockUser(currentUserUid, userId);
            
            Alert.alert(
                "User Blocked", 
                `You have blocked ${profile?.username || 'this user'}. You will no longer see their content.`,
                [{ 
                    text: "OK", 
                    onPress: () => {
                        if (navigation.canGoBack()) {
                            navigation.popToTop(); 
                        }
                    } 
                }]
            );
        } catch (error) {
            console.error("Error blocking user:", error);
            Alert.alert("Error", "Could not block the user at this time. Please try again.");
        }
    };

    const handleOpenOptions = () => {
        Alert.alert("User Options", `What would you like to do with ${profile?.username || 'this user'}?`, [
            { text: "Cancel", style: "cancel" },
            { text: "Report User", onPress: () => console.log("Report") },
            { 
                text: "Block User", 
                style: "destructive",
                onPress: () => {
                    // Ask for confirmation before actually blocking
                    Alert.alert(
                        "Confirm Block",
                        `Are you sure you want to block ${profile?.username || 'this user'}?`,
                        [
                            { text: "Cancel", style: "cancel" },
                            { text: "Block", style: "destructive", onPress: handleBlockUser }
                        ]
                    );
                } 
            }
        ]);
    };

    // --- RENDER SECTIONS ---
    const renderPublications = () => {
        if (publications.length === 0) {
            return (
                <View style={styles.emptyStateContainer}>
                    <Iconify icon="lucide:book-dashed" size={48} color={theme.borderLight} />
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
                        activeOpacity={0.8}
                    >
                        <View style={styles.bookCoverPlaceholder}>
                            {item.book?.images && item.book.images.length > 0 ? (
                                <Image 
                                    source={{ uri: item.book.images[0] }} 
                                    style={styles.bookCoverImage}
                                    contentFit="cover"
                                    transition={200}
                                />
                            ) : (
                                <Iconify icon="lucide:book" size={28} color={theme.textMuted || "#A0A0A0"} />
                            )}
                        </View>
                        <View style={styles.bookInfo}>
                            <Text style={styles.bookTitle} numberOfLines={1}>
                                {item.book?.title || 'Untitled Book'}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    const renderReviews = () => (
        <View style={styles.emptyStateContainer}>
            <Iconify icon="lucide:message-square-dashed" size={48} color={theme.borderLight} />
            <Text style={styles.emptyStateText}>No reviews yet.</Text>
        </View>
    );

    // --- OPTIMISTIC UI STATE ---
    let displayedFollowers = profile?.followers || 0;
    if (profile) {
        if (isFollowing && !profile.isCurrentUserFollowing) {
            displayedFollowers += 1;
        } else if (!isFollowing && profile.isCurrentUserFollowing) {
            displayedFollowers -= 1;
        }
    }

    if (loading) {
        return (
            <View style={[styles.container, styles.centerAll]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* --- TOP BUTTONS CONTAINER (Reverted to Original) --- */}
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
                
                {/* --- HERO IMAGE --- */}
                <View style={styles.imageContainer}>
                    {isValidPhoto ? (
                        <Image 
                            source={{ uri: profile.photoURL }} 
                            style={styles.profileImage}
                            contentFit="cover"
                            transition={300}
                        />
                    ) : (
                        <View style={styles.placeholderBackground}>
                            <Iconify icon="lucide:user" size={64} color="rgba(255,255,255,0.8)" />
                        </View>
                    )}
                </View>

                {/* --- PROFILE INFO --- */}
                <View style={styles.infoContainer}>
                    {/* Header Row: Name & Button together for premium layout */}
                    <View style={styles.headerRow}>
                        <View style={styles.nameWrapper}>
                            <Text style={styles.name} numberOfLines={1}>{profile?.username || 'Unknown User'}</Text>
                            {profile?.isVerified && (
                                <Iconify icon="mdi:check-decagram" size={22} color="#22C55E" style={{ marginLeft: 6, marginTop: 2 }} />
                            )}
                        </View>
                        
                        <TouchableOpacity 
                            style={[styles.followButton, isFollowing && styles.followingButton]}
                            onPress={handleFollowToggle}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                                {isFollowing ? "Following" : "Follow"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    
                    <Text style={styles.bio}>{profile?.bio || 'No bio available.'}</Text>

                    {/* --- STATS CARD --- */}
                    <View style={styles.statsCard}>
                        <View style={styles.statItem}>
                            <View style={styles.statIconContainer}>
                                <Iconify icon="lucide:users" size={20} color={theme.primary} />
                            </View>
                            <View>
                                <Text style={styles.statNumber}>{displayedFollowers}</Text>
                                <Text style={styles.statLabel}>Followers</Text>
                            </View>
                        </View>
                        
                        <View style={styles.statDivider} />

                        <View style={styles.statItem}>
                            <View style={styles.statIconContainer}>
                                <Iconify icon="lucide:book-open" size={20} color={theme.primary} />
                            </View>
                            <View>
                                <Text style={styles.statNumber}>{publications.length}</Text>
                                <Text style={styles.statLabel}>Listings</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* --- TAB NAVIGATION --- */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity 
                        style={styles.tab}
                        onPress={() => setActiveTab('publications')}
                    >
                        <Text style={[styles.tabText, activeTab === 'publications' && styles.activeTabText]}>Publications</Text>
                        {activeTab === 'publications' && <View style={styles.activeIndicator} />}
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.tab}
                        onPress={() => setActiveTab('reviews')}
                    >
                        <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>Reviews</Text>
                        {activeTab === 'reviews' && <View style={styles.activeIndicator} />}
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
        centerAll: {
            justifyContent: 'center',
            alignItems: 'center'
        },
        // Reverted to original
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
        // Reverted to original
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
            paddingBottom: 60,
        },
        
        // --- HERO SECTION ---
        imageContainer: {
            height: 320, 
            backgroundColor: theme.coverPlaceholder || '#EACCA5',
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
            overflow: 'hidden',
        },
        profileImage: {
            width: '100%',
            height: '100%',
        },
        placeholderBackground: {
            flex: 1,
            backgroundColor: '#D1BFAe', 
            justifyContent: 'center',
            alignItems: 'center',
        },

        // --- INFO SECTION ---
        infoContainer: {
            paddingHorizontal: 24,
            paddingTop: 24,
            paddingBottom: 16,
        },
        headerRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
        },
        nameWrapper: {
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
            paddingRight: 16,
        },
        name: {
            fontSize: 28,
            fontFamily: Fonts.inter_bold || 'System',
            fontWeight: '800',
            color: theme.textDisplay,
            letterSpacing: -0.5,
        },
        bio: {
            fontSize: 15,
            lineHeight: 22,
            fontFamily: Fonts.inter_regular || 'System',
            color: theme.subtext,
            marginBottom: 24,
        },

        // --- PREMIUM STATS CARD ---
        statsCard: {
            flexDirection: 'row',
            backgroundColor: theme.cardBackground || '#F8F9FA',
            borderRadius: 20,
            paddingVertical: 16,
            paddingHorizontal: 24,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: theme.borderLight || '#F0F0F0',
        },
        statItem: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
        },
        statIconContainer: {
            width: 45,
            height: 45,
            borderRadius: 14,
            backgroundColor: withOpacity( theme.primary, 0.085 ),
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
        },
        statNumber: {
            fontFamily: Fonts.inter_bold || 'System',
            fontSize: 18,
            fontWeight: '700',
            color: theme.textItemTitle,
        },
        statLabel: {
            fontFamily: Fonts.inter_regular || 'System',
            fontSize: 14,
            color: theme.textAuthor,
            marginTop: 2,
        },
        statDivider: {
            width: 1,
            height: 36,
            backgroundColor: theme.borderLight || '#E5E5E5',
            marginHorizontal: 16,
        },

        // --- BUTTONS ---
        followButton: {
            backgroundColor: theme.primary, 
            paddingVertical: 10,
            paddingHorizontal: 22,
            borderRadius: 100, 
            shadowColor: theme.primary,
            shadowOffset: { width: 0, height: 4 }, 
            shadowOpacity: 0.3,                 
            shadowRadius: 8,                    
            elevation: 4,                       
        },
        followButtonText: {
            color: '#FFFFFF',
            fontSize: 14,
            fontFamily: Fonts.inter_semi || 'System',
            fontWeight: '700',
        },
        followingButton: {
            backgroundColor: 'transparent', 
            borderColor: theme.borderLight || '#E5E5E5',
            borderWidth: 1.5,
            shadowOpacity: 0, 
            elevation: 0,
        },
        followingButtonText: {
            color: theme.textDisplay,
        },

        // --- TABS ---
        tabContainer: {
            flexDirection: 'row',
            paddingHorizontal: 24,
            marginTop: 8,
            borderBottomWidth: 1,
            borderBottomColor: theme.borderLight || '#F0F0F0',
        },
        tab: {
            paddingVertical: 12,
            marginRight: 32,
            position: 'relative',
        },
        tabText: {
            fontFamily: Fonts.inter_semi || 'System',
            fontWeight: '600',
            fontSize: 15,
            color: theme.textMuted,
        },
        activeTabText: {
            color: theme.textItemTitle,
        },
        activeIndicator: {
            position: 'absolute',
            bottom: -1,
            left: 0,
            right: 0,
            height: 3,
            backgroundColor: theme.primary,
            borderTopLeftRadius: 3,
            borderTopRightRadius: 3,
        },

        // --- GRID CONTENT ---
        tabContentContainer: {
            paddingHorizontal: 20,
            paddingTop: 24,
        },
        gridContainer: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
        },
        publicationCard: {
            width: '47.5%',
            marginBottom: 20,
        },
        bookCoverPlaceholder: {
            width: '100%',
            aspectRatio: 3 / 4, 
            backgroundColor: theme.coverPlaceholder || '#F4F4F5',
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 10,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.03)',
        },
        bookCoverImage: {
            width: '100%',
            height: '100%',
        },
        bookInfo: {
            paddingHorizontal: 4,
        },
        bookTitle: {
            fontFamily: Fonts.inter_semi || 'System',
            fontWeight: '600',
            fontSize: 14,
            color: theme.textItemTitle || '#1C1C1E',
        },

        // --- EMPTY STATE ---
        emptyStateContainer: {
            paddingTop: 48,
            paddingBottom: 48,
            alignItems: 'center',
            justifyContent: 'center',
        },
        emptyStateText: {
            fontFamily: Fonts.inter_regular || 'System',
            color: theme.textMuted || '#999999',
            fontSize: 15,
            marginTop: 16,
        }
    });
};
