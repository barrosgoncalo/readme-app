import React, { useCallback, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    StatusBar,
    useColorScheme
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@readme/shared/src/contexts/AuthContext';
import { useTheme } from '@readme/shared/src/hooks/use-theme';
import { ROUTES } from '@readme/shared/src/constants/routes';
import { buildBookGridStyles } from '../../../styles/bookGridStyles';

import { BookGridItem } from '../../../components/ui/BookGridItem';
import { useFavoritesFeed } from '@readme/shared/src/hooks/use-favorites-feed';
import { UsersService } from '@readme/shared/src/services/users';
import ScreenHeader from '../../../components/ui/ScreenHeader';

export default function FavoritesScreen({ navigation }) {
    const colorScheme = useColorScheme();
    const theme = useTheme();
    const styles = buildBookGridStyles(theme);
    const { currentUser } = useAuth();

    const {
        items: favorites,
        isLoadingInitial,
        isLoadingMore,
        isRefreshing,
        loadMore,
        refresh,
        removeItem,
    } = useFavoritesFeed(currentUser?.uid);

    const isFirstMount = useRef(true);

    useFocusEffect(
        useCallback(() => {
            // Let feed.loadInitial() handle the first mount. 
            // Only refresh on subsequent returns to this screen.
            if (isFirstMount.current) {
                isFirstMount.current = false;
                return;
            }
            refresh();
        }, [refresh]) 
    );

    const handleRemoveFavorite = useCallback(async (bookId) => {
        // Optimistic: drop it from the visible list immediately, roll
        // back with a full refresh if the backend call fails.
        removeItem(bookId);
        try {
            await UsersService.toggleFavoriteStatus(currentUser.uid, bookId, true);
        } catch (error) {
            console.error('Failed to remove favorite:', error);
            refresh();
        }
    }, [currentUser, removeItem, refresh]);

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

            <ScreenHeader
                title="Favorites"
                onBack={() => navigation.goBack()}
                theme={theme}
                variant="large"
            />

            {isLoadingInitial ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <FlatList
                    data={favorites}
                    keyExtractor={(item) => item.id}
                    numColumns={2}
                    columnWrapperStyle={styles.row}
                    contentContainerStyle={styles.gridContainer}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <BookGridItem
                            bookId={item.id}
                            title={item.title}
                            author={item.author}
                            imageUrl={item.imageUrl}
                            styles={styles}
                            theme={theme}
                            isFavorite
                            favoriteCount={item.favoriteCount}
                            onPress={() => navigation.navigate(ROUTES.PUBLICATION_DETAILS, {
                                publication: item,
                                seller: item.seller
                            })}
                            onToggleFavorite={handleRemoveFavorite}
                        />
                    )}
                    ListEmptyComponent={
                        <Text style={{ textAlign: 'center', color: theme.subtext, marginTop: 40 }}>
                            You haven't favorited any books yet.
                        </Text>
                    }
                    ListFooterComponent={renderFooter}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={theme.primary} />
                    }
                />
            )}
        </View>
    );
}
