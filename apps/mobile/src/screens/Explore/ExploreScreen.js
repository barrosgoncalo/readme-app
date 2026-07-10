import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@readme/shared/src/contexts/AuthContext';
import {
    View,
    Text,
    TouchableOpacity,
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

import { ActiveSwapsSection } from '../../components/ui/ActiveSwapsSection';
import { BookGridItem } from '../../components/ui/BookGridItem';

import { 
    doc, 
    getDoc 
} from 'firebase/firestore';
import { db } from '@readme/shared/src/services/firebase';
import { doGetBlockedUids } from '@readme/shared/src/services/block';
import { ChatService } from '@readme/shared/src/services/chat';
import { PublicationService } from '@readme/shared/src/services/publications';

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

        const unsubscribe = ChatService.subscribeToActiveChats(
            currentUser.uid,
            setActiveChats,
            (error) => console.error("Error loading active chats:", error)
        );

        return () => unsubscribe();
    }, [currentUser?.uid]);

    // --- FETCH PUBLICATIONS & FAVORITES ---
    const fetchPublications = async (showSpinner = true) => {
        try {
            if (showSpinner) setIsLoadingBooks(true); 

            let blockedUids = [];
            if (currentUser?.uid) {
                blockedUids = await doGetBlockedUids(currentUser.uid);
            }

            const fetchedBooks = await PublicationService.fetchExplorePublications(currentUser?.uid, blockedUids);
            setBooks(fetchedBooks);

        } catch (error) {
            console.error("Erro a carregar publicações:", error);
        } finally {
            if (showSpinner) setIsLoadingBooks(false);
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
    useFocusEffect(
        useCallback(() => {
            if (currentUser?.uid) {
                const isInitialLoad = books.length === 0;
                fetchPublications(isInitialLoad);
                fetchUserFavorites();
            }
        }, [currentUser?.uid, books.length])
    );


    // --- ACTIONS ---
    const handleToggleFavorite = async (bookId, currentIsFavorite, currentCount) => {
        if (!currentUser) {
            console.warn("User must be logged in to favorite a book.");
            return;
        }

        // Optimistic UI Update
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

        // Cleaned up!
        try {
            await PublicationService.toggleFavorite(currentUser.uid, bookId, currentIsFavorite);
        } catch (error) {
            console.error("Failed to like book:", error);
            // Optional: Revert optimistic UI update here if it fails
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
