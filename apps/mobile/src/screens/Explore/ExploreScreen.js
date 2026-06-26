import React, { useEffect, useState } from 'react';
import { useAuth } from '@readme/shared/src/contexts/AuthContext';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    FlatList,
    StatusBar,
    useColorScheme
} from 'react-native';
import { ROUTES } from '@readme/shared/src/constants/routes';
import { Colors } from '@readme/shared/src/constants/theme';
import { Iconify } from 'react-native-iconify';
import { buildExploreStyles } from '../../styles/exploreStyles';
import { useScrollTabBarControl } from '../../hooks/use-scroll-tab-bar-control';

import { SwapCard } from '../../components/ui/SwapCard';
import { BookGridItem } from '../../components/ui/BookGridItem';

const MOCK_SWAPS = [
    { id: '1', imageUrl: 'https://livraria.zedosbois.org/wp-content/uploads/2025/12/oplanodeimagem_capa.png', status: 'giving' },
    { id: '2', imageUrl: 'https://livraria.zedosbois.org/wp-content/uploads/2026/03/burroughscapa.png', status: 'giving' },
    { id: '3', imageUrl: 'https://livraria.zedosbois.org/wp-content/uploads/2025/12/oplanodeimagem_capa.png', status: 'receiving' },
    { id: '4', imageUrl: 'https://livraria.zedosbois.org/wp-content/uploads/2025/02/pentangulo5capa.png', status: 'receiving' },
];

const MOCK_BOOKS = [
    { id: '1', title: 'Carta Aberta a Salvador Dali', author: 'Salvador Dali', imageUrl: 'https://livraria.zedosbois.org/wp-content/uploads/2020/05/IMG_4746.jpg' },
    { id: '2', title: 'ORIGENS DO NACIONALISMO AFRICANO', author: 'Mário Pinto de Andrade', imageUrl: 'https://livraria.zedosbois.org/wp-content/uploads/2025/11/origensnacionalismoafricanocapa.png' },
    { id: '3', title: 'FERNANDO PESSOA: UNE PHOTOBIOGRAPHIE', author: 'Maria José de Lancastre', imageUrl: 'https://livraria.zedosbois.org/wp-content/uploads/2025/03/fernandopessoaunephotobiographe_capa.png' },
    { id: '4', title: 'EL SURREALISMO', author: 'A. Cirici-Pellicer', imageUrl: 'https://livraria.zedosbois.org/wp-content/uploads/2025/03/surrealismocapa.png' },
];

export default function ExploreScreen({navigation}) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const styles = buildExploreStyles(theme);
    const handleScroll = useScrollTabBarControl();

    const { currentUser, refreshUser } = useAuth(); 
    const [uploading, setUploading] = useState(false);
    const [focusKey, setFocusKey] = useState(0);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            setFocusKey(prev => prev + 1);
            if (refreshUser) {
                refreshUser();
            }
        });
        return unsubscribe;
    }, [navigation, refreshUser]);

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <View style={{ maxWidth: '90%', marginRight: 12 }}>
                <Text style={styles.headerTitle} numberOfLines={2} ellipsizeMode="tail">
                    Hello, {currentUser?.username}
                </Text>
                <Text style={styles.headerSubtitle}>Let's start swaping</Text>
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
            {/* StatusBar dinâmica com base no tema */}
            <StatusBar 
                barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} 
                backgroundColor={theme.background} 
            />

            <FlatList
            data={MOCK_BOOKS}
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
                        onPress={() => console.log('Livro clicado:', item.title)}
                    />
                )}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}
