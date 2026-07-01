import React, { useState } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    ScrollView, 
    StyleSheet, 
    Dimensions,
    Alert,
    StatusBar,
    useColorScheme
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Iconify } from 'react-native-iconify';

import { Colors, Fonts } from '@readme/shared/src/constants/theme';

const { width } = Dimensions.get('window');

const MOCK_PROFILE = {
    name: "Sophie Bennett",
    isVerified: true,
    bio: "Product Designer who focuses on simplicity & usability.",
    followers: 312,
    completedTrades: 48,
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
};

export default function PublicProfileScreen({ navigation, route }) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const styles = buildProfileStyles(theme);

    const [activeTab, setActiveTab] = useState('publications');
    const [isFollowing, setIsFollowing] = useState(false);

    const handleOpenOptions = () => {
        Alert.alert("User Options", "What would you like to do?", [
            { text: "Cancel", style: "cancel" },
            { text: "Report User", onPress: () => console.log("Report") },
            { text: "Block User", onPress: () => console.log("Block"), style: "destructive" }
        ]);
    };

    const renderPublications = () => (
        <View style={styles.gridContainer}>
            {[1, 2, 3, 4].map((item) => (
                <View key={item} style={styles.publicationCard}>
                    <View style={styles.bookCoverPlaceholder}>
                        <Iconify icon="lucide:book" size={32} color={theme.textMuted || "#A0A0A0"} />
                    </View>
                    <Text style={styles.bookTitle} numberOfLines={1}>Book Title {item}</Text>
                </View>
            ))}
        </View>
    );

    const renderReviews = () => (
        <View style={styles.reviewsContainer}>
            <Text style={styles.emptyStateText}>No reviews yet.</Text>
        </View>
    );

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

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                
                {/* --- IMAGE AT THE VERY TOP --- */}
                <View style={styles.imageContainer}>
                    <Image 
                        source={{ uri: MOCK_PROFILE.avatarUrl }} 
                        style={styles.profileImage}
                        contentFit="cover"
                        transition={300}
                    />
                </View>

                {/* --- PROFILE INFO & BIO --- */}
                <View style={styles.infoContainer}>
                    <View style={styles.nameRow}>
                        <Text style={styles.name}>{MOCK_PROFILE.name}</Text>
                        {MOCK_PROFILE.isVerified && (
                            <Iconify icon="mdi:check-decagram" size={24} color="#22C55E" style={{ marginLeft: 6 }} />
                        )}
                    </View>
                    
                    <Text style={styles.bio}>{MOCK_PROFILE.bio}</Text>

                    {/* --- STATS ROW --- */}
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Iconify icon="lucide:user" size={18} color={theme.subtext || "#666666"} />
                            <Text style={styles.statText}>{MOCK_PROFILE.followers + (isFollowing ? 1 : 0)}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Iconify icon="lucide:copy-check" size={18} color={theme.subtext || "#666666"} />
                            <Text style={styles.statText}>{MOCK_PROFILE.completedTrades}</Text>
                        </View>

                        <View style={{ flex: 1 }} /> 

                        {/* --- FOLLOW BUTTON --- */}
                        <TouchableOpacity 
                            style={[styles.followButton, isFollowing && styles.followingButton]}
                            onPress={() => setIsFollowing(!isFollowing)}
                        >
                            <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                                {isFollowing ? "Following" : "Follow"}
                            </Text>
                            <Iconify 
                                icon={isFollowing ? "lucide:check" : "lucide:plus"} 
                                size={18} 
                                color={isFollowing ? theme.primary : theme.pureWhite} 
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
            backgroundColor: theme.headerBackground || 'rgba(0, 0, 0, 0.35)',
            borderRadius: 12,
            justifyContent: 'center',
            alignItems: 'center',
            opacity: 0.9,
        },
        scrollContent: {
            paddingBottom: 40,
        },
        imageContainer: {
            width: width,
            height: 380, 
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
            fontSize: 28,
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
            fontSize: 16,
            fontWeight: '600',
            color: theme.textItemTitle,
            marginLeft: 6,
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
            borderBottomColor: theme.quaternary,
        },
        tabText: {
            fontSize: 16,
            fontWeight: '500',
            color: theme.textMuted,
        },
        activeTabText: {
            color: theme.textItemTitle,
            fontWeight: '700',
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
        },
        bookTitle: {
            fontSize: 14,
            fontWeight: '600',
            color: theme.textItemTitle || '#333333',
        },
        reviewsContainer: {
            padding: 40,
            alignItems: 'center',
        },
        emptyStateText: {
            color: theme.textMuted || '#999999',
            fontSize: 15,
        }
    });
};
