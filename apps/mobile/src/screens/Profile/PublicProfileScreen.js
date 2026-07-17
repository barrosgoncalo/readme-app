import React from 'react';
import {
    View, Text, TouchableOpacity, ScrollView,
    StatusBar, ActivityIndicator, RefreshControl,
} from 'react-native';
import { ROUTES } from '@readme/shared/src/constants/routes'
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Iconify } from 'react-native-iconify';
import { buildPublicProfileStyles } from '../../styles/publicProfileStyles';

import { useTheme } from '@readme/shared/src/hooks/use-theme';
import { usePublicProfile } from '@readme/shared/src/hooks/use-public-profile';
import { ReportModal } from '../../components/ui/ReportModal';

export default function PublicProfileScreen({ navigation, route }) {
    const userId = route.params?.ownerId;
    const theme = useTheme();
    const styles = buildPublicProfileStyles(theme);

    const {
        profile, publications, reviews, loading, refreshing, activeTab, setActiveTab,
        isFollowing, isRequestPending, isValidPhoto, currentBadge, displayedFollowers,
        loadProfileData, handleFollowToggle,
        handleOpenOptions,
        reportModalVisible,
        reportModalProps,
    } = usePublicProfile(userId, navigation);

    const isLockedPrivateView = profile?.profileVisibility === 'private' && !isFollowing;

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
                        onPress={() => navigation.navigate({
                            name: ROUTES.PUBLICATION_DETAILS,
                            key: `PublicationDetails-${item.id}`,
                            params: {
                                publicationId: item.id,
                                publication: item,
                            }
                        })}
                        activeOpacity={0.8}
                    >
                        <View style={styles.bookCoverPlaceholder}>
                            {item.imageUrl ? (
                                <Image
                                    source={{ uri: item.imageUrl }}
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
                                {item.title || 'Untitled Book'}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    const renderReviews = () => {
        if (reviews.length === 0) {
            return (
                <View style={styles.emptyStateContainer}>
                    <Iconify icon="lucide:message-square-dashed" size={48} color={theme.borderLight} />
                    <Text style={styles.emptyStateText}>No reviews yet.</Text>
                </View>
            );
        }

        return (
            <View style={styles.reviewsListContainer}>
                {reviews.map((review) => (
                    <View key={review.id} style={styles.reviewCard}>
                        <View style={styles.reviewHeader}>
                            <Text style={styles.reviewAuthor}>{review.authorName}</Text>

                            <View style={styles.ratingContainer}>
                                {[1, 2, 3, 4, 5].map((star) => {
                                    const isFilled = star <= review.rating;
                                    return (
                                        <Iconify
                                            key={star}
                                            icon={isFilled ? "ph:star-fill" : "ph:star"}
                                            size={16}
                                            color={isFilled ? theme.secondary : (theme.textMuted || '#A0A0A0')}
                                        />
                                    );
                                })}
                            </View>
                        </View>

                        {review.comment && review.comment.trim() !== "" && (
                            <Text style={styles.reviewText}>{review.comment}</Text>
                        )}

                        <Text style={styles.reviewDate}>
                            {new Date(review.createdAt).toLocaleDateString()}
                        </Text>
                    </View>
                ))}
            </View>
        );
    };

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

                <View style={styles.infoContainer}>
                    <View style={styles.headerRow}>
                        <View style={styles.nameWrapper}>
                            <Text style={styles.name} numberOfLines={1}>{profile?.username || 'Unknown User'}</Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.followButton, (isFollowing || isRequestPending) && styles.followingButton]}
                            onPress={handleFollowToggle}
                            activeOpacity={0.8}
                            disabled={isRequestPending}
                        >
                            <Text style={[styles.followButtonText, (isFollowing || isRequestPending) && styles.followingButtonText]}>
                                {isFollowing ? "Following" : isRequestPending ? "Requested" : "Follow"}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {currentBadge && (
                        <View style={styles.badgeRow}>
                            <Image
                                source={currentBadge.image}
                                style={styles.badgeImage}
                                contentFit="contain"
                            />
                            <Text style={styles.badgeText}>
                                {currentBadge.title}
                            </Text>
                        </View>
                    )}

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

                {/* --- CONDITIONAL RENDERING STARTS HERE --- */}
                {isLockedPrivateView ? (
                    // What shows if the account is private and not followed
                    <View style={{ padding: 40, alignItems: 'center', marginTop: 20 }}>
                        <Iconify icon="lucide:lock" size={48} color={theme.borderLight || "#A0A0A0"} />
                        <Text style={{ fontFamily: 'Inter-Bold', fontSize: 18, color: theme.text, marginTop: 16 }}>
                            This account is private
                        </Text>
                        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, color: theme.textMuted, textAlign: 'center', marginTop: 8 }}>
                            Follow this user to see their publications and reviews.
                        </Text>
                    </View>
                ) : (
                    // What shows normally (Your existing tabs and lists)
                    <>
                        <View style={styles.tabContainer}>
                            <TouchableOpacity style={styles.tab} onPress={() => setActiveTab('publications')}>
                                <Text style={[styles.tabText, activeTab === 'publications' && styles.activeTabText]}>Publications</Text>
                                {activeTab === 'publications' && <View style={styles.activeIndicator} />}
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.tab} onPress={() => setActiveTab('reviews')}>
                                <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>Reviews</Text>
                                {activeTab === 'reviews' && <View style={styles.activeIndicator} />}
                            </TouchableOpacity>
                        </View>

                        <View style={styles.tabContentContainer}>
                            {activeTab === 'publications' ? renderPublications() : renderReviews()}
                        </View>
                    </>
                )}
                {/* --- CONDITIONAL RENDERING ENDS HERE --- */}
            </ScrollView>

            {/* Report reason picker — was missing before, which is why
                handleReportProfile appeared to do nothing */}
            <ReportModal
                visible={reportModalVisible}
                {...reportModalProps}
            />
        </View>

    );
}