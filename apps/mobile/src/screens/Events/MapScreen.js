import React, { useState, useEffect } from 'react';
import { useAuth } from '@readme/shared/src/contexts/AuthContext';
import { View, Text, TouchableOpacity, ScrollView, useColorScheme } from 'react-native';
import { Iconify } from 'react-native-iconify';
import { Colors } from '@readme/shared/src/constants/theme';
import { ROUTES } from '@readme/shared/src/constants/routes';
import { buildStyles } from '../../styles/exploreStyles';
import { SwapActivityCard, BookCard } from '../../components/ui/HomeComponents';
import { useScrollTabBarControl } from '../../hooks/use-scroll-tab-bar-control';

// TODO: swap these out for real Firestore reads, e.g.
// services/swap.js   -> getSwapActivity(uid)
// services/discover.js -> getDiscoverFeed()
const MOCK_ACTIVITY = [
    { id: '1', coverUrl: 'https://covers.example.com/1.jpg', status: 'available' },
    { id: '2', coverUrl: 'https://covers.example.com/2.jpg', status: 'available' },
    { id: '3', coverUrl: 'https://covers.example.com/3.jpg', status: 'pending' },
    { id: '4', coverUrl: 'https://covers.example.com/4.jpg', status: 'pending' },
];

const MOCK_DISCOVER = [
    { id: '1', coverUrl: 'https://covers.example.com/a.jpg', title: 'Carta Aberta a Salvador Dali', author: 'Salvador Dali' },
    { id: '2', coverUrl: 'https://covers.example.com/b.jpg', title: 'Carta Aberta a Salvador Dali', author: 'Magritte' },
    { id: '3', coverUrl: 'https://covers.example.com/c.jpg', title: 'Poesia com Armas', author: 'Carlos de Oliveira' },
    { id: '4', coverUrl: 'https://covers.example.com/d.jpg', title: 'Aquarelles', author: 'Auguste Rodin' },
];

export default function MapScreen({ navigation }) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const styles = buildStyles(theme);

    const { currentUser } = useAuth();
    const handleScroll = useScrollTabBarControl();

    const [activity, setActivity] = useState(MOCK_ACTIVITY);
    const [discover, setDiscover] = useState(MOCK_DISCOVER);

    useEffect(() => {
        // getSwapActivity(currentUser.uid).then(setActivity);
        // getDiscoverFeed().then(setDiscover);
    }, []);

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
            >
                {/* --- HEADER --- */}
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.greeting}>
                            Hello, {currentUser?.username || 'there'}
                        </Text>
                        <Text style={styles.subGreeting}>Let's start swapping</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.searchButton}
                        onPress={() => navigation.navigate(ROUTES.SEARCH)}
                    >
                        <Iconify icon="lucide:search" size={24} color={theme.text} />
                    </TouchableOpacity>
                </View>

                {/* --- SWAP ACTIVITY CAROUSEL --- */}
                <View style={styles.activityPanel}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {activity.map((item) => (
                            <SwapActivityCard
                                key={item.id}
                                styles={styles}
                                coverUrl={item.coverUrl}
                                status={item.status}
                                // onPress={() => navigation.navigate(ROUTES.SWAP_DETAILS, { id: item.id })}
                            />
                        ))}
                    </ScrollView>
                </View>

                {/* --- DISCOVER GRID --- */}
                <View style={styles.grid}>
                    {discover.map((book) => (
                        <BookCard
                            key={book.id}
                            styles={styles}
                            coverUrl={book.coverUrl}
                            title={book.title}
                            author={book.author}
                            // onPress={() => navigation.navigate(ROUTES.BOOK_DETAILS, { id: book.id })}
                        />
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}