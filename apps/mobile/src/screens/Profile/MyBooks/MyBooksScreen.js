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
} from 'firebase/firestore';
import { db } from '@readme/shared/src/services/firebase';
import { PublicationService } from '@readme/shared/src/services/publications';

export default function MyPostingsScreen({ navigation }) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const styles = buildExploreStyles(theme); 

    const insets = useSafeAreaInsets();
    const { currentUser } = useAuth();

    const [myBooks, setMyBooks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchMyPostings = async () => {
        if (!currentUser?.uid) return;
        setIsLoading(true);

        try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            const favoriteIds = userDocSnap.exists() ? (userDocSnap.data().favoriteBooks || []) : [];

            const fetchedBooks = await PublicationService.fetchUserPublications(currentUser.uid);

            setMyBooks(fetchedBooks.map(book => ({
                ...book,
                isFavorite: favoriteIds.includes(book.id)
            })));
        } catch (error) {
            console.error("Error fetching my postings:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleFavorite = async (bookId, currentIsFavorite) => {
        setMyBooks(prev => prev.map(book => {
            if (book.id === bookId) {
                return {
                    ...book,
                    isFavorite: !currentIsFavorite,
                    favoriteCount: book.favoriteCount + (currentIsFavorite ? -1 : 1)
                };
            }
            return book;
        }));

        try {
            await PublicationService.toggleFavorite(currentUser.uid, bookId, currentIsFavorite);
        } catch (error) {
            console.error("Failed to toggle favorite status:", error);
            fetchMyPostings();
        }
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchMyPostings();
        });
        return unsubscribe;
    }, [navigation, currentUser]);

    return (
        <View style={styles.container}>
            <StatusBar 
                barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} 
                backgroundColor={theme.background} 
            />

            {/* --- CABEÇALHO --- */}
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
                    Postings
                </Text>
            </View>

            {isLoading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                    <FlatList
                        data={myBooks}
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
                                onPress={() => navigation.navigate(ROUTES.MY_PUBLICATION_DETAILS, { 
                                    publication: item 
                                })}
                                onToggleFavorite={handleToggleFavorite}
                            />
                        )}
                        ListEmptyComponent={
                            <View style={{ flex: 1, alignItems: 'center', marginTop: 60, paddingHorizontal: 32 }}>
                                <Iconify icon="lucide:book-open" size={48} color={theme.subtext} style={{ marginBottom: 12, opacity: 0.5 }} />
                                <Text style={{ textAlign: 'center', color: theme.subtext, fontSize: 15, lineHeight: 22 }}>
                                    You haven't posted any books yet. Books you put up for swapping will appear here.
                                </Text>
                            </View>
                        }
                    />
                )}
        </View>
    );
}
