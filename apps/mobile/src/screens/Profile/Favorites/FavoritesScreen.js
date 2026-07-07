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
                setIsLoading(false);
                return;
            }

            const favoriteIds = userDocSnap.data().favoriteBooks || [];

            if (favoriteIds.length === 0) {
                setFavorites([]);
                setIsLoading(false);
                return;
            }

            const fetchPromises = favoriteIds.map(id => getDoc(doc(db, 'publications', id)));
            const documentSnapshots = await Promise.all(fetchPromises);

            const fetchedFavorites = documentSnapshots
                .filter(snap => snap.exists())
                .map(snap => {
                    const data = snap.data();
                    return {
                        id: snap.id,
                        uid: data.uid,
                        title: data.book?.title || 'Unknown Title',
                        author: data.book?.author || 'Unknown Author',
                        imageUrl: data.book?.images && data.book.images.length > 0 
                            ? data.book.images[0] 
                            : null,
                        seller: {
                            name: data.sellerName || data.ownerName || 'Anonymous Swapper',
                            avatarUrl: data.sellerAvatar || data.ownerAvatar || null,
                        },
                        favoriteCount: data.stats?.likesCount || 0,
                        publicationData: data,
                        isFavorite: true
                    };
                });

            setFavorites(fetchedFavorites);

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
                                book: item,
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
