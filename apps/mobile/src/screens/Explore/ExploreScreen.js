import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@readme/shared/src/contexts/AuthContext';
import {
    View, Text, TouchableOpacity, FlatList, StatusBar,
    ActivityIndicator, RefreshControl, useColorScheme
} from 'react-native';
import { ROUTES } from '@readme/shared/src/constants/routes';
import { useTheme } from '@readme/shared/src/hooks/use-theme';
import { Iconify } from 'react-native-iconify';
import { SORT_OPTIONS } from '@readme/shared/src/services/searchBook';
import { buildExploreStyles } from '../../styles/exploreStyles';
import { useScrollTabBarControl } from '../../hooks/use-scroll-tab-bar-control';
import { useExploreFeed } from '@readme/shared/src/hooks/use-explore-feed';
import { useFavoriteStatus } from '@readme/shared/src/hooks/use-favorite-status';

import { ActiveSwapsSection } from '../../components/ui/ActiveSwapsSection';
import { BookGridItem } from '../../components/ui/BookGridItem';
import PublicationFilterModal from '../../components/ui/PublicationFilterModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ExploreScreen({ navigation }) {
    const colorScheme = useColorScheme();
    const theme = useTheme();
    const styles = buildExploreStyles(theme);
    const handleScroll = useScrollTabBarControl();
    const { currentUser } = useAuth();
    const insets = useSafeAreaInsets();

    const listRef = useRef(null);

    // --- filter/sort state, same shape as SearchScreen's ---
    const [filtersVisible, setFiltersVisible] = useState(false);
    const [sortBy, setSortBy] = useState(SORT_OPTIONS.DATE_DESC);
    const [conditionFilters, setConditionFilters] = useState([]);
    const [genreFilters, setGenreFilters] = useState([]);

    const {
        items: books,
        isLoadingInitial,
        isLoadingMore,
        isRefreshing,
        loadMore,
        refresh,
        updateItem,
        syncBlockedUsers, // <-- 1. Extract the new sync method
    } = useExploreFeed({
        excludeUid: currentUser?.uid,
        sortBy,
        conditions: conditionFilters,
        genres: genreFilters,
    });

    const { favoriteIds, toggleFavorite, refreshFavorites } = useFavoriteStatus(currentUser?.uid);

    useFocusEffect(
        useCallback(() => {
            refreshFavorites();
            syncBlockedUsers(); 
        }, [refreshFavorites, syncBlockedUsers])
    );

    // Tapping the home tab while already on Explore scrolls to top,
    // matching the standard iOS/Android "tap active tab" behavior.
    useEffect(() => {
        return navigation.addListener('tabPress', () => {
            if (navigation.isFocused()) {
                listRef.current?.scrollToOffset({ offset: 0, animated: true });
            }
        });
    }, [navigation]);

    const handleToggleFavorite = useCallback(
        (bookId) => toggleFavorite(bookId, updateItem),
        [toggleFavorite, updateItem]
    );

    const handleApplyFilters = (newSortBy, newConditions, newGenres) => {
        setSortBy(newSortBy);
        setConditionFilters(newConditions);
        setGenreFilters(newGenres);
        setFiltersVisible(false);
    };

    const hasActiveFilters = sortBy !== SORT_OPTIONS.DATE_DESC
        || conditionFilters.length > 0
        || genreFilters.length > 0;

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            {/* Added paddingRight so long text wraps before hitting the icons */}
            <View style={{ paddingRight: 80 }}>
                <Text style={styles.headerTitle} numberOfLines={2} ellipsizeMode="tail">
                    Hello, {currentUser?.username || 'Swapper'}
                </Text>
                <Text style={styles.headerSubtitle}>Let's start swapping</Text>
            </View>

            {/* Changed to use the new absolute positioned style */}
            <View style={styles.headerActions}>
                <TouchableOpacity
                    style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
                    onPress={() => setFiltersVisible(true)}
                    activeOpacity={0.8}
                >
                    <Iconify
                        icon="lucide:sliders-horizontal"
                        size={18}
                        color={hasActiveFilters ? theme.pillButtonActiveText : theme.icon}
                    />
                    {hasActiveFilters && <View style={styles.filterBadgeDot} />}
                </TouchableOpacity>
                <TouchableOpacity style={styles.searchButton} onPress={() => navigation.navigate(ROUTES.SEARCH)}>
                    <Iconify icon="lucide:search" size={28} color={theme.icon} />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderFooter = () => {
        if (!isLoadingMore) return null;
        return (
            <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator size="small" color={theme.primary} />
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar
                barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
                backgroundColor={theme.background}
            />

            {isLoadingInitial ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <FlatList
                    ref={listRef}
                    data={books}
                    keyExtractor={(item) => item.id}
                    numColumns={2}
                    columnWrapperStyle={styles.row}
                    contentContainerStyle={styles.gridContainer}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    ListHeaderComponent={
                        <>
                            {renderHeader()}
                            <ActiveSwapsSection
                                currentUserId={currentUser?.uid}
                                navigation={navigation}
                                styles={styles}
                                colorScheme={colorScheme}
                                theme={theme}
                            />
                        </>
                    }
                    renderItem={({ item }) => (
                        <BookGridItem
                            bookId={item.id}
                            title={item.title}
                            author={item.author}
                            imageUrl={item.imageUrl}
                            styles={styles}
                            theme={theme}
                            isFavorite={favoriteIds.has(item.id)}
                            favoriteCount={item.favoriteCount}
                            onPress={() => navigation.navigate(ROUTES.PUBLICATION_DETAILS, {
                                publication: item,
                                seller: item.seller,
                            })}
                            onToggleFavorite={handleToggleFavorite}
                        />
                    )}
                    ListEmptyComponent={
                        <Text style={{ textAlign: 'center', color: theme.subtext, marginTop: 40 }}>
                            {hasActiveFilters
                                ? 'No books match these filters'
                                : 'No books published yet. Be the first to swap!'}
                        </Text>
                    }
                    ListFooterComponent={renderFooter}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={refresh}
                            tintColor={theme.primary}
                            progressViewOffset={insets.top}
                        />
                    }
                    maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
                    removeClippedSubviews
                    windowSize={7}
                    initialNumToRender={8}
                    maxToRenderPerBatch={8}
                    updateCellsBatchingPeriod={50}
                    showsVerticalScrollIndicator={false}
                />
            )}

            <PublicationFilterModal
                visible={filtersVisible}
                onClose={() => setFiltersVisible(false)}
                onApply={handleApplyFilters}
                initialSortBy={sortBy}
                initialConditions={conditionFilters}
                initialGenres={genreFilters}
                theme={theme}
                styles={styles}
                resetSortBy={SORT_OPTIONS.DATE_DESC}
            />
        </View>
    );
}
