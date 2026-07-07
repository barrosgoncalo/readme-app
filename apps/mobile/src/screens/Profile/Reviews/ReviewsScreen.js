import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    StyleSheet, 
    ActivityIndicator,
    RefreshControl,
    FlatList,
    useColorScheme,
    StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Iconify } from 'react-native-iconify';

// Adjust import paths based on your project structure
import { Colors, Fonts } from '@readme/shared/src/constants/theme';
import { fetchUserReviews } from '@readme/shared/src/services/reviews';
import { useAuth } from '@readme/shared/src/contexts/AuthContext'; 

export default function UserReviewsScreen({ navigation, route }) {
    const { currentUser } = useAuth();
    // Prioritize passed userId, fallback to current user
    const userId = route.params?.userId || currentUser?.uid;

    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const styles = buildReviewsStyles(theme);

    // --- STATE MANAGEMENT ---
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // --- AGGREGATE DATA ---
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
        ? (reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews).toFixed(1) 
        : 0;

    // --- DATA FETCHING ---
    const loadReviews = async (showRefreshIndicator = false) => {
        if (!userId) return;

        if (showRefreshIndicator) setRefreshing(true);
        else setLoading(true);

        try {
            const reviewsData = await fetchUserReviews(userId);
            setReviews(reviewsData || []);
        } catch (error) {
            console.error("Error loading reviews:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadReviews();
    }, [userId]);

    // --- HELPER COMPONENT: STAR RATING ---
    const StarRating = ({ rating, size = 16, activeColor = theme.secondary }) => {
        return (
            <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => {
                    // Handle half-stars conceptually by rounding
                    const isFilled = star <= Math.round(rating);
                    return (
                        <Iconify 
                            key={star} 
                            icon={isFilled ? "ph:star-fill" : "ph:star"} 
                            size={size} 
                            color={isFilled ? activeColor : (theme.textMuted || '#A0A0A0')} 
                        />
                    );
                })}
            </View>
        );
    };

    // --- RENDERERS ---
    
    const renderHeader = () => (
        <View style={styles.aggregateContainer}>
            <Text style={styles.aggregateScore}>{averageRating}</Text>
            <StarRating rating={averageRating} size={32} />
            <Text style={styles.aggregateSubtitle}>
                Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
            </Text>
        </View>
    );

    const renderReviewItem = ({ item }) => (
        <View style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
                <Text style={styles.reviewAuthor}>{item.authorName || 'Anonymous'}</Text>
                <StarRating rating={item.rating} size={14} />
            </View>

            {/* FIX: Using a ternary operator ensures it returns null, not an empty string */}
            {item.comment && item.comment.trim().length > 0 ? (
                <Text style={styles.reviewText}>{item.comment}</Text>
            ) : null}

            <Text style={styles.reviewDate}>
                {new Date(item.createdAt).toLocaleDateString()}
            </Text>
        </View>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyStateContainer}>
            <Iconify icon="lucide:message-square-dashed" size={48} color={theme.borderLight} />
            <Text style={styles.emptyStateText}>No reviews yet.</Text>
        </View>
    );

    if (loading) {
        return (
            <View style={[styles.container, styles.centerAll]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle={colorScheme === 'dark' ? "light-content" : "dark-content"} />

            <SafeAreaView edges={['top']} style={styles.navHeader}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Iconify icon="lucide:arrow-left" size={24} color={theme.textItemTitle} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Reviews</Text>
                <View style={{ width: 44 }} />
            </SafeAreaView>

            <FlatList
                data={reviews}
                keyExtractor={(item) => item.id}
                renderItem={renderReviewItem}
                ListHeaderComponent={totalReviews > 0 ? renderHeader : null}
                ListEmptyComponent={renderEmptyState}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={() => loadReviews(true)} 
                        tintColor={theme.primary} 
                    />
                }
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

// ==========================================
// DYNAMIC THEMED STYLES
// ==========================================
export const buildReviewsStyles = (theme) => {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.background,
        },
        centerAll: {
            justifyContent: 'center',
            alignItems: 'center'
        },
        // --- NAV HEADER ---
        navHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingBottom: 12,
            backgroundColor: theme.background,
        },
        backButton: {
            width: 44,
            height: 44,
            justifyContent: 'center',
            alignItems: 'flex-start',
        },
        headerTitle: {
            fontSize: 18,
            fontFamily: Fonts.inter_semi || 'System',
            fontWeight: '700',
            color: theme.textItemTitle,
        },
        listContent: {
            paddingHorizontal: 20,
            paddingBottom: 40,
        },
        // --- AGGREGATE SECTION (Header) ---
        // 🌟 UPDATED: Removed background, borders, radius. Just padding/alignment.
        aggregateContainer: {
            alignItems: 'center',
            paddingVertical: 32,
            marginBottom: 16,
        },
        aggregateScore: {
            fontSize: 64, // Made slightly larger for impact
            fontFamily: Fonts.inter_bold || 'System',
            fontWeight: '800',
            color: theme.textDisplay,
            marginBottom: 4, // Tighter margin to stars
            letterSpacing: -1,
        },
        starsContainer: {
            flexDirection: 'row',
            gap: 4,
        },
        aggregateSubtitle: {
            marginTop: 12,
            fontSize: 16,
            fontFamily: Fonts.inter_medium || 'System',
            color: theme.textMuted || '#999999',
        },
        // --- REVIEW CARDS ---
        reviewCard: {
            backgroundColor: theme.cardBackground || '#FFFFFF',
            padding: 16,
            borderRadius: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: theme.borderLight || '#F0F0F0',
            // Added subtle shadow for depth since header is flat
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.03,
            shadowRadius: 4,
            elevation: 2,
        },
        reviewHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
        },
        reviewAuthor: {
            fontFamily: Fonts.inter_semi || 'System',
            fontWeight: '600',
            fontSize: 15,
            color: theme.textItemTitle || '#1C1C1E',
        },
        reviewText: {
            fontFamily: Fonts.inter_regular || 'System',
            fontSize: 14,
            lineHeight: 22,
            color: theme.subtext || '#666666',
            marginBottom: 12,
        },
        reviewDate: {
            fontFamily: Fonts.inter_regular || 'System',
            fontSize: 12,
            color: theme.textMuted || '#999999',
            textAlign: 'right',
        },
        // --- EMPTY STATE ---
        emptyStateContainer: {
            paddingTop: 100,
            alignItems: 'center',
            justifyContent: 'center',
        },
        emptyStateText: {
            fontFamily: Fonts.inter_regular || 'System',
            color: theme.textMuted || '#999999',
            fontSize: 15,
            marginTop: 16,
        },
    });
};
