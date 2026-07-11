import React, { useState, useCallback } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    FlatList, 
    ActivityIndicator,
    useColorScheme
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// External Libraries
import { Iconify } from 'react-native-iconify';

// Internal Architecture
import { ROUTES } from '@readme/shared/src/constants/routes';
import { Colors } from '@readme/shared/src/constants/theme';
import { buildOfferFlowStyles } from '../../styles/offerFlowStyles';
import { BookCard } from '../../components/ui/BookCard';
import { useMyBooks } from '@readme/shared/src/hooks/use-my-books';

import { useOffer } from '@readme/shared/src/contexts/OfferContext';

export default function StepOneOfferScreen({ navigation }) {

    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const styles = buildOfferFlowStyles(theme);

    const { updateOfferedBooks } = useOffer();

    const { myBooks, loading } = useMyBooks();
    const [selectedBooks, setSelectedBooks] = useState([]);

    const handleBookPress = useCallback((book) => {
        setSelectedBooks((prevSelected) => {
            const isAlreadySelected = prevSelected.some((item) => item.id === book.id);
            if (isAlreadySelected) {
                return prevSelected.filter((item) => item.id !== book.id);
            } else {
                return [...prevSelected, book];
            }
        });
    }, []);

    const handleNext = () => {
        if (selectedBooks.length === 0) return;
        
        updateOfferedBooks(selectedBooks);
        
        navigation.navigate(ROUTES.STEP_TWO_OFFER);
    };

    const renderBookItem = ({ item }) => {
        const isSelected = selectedBooks.some((book) => book.id === item.id);
        return (
            <BookCard 
                item={item} 
                isSelected={isSelected} 
                onPress={handleBookPress} 
                theme={theme} 
            />
        );
    };

    const hasSelection = selectedBooks.length > 0;

    return (
        <View style={styles.container}>
            
            {/* --- HEADER --- */}
            <SafeAreaView edges={['top']} style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Iconify icon="lucide:arrow-left" size={24} color={theme.textItemTitle} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Select Books to Offer</Text>
                <View style={{ width: 24 }} /> 
            </SafeAreaView>

            {/* --- MAIN CONTENT AREA --- */}
            {loading ? (
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : myBooks.length === 0 ? (
                <View style={styles.centerContent}>
                    <Text style={styles.emptyText}>
                        You don't have any books in your collection to offer yet.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={myBooks}
                    keyExtractor={(item) => item.id}
                    renderItem={renderBookItem}
                    contentContainerStyle={styles.listContainer}
                    numColumns={2}
                    columnWrapperStyle={styles.row}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* --- FLOATING BOTTOM ACTION BAR --- */}
            <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
                <TouchableOpacity 
                    style={[
                        styles.nextButtonBase, 
                        hasSelection ? styles.nextButtonActive : styles.nextButtonDisabled
                    ]} 
                    onPress={handleNext}
                    disabled={!hasSelection}
                    activeOpacity={0.85}
                >
                    <Iconify icon="lucide:map" size={22} color={hasSelection ? '#FFFFFF' : theme.subtext} />
                    <Text style={[styles.nextButtonText, { color: hasSelection ? '#FFFFFF' : theme.subtext }]}>
                        Choose Location
                    </Text>
                    <Iconify icon="lucide:arrow-right" size={20} color={hasSelection ? '#FFFFFF' : theme.subtext} />
                </TouchableOpacity>
            </SafeAreaView>
        </View>
    );
}
