import React, { useState, useEffect, useCallback } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    FlatList, 
    StyleSheet, 
    ActivityIndicator,
    useColorScheme
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// External Libraries
import { Iconify } from 'react-native-iconify';

// Firebase Imports
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '@readme/shared/src/services/firebase'; 

// Internal Architecture
import { ROUTES } from '@readme/shared/src/constants/routes';
import { Colors } from '@readme/shared/src/constants/theme';
import { BookCard } from '../../../components/ui/BookCard';

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * STRICT DATA CONTRACT
 * No fallbacks. We expect the publications collection to strictly follow this shape.
 */
const normalizeBookData = (doc) => {
    const data = doc.data();
    
    return {
        id: doc.id,
        title: data.book.title,         // Single source of truth
        imageUrl: data.book.images[0],  // Single source of truth
        ownerId: data.uid,              // Explicit owner ID mapping
        rawDocData: data
    };
};

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function StepOneOfferScreen({ route, navigation }) {
    // --- Theme & Navigation Context ---
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    
    const { targetBook, targetSeller } = route.params;

    // --- Local State ---
    const [myBooks, setMyBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooks, setSelectedBooks] = useState([]);

    // ==========================================
    // EFFECTS
    // ==========================================

    // Fetch the user's available books from Firestore on mount
    useEffect(() => {
        const fetchMyBooks = async () => {
            const auth = getAuth();
            if (!auth.currentUser) return;

            try {
                const q = query(
                    collection(db, 'publications'), 
                    where('uid', '==', auth.currentUser.uid) 
                );
                const querySnapshot = await getDocs(q);

                // Data is perfectly mapped at the moment of fetching
                const books = querySnapshot.docs.map(normalizeBookData);
                setMyBooks(books);
            } catch (error) {
                console.error("[StepOneOfferScreen] Error fetching user books:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMyBooks();
    }, []);

    // ==========================================
    // HANDLERS
    // ==========================================

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
        
        // Passing the pristine targetBook and perfectly mapped selectedBooks forward
        navigation.navigate(ROUTES.STEP_TWO_OFFER, { 
            targetBook, 
            targetSeller, 
            offeredBooks: selectedBooks 
        });
    };

    // --- Render Helpers ---

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

    // ==========================================
    // RENDER
    // ==========================================

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            
            {/* --- HEADER --- */}
            <SafeAreaView edges={['top']} style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Iconify icon="lucide:arrow-left" size={24} color={theme.textItemTitle} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.textItemTitle }]}>Select Books to Offer</Text>
                <View style={{ width: 24 }} /> 
            </SafeAreaView>

            {/* --- MAIN CONTENT AREA --- */}
            {loading ? (
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : myBooks.length === 0 ? (
                <View style={styles.centerContent}>
                    <Text style={[styles.emptyText, { color: theme.subtext }]}>
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
            <SafeAreaView edges={['bottom']} style={[styles.bottomBar, { 
                backgroundColor: theme.backgroundElement,
                borderTopColor: theme.borderLight
            }]}>
                <TouchableOpacity 
                    style={[
                        styles.nextButton, 
                        { 
                            backgroundColor: hasSelection ? (theme.primary || '#E58A1F') : theme.borderLight,
                            shadowColor: hasSelection ? (theme.primary || '#E58A1F') : '#000',
                            elevation: hasSelection ? 8 : 0,
                        }
                    ]} 
                    onPress={handleNext}
                    disabled={!hasSelection}
                    activeOpacity={0.85}
                >
                    <Iconify icon="lucide:map" size={22} color={hasSelection ? '#FFFFFF' : theme.subtext} />
                    <Text style={[
                        styles.nextButtonText, 
                        { color: hasSelection ? '#FFFFFF' : theme.subtext }
                    ]}>
                        Choose Location
                    </Text>
                    <Iconify icon="lucide:arrow-right" size={20} color={hasSelection ? '#FFFFFF' : theme.subtext} />
                </TouchableOpacity>
            </SafeAreaView>
        </View>
    );
}

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16, paddingTop: 12 },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    
    // States (Loading / Empty)
    centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    emptyText: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
    
    // List & Grid
    listContainer: { padding: 16, paddingBottom: 120 }, 
    row: { justifyContent: 'space-between', marginBottom: 16 },
    
    // Bottom Floating Dock
    bottomBar: { 
        position: 'absolute', 
        bottom: 0, 
        width: '100%', 
        paddingHorizontal: 20, 
        paddingTop: 16,
        paddingBottom: 16,
        borderTopWidth: 1, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: -4 }, 
        shadowOpacity: 0.05, 
        shadowRadius: 12, 
        elevation: 10 
    },
    nextButton: { 
        width: '100%', 
        borderRadius: 16, 
        paddingVertical: 16, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: 12,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    nextButtonText: { fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
});
