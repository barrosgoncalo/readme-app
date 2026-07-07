import React, { useState, useEffect } from 'react';
import { 
    View, Text, StyleSheet, FlatList, TouchableOpacity, 
    ActivityIndicator, useColorScheme, Image 
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Iconify } from 'react-native-iconify';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@readme/shared/src/services/firebase';
import { Colors } from '@readme/shared/src/constants/theme';
import { ROUTES } from '@readme/shared/src/constants/routes';

export default function SelectSwapBookScreen({ route, navigation }) {
    const { messageId, chatId, offerDetails, targetSellerUid } = route.params;
    
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();

    const [offeredBooks, setOfferedBooks] = useState([]);
    const [selectedBookId, setSelectedBookId] = useState(null);
    const [isLoadingBooks, setIsLoadingBooks] = useState(true);

    useEffect(() => {
        const fetchOfferedBooks = async () => {
            if (!offerDetails?.offeredBookIds?.length) {
                setIsLoadingBooks(false);
                return;
            }
            try {
                const bookPromises = offerDetails.offeredBookIds.map(id => getDoc(doc(db, 'publications', id)));
                const bookSnaps = await Promise.all(bookPromises);
                const loadedBooks = bookSnaps
                    .filter(snap => snap.exists())
                    .map(snap => ({ id: snap.id, ...snap.data() }));
                
                setOfferedBooks(loadedBooks);
                
                // Pre-select the first book automatically so the screen is ready to go
                if (loadedBooks.length > 0) {
                    setSelectedBookId(loadedBooks[0].id);
                }
            } catch (error) {
                console.error("Failed to fetch offered books:", error);
            } finally {
                setIsLoadingBooks(false);
            }
        };
        fetchOfferedBooks();
    }, []);

    const handleNext = () => {
        if (!selectedBookId) return;
        
        const selectedBook = offeredBooks.find(b => b.id === selectedBookId);
        const imageUrl = selectedBook?.book?.images?.[0] || selectedBook?.imageUrl || null;

        navigation.navigate(ROUTES.SELECT_SWAP_LOCATION, {
            ...route.params,
            selectedBookId,
            selectedBookImage: imageUrl
        });
    };

    const renderBookItem = ({ item }) => {
        const isSelected = selectedBookId === item.id;
        const imageUrl = item.book?.images?.[0] || item.imageUrl || 'https://via.placeholder.com/150';

        return (
            <TouchableOpacity 
                style={[
                    styles.bookCard, 
                    { backgroundColor: theme.backgroundElement, borderColor: isSelected ? theme.primary : theme.borderLight }
                ]}
                onPress={() => setSelectedBookId(item.id)}
            >
                <Image source={{ uri: imageUrl }} style={styles.bookImage} />
                <View style={styles.bookInfo}>
                    <Text style={[styles.bookTitle, { color: theme.textItemTitle }]} numberOfLines={1}>
                        {item.book?.title || 'Unknown Title'}
                    </Text>
                    <Text style={[styles.bookAuthor, { color: theme.subtext }]} numberOfLines={1}>
                        {item.book?.author || 'Unknown Author'}
                    </Text>
                </View>
                {isSelected && (
                    <View style={styles.checkBadge}>
                        <Iconify icon="lucide:check-circle-2" size={24} color={theme.primary} />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <SafeAreaView edges={['top']} style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.borderLight }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Iconify icon="lucide:arrow-left" size={24} color={theme.textItemTitle} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.textItemTitle }]}>Step 1: Select Book</Text>
                <View style={{ width: 32 }} />
            </SafeAreaView>

            {isLoadingBooks ? (
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <FlatList
                    data={offeredBooks}
                    keyExtractor={item => item.id}
                    renderItem={renderBookItem}
                    contentContainerStyle={styles.bookListContainer}
                    showsVerticalScrollIndicator={false}
                />
            )}

            <View style={[
                styles.footer, 
                { 
                    borderTopColor: theme.borderLight, 
                    backgroundColor: theme.backgroundElement,
                    paddingBottom: Math.max(insets.bottom, 16) 
                }
            ]}>
                <TouchableOpacity 
                    style={[styles.nextButton, { backgroundColor: selectedBookId ? theme.primary : theme.borderLight }]}
                    disabled={!selectedBookId}
                    onPress={handleNext}
                >
                    <Text style={styles.nextButtonText}>Next: Choose Location</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, zIndex: 10 },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    backButton: { padding: 4 },
    centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    bookListContainer: { padding: 16, gap: 16 },
    bookCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 2, marginBottom: 12 },
    bookImage: { width: 60, height: 90, borderRadius: 6, backgroundColor: '#EAEAEA' },
    bookInfo: { flex: 1, marginLeft: 16, justifyContent: 'center' },
    bookTitle: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
    bookAuthor: { fontSize: 14 },
    checkBadge: { position: 'absolute', top: 12, right: 12 },
    footer: { paddingHorizontal: 16, paddingTop: 16, borderTopWidth: 1 },
    nextButton: { paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    nextButtonText: { color: 'white', fontSize: 16, fontWeight: '700' }
});
