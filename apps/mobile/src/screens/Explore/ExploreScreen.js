import React, { useEffect, useState } from 'react';
import { useAuth } from '@readme/shared/src/contexts/AuthContext';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    FlatList,
    StatusBar,
    useColorScheme,
    ActivityIndicator
} from 'react-native';
import { ROUTES } from '@readme/shared/src/constants/routes';
import { Colors } from '@readme/shared/src/constants/theme';
import { Iconify } from 'react-native-iconify';
import { buildExploreStyles } from '../../styles/exploreStyles';
import { useScrollTabBarControl } from '../../hooks/use-scroll-tab-bar-control';

import { SwapCard } from '../../components/ui/SwapCard';
import { BookGridItem } from '../../components/ui/BookGridItem';

import { 
    collection, 
    getDocs, 
    query, 
    orderBy, 
    doc, 
    getDoc, 
    updateDoc, 
    arrayUnion, 
    arrayRemove, 
    increment 
} from 'firebase/firestore';
import { db } from '@readme/shared/src/services/firebase';

const MOCK_SWAPS = [
    { id: '1', imageUrl: 'https://livraria.zedosbois.org/wp-content/uploads/2025/12/oplanodeimagem_capa.png', status: 'giving' },
    { id: '2', imageUrl: 'https://livraria.zedosbois.org/wp-content/uploads/2026/03/burroughscapa.png', status: 'giving' },
    { id: '3', imageUrl: 'https://livraria.zedosbois.org/wp-content/uploads/2025/12/oplanodeimagem_capa.png', status: 'receiving' },
    { id: '4', imageUrl: 'https://livraria.zedosbois.org/wp-content/uploads/2025/02/pentangulo5capa.png', status: 'receiving' },
];

export default function ExploreScreen({navigation}) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const styles = buildExploreStyles(theme);
    const handleScroll = useScrollTabBarControl();

    const { currentUser, refreshUser } = useAuth(); 

    const [books, setBooks] = useState([]);
    const [userFavorites, setUserFavorites] = useState([]);
    const [isLoadingBooks, setIsLoadingBooks] = useState(true);
    const [focusKey, setFocusKey] = useState(0);

    // Fetch publications
    const fetchPublications = async () => {
        setIsLoadingBooks(true);
        try {
            const q = query(collection(db, 'publications'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);

            const fetchedBooks = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
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
                    publicationData: data
                };
            })
            .filter( book => book.uid !== currentUser?.uid);

            setBooks(fetchedBooks);
        } catch (error) {
            console.error("Erro a carregar publicações:", error);
        } finally {
            setIsLoadingBooks(false);
        }
    };

    // Fetch user favorites once to prevent excessive DB reads
    const fetchUserFavorites = async () => {
        if (!currentUser) return;
        try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                setUserFavorites(userDocSnap.data().favoriteBooks || []);
            }
        } catch (error) {
            console.error("Failed to load user favorites:", error);
        }
    };

    const handleToggleFavorite = async (bookId, currentIsFavorite, currentCount) => {
        if (!currentUser) {
            console.warn("User must be logged in to favorite a book.");
            return;
        }

        // 1. Optimistically update the UI list state immediately
        setBooks(prevBooks => 
            prevBooks.map(book => {
                if (book.id === bookId) {
                    return {
                        ...book,
                        isFavorite: !currentIsFavorite,
                        favoriteCount: !currentIsFavorite ? currentCount + 1 : Math.max(0, currentCount - 1)
                    };
                }
                return book;
            })
        );

        // 2. Do the Firebase update in the background
        try {
            const userDocRef = doc(db, 'users', currentUser.uid); 
            const publicationDocRef = doc(db, 'publications', bookId);

            await Promise.all([
                updateDoc(userDocRef, {
                    favoriteBooks: !currentIsFavorite ? arrayUnion(bookId) : arrayRemove(bookId)
                }),
                // FIX: Use dot notation to safely update a nested object
                updateDoc(publicationDocRef, {
                    "stats.likesCount": increment(!currentIsFavorite ? 1 : -1)
                })
            ]);
        } catch (error) {
            console.error("Failed to like book:", error);
        }
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', async () => {
            setFocusKey(prev => prev + 1);

            if (refreshUser) {
                await refreshUser(); 
            }

            // Fetch both lists parallelly
            fetchUserFavorites();
            fetchPublications();
        });
        return unsubscribe;
    }, [navigation, refreshUser, currentUser]);

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <View style={{ maxWidth: '90%', marginRight: 12 }}>
                <Text style={styles.headerTitle} numberOfLines={2} ellipsizeMode="tail">
                    Hello, {currentUser?.username}
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

    const renderSwapSection = () => (
        <View style={styles.swapSectionContainer}> 
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.swapList}
            >
                {MOCK_SWAPS.map((swap) => (
                    <SwapCard 
                        key={swap.id} 
                        imageUrl={swap.imageUrl} 
                        status={swap.status} 
                        styles={styles} 
                    />
                ))}
            </ScrollView>
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
                                {renderSwapSection()}
                            </>
                        }
                        renderItem={({ item }) => {
                            return (
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
                                        book: item,
                                        seller: item.seller
                                    })}
                                    onToggleFavorite={handleToggleFavorite}
                                />
                            );
                        }}
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
