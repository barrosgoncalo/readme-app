import React, { useEffect } from 'react';
import { 
    View, 
    Text, 
    FlatList, 
    ActivityIndicator, 
    StatusBar,
    useColorScheme 
} from 'react-native';
import { useAuth } from '@readme/shared/src/contexts/AuthContext';
import { Colors } from '@readme/shared/src/constants/theme';
import { ROUTES } from '@readme/shared/src/constants/routes';
import { buildBookGridStyles } from '../../../styles/bookGridStyles';

import { BookGridItem } from '../../../components/ui/BookGridItem';
import { useFavorites } from '@readme/shared/src/hooks/use-favorites';
import ScreenHeader from '../../../components/ui/ScreenHeader';

export default function FavoritesScreen({ navigation }) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const styles = buildBookGridStyles(theme); 

    const { currentUser } = useAuth();
    
    const {
        favorites,
        isLoading,
        fetchFavoriteBooks,
        handleRemoveFavorite
    } = useFavorites(currentUser?.uid);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchFavoriteBooks();
        });
        return unsubscribe;
    }, [navigation, fetchFavoriteBooks]);

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

            {isLoading ? (
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
                            isFavorite={item.isFavorite}
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
                />
            )}
        </View>
    );
}
