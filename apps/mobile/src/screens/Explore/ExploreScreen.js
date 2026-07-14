import React, {useCallback, useEffect, useRef} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {useAuth} from '@readme/shared/src/contexts/AuthContext';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StatusBar,
    Text,
    TouchableOpacity,
    useColorScheme,
    View
} from 'react-native';
import {ROUTES} from '@readme/shared/src/constants/routes';
import {useTheme} from '@readme/shared/src/hooks/use-theme';
import {Iconify} from 'react-native-iconify';
import {buildExploreStyles} from '../../styles/exploreStyles';
import {useScrollTabBarControl} from '../../hooks/use-scroll-tab-bar-control';
import {useExploreFeed} from '@readme/shared/src/hooks/use-explore-feed';
import {useFavoriteStatus} from '@readme/shared/src/hooks/use-favorite-status';

import {ActiveSwapsSection} from '../../components/ui/ActiveSwapsSection';
import {BookGridItem} from '../../components/ui/BookGridItem';

export default function ExploreScreen({ navigation }) {
    const colorScheme = useColorScheme();
    const theme = useTheme();
    const styles = buildExploreStyles(theme);
    const handleScroll = useScrollTabBarControl();
    const { currentUser } = useAuth();

    const listRef = useRef(null);

    const {
        items: books,
        isLoadingInitial,
        isLoadingMore,
        isRefreshing,
        loadMore,
        refresh,
        updateItem,
    } = useExploreFeed({ excludeUid: currentUser?.uid });

    const { favoriteIds, toggleFavorite, refreshFavorites } = useFavoriteStatus(currentUser?.uid);

    useFocusEffect(
        useCallback(() => {
            refreshFavorites();
        }, [refreshFavorites])
    );

    // Tapping the home tab while already on Explore scrolls to top,
    // matching the standard iOS/Android "tap active tab" behavior.
    useEffect(() => {
        return navigation.addListener('tabPress', () => {
            if (navigation.isFocused()) {
                listRef.current?.scrollToOffset({offset: 0, animated: true});
            }
        });
    }, [navigation]);


    const handleToggleFavorite = useCallback(
        (bookId) => toggleFavorite(bookId, updateItem),
        [toggleFavorite, updateItem]
    );

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <View style={{ maxWidth: '90%', marginRight: 12 }}>
                <Text style={styles.headerTitle} numberOfLines={2} ellipsizeMode="tail">
                    Hello, {currentUser?.username || 'Swapper'}
                </Text>
                <Text style={styles.headerSubtitle}>Let's start swapping</Text>
            </View>
            <TouchableOpacity style={styles.searchButton} onPress={() => navigation.navigate(ROUTES.SEARCH)}>
                <Iconify icon="lucide:search" size={28} color={theme.icon} />
            </TouchableOpacity>
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
                            No books published yet. Be the first to swap!
                        </Text>
                    }
                    ListFooterComponent={renderFooter}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={theme.primary} />
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
        </View>
    );
}