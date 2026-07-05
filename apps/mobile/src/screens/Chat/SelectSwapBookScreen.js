import React, { useState, useEffect } from 'react';
import { 
    View, Text, StyleSheet, FlatList, TouchableOpacity, 
    ActivityIndicator, useColorScheme, Image 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Iconify } from 'react-native-iconify';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@readme/shared/src/services/firebase';
import { useAuth } from '@readme/shared/src/contexts/AuthContext';
import { ChatService } from '@readme/shared/src/services/chat';
import { Colors } from '@readme/shared/src/constants/theme';

export default function SelectSwapBookScreen({ route, navigation }) {
    const { messageId, chatId, offerDetails } = route.params;
    const { currentUser } = useAuth();
    
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [offeredBooks, setOfferedBooks] = useState([]);
    const [selectedBookId, setSelectedBookId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch the specific books that were offered
    useEffect(() => {
        const fetchOfferedBooks = async () => {
            if (!offerDetails?.offeredBookIds?.length) {
                setIsLoading(false);
                return;
            }

            try {
                const bookPromises = offerDetails.offeredBookIds.map(id => getDoc(doc(db, 'publications', id)));
                const bookSnaps = await Promise.all(bookPromises);
                
                const loadedBooks = bookSnaps
                    .filter(snap => snap.exists())
                    .map(snap => ({ id: snap.id, ...snap.data() }));

                setOfferedBooks(loadedBooks);
            } catch (error) {
                console.error("Failed to fetch offered books:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOfferedBooks();
    }, []);

    const handleSendCounter = async () => {
        if (!selectedBookId || !currentUser?.uid) return;
        
        setIsSubmitting(true);
        try {
            await ChatService.sendCounterOffer(
                chatId, 
                messageId, 
                currentUser.uid, 
                offerDetails, 
                selectedBookId
            );
            navigation.goBack(); // Go back to the chat room!
        } catch (error) {
            console.error("Failed to send counter:", error);
            setIsSubmitting(false);
        }
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
                    <Iconify icon="lucide:check-circle-2" size={24} color={theme.primary} />
                )}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { borderBottomColor: theme.borderLight }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Iconify icon="lucide:arrow-left" size={24} color={theme.textItemTitle} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.textItemTitle }]}>Choose a Book</Text>
                <View style={{ width: 32 }} />
            </View>

            {isLoading ? (
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <>
                    <Text style={[styles.instructionText, { color: theme.subtext }]}>
                        Select the book you want to receive in exchange for your target book.
                    </Text>
                    <FlatList
                        data={offeredBooks}
                        keyExtractor={item => item.id}
                        renderItem={renderBookItem}
                        contentContainerStyle={styles.listContainer}
                    />
                    
                    <View style={[styles.footer, { borderTopColor: theme.borderLight, backgroundColor: theme.background }]}>
                        <TouchableOpacity 
                            style={[
                                styles.submitButton, 
                                { backgroundColor: selectedBookId ? theme.primary : theme.borderLight }
                            ]}
                            disabled={!selectedBookId || isSubmitting}
                            onPress={handleSendCounter}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitButtonText}>Send Counter Proposal</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    backButton: { padding: 4 },
    centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    instructionText: { padding: 16, fontSize: 15, textAlign: 'center' },
    listContainer: { padding: 16, gap: 12 },
    bookCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 2 },
    bookImage: { width: 50, height: 70, borderRadius: 6, backgroundColor: '#EAEAEA' },
    bookInfo: { flex: 1, marginLeft: 12 },
    bookTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
    bookAuthor: { fontSize: 14 },
    footer: { padding: 16, borderTopWidth: 1 },
    submitButton: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' }
});
