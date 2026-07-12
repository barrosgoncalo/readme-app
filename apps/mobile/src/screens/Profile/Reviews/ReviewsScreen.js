import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    ActivityIndicator,
    RefreshControl,
    FlatList,
    StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Iconify } from 'react-native-iconify';

// Theme & Service Imports
import { useTheme } from '@readme/shared/src/hooks/use-theme';
import { buildReviewsStyles } from '../../../styles/reviewsStyles';
import { ReviewService } from '@readme/shared/src/services/reviews';
import { useAuth } from '@readme/shared/src/contexts/AuthContext'; 

import { GranularRating } from '../../../components/ui/GranularRating';

export default function UserReviewsScreen({ navigation, route }) {
    const { currentUser } = useAuth();
    const userId = route.params?.userId || currentUser?.uid;

    const theme = useTheme();
    const styles = buildReviewsStyles(theme);

    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
        ? (reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews).toFixed(1) 
        : 0;

    const loadReviews = async (showRefreshIndicator = false) => {
        if (!userId) return;
        if (showRefreshIndicator) setRefreshing(true);
        else setLoading(true);

        try {
            const reviewsData = await ReviewService.fetchUserReviews(userId);
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

    // ─── RENDERERS ───
    const renderHeader = () => (
        <View style={styles.aggregateContainer}>
            <Text style={styles.aggregateScore}>{averageRating}</Text>
            {/* Massive size for the layout header banner */}
            <GranularRating rating={Number(averageRating)} theme={theme} size={32} />
            <Text style={styles.aggregateSubtitle}>
                Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
            </Text>
        </View>
    );

    const renderReviewItem = ({ item }) => (
        <View style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
                <Text style={styles.reviewAuthor}>{item.authorName || 'Anonymous'}</Text>
                {/* Standard size inside standard rows */}
                <GranularRating rating={item.rating} theme={theme} size={14} />
            </View>

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
