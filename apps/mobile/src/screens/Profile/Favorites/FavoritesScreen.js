import React, { useEffect, useState } from 'react';
import { 
    View, 
    Text, 
    FlatList, 
    ActivityIndicator, 
    StatusBar,
    TouchableOpacity,
    useColorScheme 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Iconify } from 'react-native-iconify';
import { useAuth } from '@readme/shared/src/contexts/AuthContext';
import { Colors } from '@readme/shared/src/constants/theme';
import { ROUTES } from '@readme/shared/src/constants/routes';
import { buildExploreStyles } from '../../../styles/exploreStyles';

import { BookGridItem } from '../../../components/ui/BookGridItem';
import { 
    doc, 
    getDoc, 
    updateDoc, 
    arrayRemove, 
    increment 
} from 'firebase/firestore';
import { db } from '@readme/shared/src/services/firebase';
import { PublicationService } from '@readme/shared/src/services/publications';

export default function FavoritesScreen({ navigation }) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const styles = buildExploreStyles(theme); 

    const insets = useSafeAreaInsets();

    const { currentUser } = useAuth();
    
    const [favorites, setFavorites] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchFavoriteBooks = async () => {
        if (!currentUser?.uid) return;
        setIsLoading(true);

        try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (!userDocSnap.exists()) {
                setFavorites([]);
                return;
            }

            const favoriteIds = userDocSnap.data().favoriteBooks || [];
            const fetchedFavorites = await PublicationService.fetchPublicationsByIds(favoriteIds);

            setFavorites(fetchedFavorites.map(book => ({ ...book, isFavorite: true })));
        } catch (error) {
            console.error("Error fetching favorites:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveFavorite = async (bookId, currentIsFavorite, currentCount) => {
        setFavorites(prev => prev.filter(book => book.id !== bookId));

        try {
            const userDocRef = doc(db, 'users', currentUser.uid); 
            const publicationDocRef = doc(db, 'publications', bookId);

            await Promise.all([
                updateDoc(userDocRef, {
                    favoriteBooks: arrayRemove(bookId)
                }),
                updateDoc(publicationDocRef, {
                    "stats.likesCount": increment(-1)
                })
            ]);
        } catch (error) {
            console.error("Failed to remove favorite:", error);
            fetchFavoriteBooks(); 
        }
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchFavoriteBooks();
        });
        return unsubscribe;
    }, [navigation, currentUser]);

    return (
        <View style={styles.container}>
            <StatusBar 
                barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} 
                backgroundColor={theme.background} 
            />

            {/* --- CUSTOM HEADER FIX --- */}
            <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                paddingHorizontal: 16, 
                paddingTop: insets.top + 12, 
                paddingBottom: 16,
            }}>
                <TouchableOpacity 
                    onPress={() => navigation.goBack()}
                    style={{ padding: 8, marginLeft: -8, marginRight: 8 }}
                >
                    <Iconify icon="lucide:arrow-left" size={24} color={theme.text} />
                </TouchableOpacity>
                
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.text }}>
                    Favorites
                </Text>
            </View>

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
