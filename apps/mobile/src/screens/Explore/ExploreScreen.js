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

// Firebase Imports
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
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
    const [isLoadingBooks, setIsLoadingBooks] = useState(true);
    const [focusKey, setFocusKey] = useState(0);

    const auth = useAuth();

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

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', async () => {
            setFocusKey(prev => prev + 1);

            if (refreshUser) {
                await refreshUser(); 
            }

            fetchPublications();
        });
        return unsubscribe;
    }, [navigation, refreshUser]);

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
                        renderItem={({ item }) => (
                            <BookGridItem 
                                title={item.title}
                                author={item.author}
                                imageUrl={item.imageUrl}
                                styles={styles} 
                                onPress={() => navigation.navigate(ROUTES.PUBLICATION_DETAILS, { 
                                    book: item,
                                seller: item.seller
                                })}
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
