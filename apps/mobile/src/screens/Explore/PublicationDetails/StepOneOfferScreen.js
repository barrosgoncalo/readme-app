import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    FlatList, 
    StyleSheet, 
    ActivityIndicator,
} from 'react-native';
import { ROUTES } from '@readme/shared/src/constants/routes';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Iconify } from 'react-native-iconify';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '@readme/shared/src/services/firebase'; 
import { Colors } from '@readme/shared/src/constants/theme';
import { useColorScheme } from 'react-native';

export default function StepOneOfferScreen({ route, navigation }) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const { targetBook, targetSeller } = route.params;

    const [myBooks, setMyBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooks, setSelectedBooks] = useState([]);

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

                const books = [];
                querySnapshot.forEach((doc) => {
                    books.push({ id: doc.id, ...doc.data() });
                });
                setMyBooks(books);
            } catch (error) {
                console.error("Error fetching user books:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMyBooks();
    }, []);

    const handleBookPress = (book) => {
        setSelectedBooks((prevSelected) => {
            const isAlreadySelected = prevSelected.some((item) => item.id === book.id);
            if (isAlreadySelected) {
                return prevSelected.filter((item) => item.id !== book.id);
            } else {
                return [...prevSelected, book];
            }
        });
    };

    const handleNext = () => {
        if (selectedBooks.length === 0) return;
        navigation.navigate(ROUTES.STEP_TWO_OFFER, { 
            targetBook, 
            targetSeller, 
            offeredBooks: selectedBooks 
        });
    };

    const renderBookItem = ({ item }) => {
        const isSelected = selectedBooks.some((book) => book.id === item.id);
        const imageUrl = item.book?.images?.[0] || 'https://via.placeholder.com/150';
        const title = item.book?.title || item.title || 'Unknown Title';

        return (
            <TouchableOpacity 
                style={[
                    styles.bookCard, 
                    { 
                        backgroundColor: theme.backgroundElement,
                        borderColor: isSelected ? theme.primary : theme.borderLight,
                        borderWidth: isSelected ? 2 : 1
                    }
                ]}
                onPress={() => handleBookPress(item)}
                activeOpacity={0.7}
            >
                <Image source={{ uri: imageUrl }} style={styles.bookImage} contentFit="cover" />
                <View style={styles.bookInfo}>
                    <Text style={[styles.bookTitle, { color: theme.textItemTitle }]} numberOfLines={2}>{title}</Text>
                </View>
                {isSelected && (
                    <View style={[styles.checkBadge, { backgroundColor: theme.primary }]}>
                        <Iconify icon="lucide:check" size={14} color="#FFFFFF" />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const hasSelection = selectedBooks.length > 0;

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <SafeAreaView edges={['top']} style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Iconify icon="lucide:arrow-left" size={24} color={theme.textItemTitle} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.textItemTitle }]}>Select Books to Offer</Text>
                <View style={{ width: 24 }} /> 
            </SafeAreaView>

            {loading ? (
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : myBooks.length === 0 ? (
                <View style={styles.centerContent}>
                    <Text style={[styles.emptyText, { color: theme.subtext }]}>You don't have any books in your collection to offer yet.</Text>
                </View>
            ) : (
                <FlatList
                    data={myBooks}
                    keyExtractor={(item) => item.id}
                    renderItem={renderBookItem}
                    contentContainerStyle={styles.listContainer}
                    numColumns={2}
                    columnWrapperStyle={styles.row}
                />
            )}

            {/* Premium Floating Bottom Bar aligned with details screen */}
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

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16, paddingTop: 12 },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    emptyText: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
    listContainer: { padding: 16, paddingBottom: 120 }, // Extra padding so cards aren't hidden behind the floating bar
    row: { justifyContent: 'space-between', marginBottom: 16 },
    bookCard: { width: '48%', borderRadius: 12, overflow: 'hidden', padding: 8, position: 'relative' },
    bookImage: { width: '100%', aspectRatio: 0.7, borderRadius: 8, backgroundColor: '#EAEAEA' },
    bookInfo: { marginTop: 8 },
    bookTitle: { fontSize: 14, fontWeight: '600' },
    checkBadge: { position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
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
        borderRadius: 16, // Consistent rounded rectangle
        paddingVertical: 16, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: 12,
        // Active button shadow
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    nextButtonText: { fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
});
