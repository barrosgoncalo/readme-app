import React from 'react';
import { useAuth } from '@readme/shared/src/contexts/AuthContext';
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    StatusBar,
    ActivityIndicator,
    useColorScheme
} from 'react-native';
import { ROUTES } from '@readme/shared/src/constants/routes';
import { useTheme } from '@readme/shared/src/hooks/use-theme';
import { Iconify } from 'react-native-iconify';
import { buildExploreStyles } from '../../styles/exploreStyles';
import { useScrollTabBarControl } from '../../hooks/use-scroll-tab-bar-control';
import { useExploreData } from '@readme/shared/src/hooks/use-explore-data';

import { ActiveSwapsSection } from '../../components/ui/ActiveSwapsSection';
import { BookGridItem } from '../../components/ui/BookGridItem';

export default function ExploreScreen({ navigation }) {
    const colorScheme = useColorScheme();
    const theme = useTheme();
    const styles = buildExploreStyles(theme);
    const handleScroll = useScrollTabBarControl();

    const { currentUser } = useAuth();

    const {
        books,
        userFavorites,
        isLoadingBooks,
        handleToggleFavorite,
    } = useExploreData(currentUser?.uid);

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <View style={{ maxWidth: '90%', marginRight: 12 }}>
                <Text style={styles.headerTitle} numberOfLines={2} ellipsizeMode="tail">
                    Hello, {currentUser?.username || 'Swapper'}
                </Text>
                <Text style={styles.headerSubtitle}>Let's start swapping</Text>
            </View>
            <TouchableOpacity
                style={styles.searchButton}
                onPress={() => navigation.navigate(ROUTES.SEARCH)}
            >
                <Iconify icon="lucide:search" size={28} color={theme.icon} />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar
                barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
                backgroundColor={theme.background}
            />

            {isLoadingBooks ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <FlatList
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
                            isFavorite={item.isFavorite ?? userFavorites.includes(item.id)}
                            favoriteCount={item.favoriteCount}
                            onPress={() => navigation.navigate(ROUTES.PUBLICATION_DETAILS, {
                                publication: item,
                                seller: item.seller
                            })}
                            onToggleFavorite={handleToggleFavorite}
                        />
                    )}
                    ListEmptyComponent={
                        <Text style={{ textAlign: 'center', color: theme.subtext, marginTop: 40 }}>
                            No books published yet. Be the first to swap!
                        </Text>
                    }
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}
