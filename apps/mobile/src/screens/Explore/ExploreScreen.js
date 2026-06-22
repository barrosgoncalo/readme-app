import React from 'react';
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

// Importa os teus componentes extraídos
import { SwapCard } from '../../components/ui/SwapCard';
import { BookGridItem } from '../../components/ui/BookGridItem';

// Dados fictícios baseados na tua imagem
const MOCK_SWAPS = [
    { id: '1', imageUrl: 'https://via.placeholder.com/100x150/800080/FFFFFF?text=Picasso', status: 'giving' },
    { id: '2', imageUrl: 'https://via.placeholder.com/100x150/cccccc/000000?text=Face', status: 'giving' },
    { id: '3', imageUrl: 'https://via.placeholder.com/100x150/ffaa00/FFFFFF?text=Tantrisme', status: 'receiving' },
    { id: '4', imageUrl: 'https://via.placeholder.com/100x150/ffff00/000000?text=Pessoa', status: 'receiving' },
];

const MOCK_BOOKS = [
    { id: '1', title: 'Carta Aberta a Salvador Dali', author: 'Salvador Dali', imageUrl: 'https://via.placeholder.com/200x300/ff9999/000?text=Dali+1' },
    { id: '2', title: 'Carta Aberta a Salvador Dali', author: 'Salvador Dali', imageUrl: 'https://via.placeholder.com/200x300/9999ff/000?text=Magritte' },
    { id: '3', title: 'Carta Aberta a Salvador Dali', author: 'Salvador Dali', imageUrl: 'https://via.placeholder.com/200x300/99ff99/000?text=Andrade' },
    { id: '4', title: 'Carta Aberta a Salvador Dali', author: 'Salvador Dali', imageUrl: 'https://via.placeholder.com/200x300/cc0000/fff?text=Rodin' },
];

export default function ExploreScreen({navigation}) {

    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const styles = buildExploreStyles(theme);
    
    // Header Render
    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <View>
                <Text style={styles.headerTitle}>Hello, Myco</Text>
                <Text style={styles.headerSubtitle}>Let's start swaping</Text>
            </View>
            <TouchableOpacity 
                style={styles.searchButton}
                onPress={() => navigation.navigate(ROUTES.SEARCH)}
            >
                <Iconify icon="lucide:search" size={28} color="#000" />
            </TouchableOpacity>
        </View>
    );

    // Swap Section Render (Scroll Horizontal)
    const renderSwapSection = () => (
        <View style={styles.swapSectionContainer}> 
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.swapList}
                // Apaga a linha do style={{ overflow: 'visible' }} !
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

    const FloatingNavBar = () => (
        <View style={styles.navBarContainer}>
            <TouchableOpacity style={styles.navTabActive}>
                <Iconify icon="lucide:home" size={22} color="#FFF" />
                <Text style={styles.navTextActive}>Explore</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.navTabInactive}>
                <Iconify icon="lucide:user" size={28} color="#888" />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
            
            <FlatList
                data={MOCK_BOOKS}
                keyExtractor={(item) => item.id}
                numColumns={2}
                columnWrapperStyle={styles.row}
                contentContainerStyle={styles.gridContainer}
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
                        styles={styles} // <-- PASSAR OS STYLES AQUI TAMBÉM
                        onPress={() => console.log('Livro clicado:', item.title)}
                    />
                )}
                showsVerticalScrollIndicator={false}
            />

            <FloatingNavBar />
        </View>
    );
};
