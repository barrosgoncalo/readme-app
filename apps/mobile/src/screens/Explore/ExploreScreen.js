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
import { PUBLICATION_STATUS } from '@readme/shared/src/constants/status';

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
    increment,
    where,
    onSnapshot 
} from 'firebase/firestore';
import { db } from '@readme/shared/src/services/firebase';
import { doGetBlockedUids } from '@readme/shared/src/services/block';

export default function ExploreScreen({ navigation }) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const styles = buildExploreStyles(theme);
    const handleScroll = useScrollTabBarControl();

    const { currentUser } = useAuth(); 

    const [books, setBooks] = useState([]);
    const [userFavorites, setUserFavorites] = useState([]);
    const [activeChats, setActiveChats] = useState([]); 
    const [isLoadingBooks, setIsLoadingBooks] = useState(true);

    // --- REAL-TIME ACTIVE CHATS DATABASE FEED ---
    useEffect(() => {
        if (!currentUser?.uid) {
            setActiveChats([]);
            return;
        }

        const chatsRef = collection(db, 'chats');
        const q = query(
            chatsRef,
            where('participants', 'array-contains', currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedChats = querySnapshot.docs.map(doc => {
                const data = doc.data();

                const isOutgoing = data.proposerId === currentUser.uid;

                const otherParticipantUid = data.participants?.find(uid => uid !== currentUser.uid);

                return {
                    id: doc.id,
                    imageUrl: data.targetBookImage || 'https://via.placeholder.com/150',
                    status: isOutgoing ? 'giving' : 'receiving', 
                    targetSeller: {
                        uid: otherParticipantUid,
                        name: data.receiverName || 'Swapper',
                        avatarUrl: data.receiverAvatar || null
                    },
                    updatedAt: data.updatedAt || data.createdAt
                };
            });

            fetchedChats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            setActiveChats(fetchedChats);
        });

        return () => unsubscribe();
    }, [currentUser?.uid]);


    // --- FETCH PUBLICATIONS & FAVORITES ---
    const fetchPublications = async () => {
        try {
            setIsLoadingBooks(true);
            let blockedUids = [];
            if (currentUser?.uid) {
                blockedUids = await doGetBlockedUids(currentUser.uid);
            }

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
            .filter(book =>
                book.uid !== currentUser?.uid &&
                !blockedUids.includes(book.uid) &&
                (!book.publicationData?.status || book.publicationData?.status === PUBLICATION_STATUS.AVAILABLE)
            );
            setBooks(fetchedBooks);
        } catch (error) {
            console.error("Erro a carregar publicações:", error);
        } finally {
            setIsLoadingBooks(false);
        }
    };

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

    // Trigger the data fetches when the user logs in/changes
    useEffect(() => {
        fetchPublications();
        fetchUserFavorites();
    }, [currentUser?.uid]);


    // --- ACTIONS ---
    const handleToggleFavorite = async (bookId, currentIsFavorite, currentCount) => {
        if (!currentUser) {
            console.warn("User must be logged in to favorite a book.");
            return;
        }

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

        try {
            const userDocRef = doc(db, 'users', currentUser.uid); 
            const publicationDocRef = doc(db, 'publications', bookId);

            await Promise.all([
                updateDoc(userDocRef, {
                    favoriteBooks: !currentIsFavorite ? arrayUnion(bookId) : arrayRemove(bookId)
                }),
                updateDoc(publicationDocRef, {
                    "stats.likesCount": increment(!currentIsFavorite ? 1 : -1)
                })
            ]);
        } catch (error) {
            console.error("Failed to like book:", error);
        }
    };

    // --- RENDER METHODS ---
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

    const renderSwapSection = () => {
        if (activeChats.length === 0) return null; 

        return (
            <View style={styles.swapSectionContainer}> 
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.swapList}
                >
                    {activeChats.map((chat) => (
                        <TouchableOpacity 
                            key={chat.id}
                            activeOpacity={0.8}
                            onPress={() => navigation.navigate(ROUTES.CHAT_ROOM, {
                                chatId: chat.id,
                                targetSeller: chat.targetSeller
                            })}
                            style={{
                                // iOS Layer Shadows
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: colorScheme === 'dark' ? 0.32 : 0.12,
                                shadowRadius: 4.5,
                                // Android Layer Shadow
                                elevation: 5,
                                backgroundColor: 'transparent',
                            }}
                        >
                            <SwapCard 
                                imageUrl={chat.imageUrl} 
                                status={chat.status} 
                                styles={styles} 
                            />
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        );
    };

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
