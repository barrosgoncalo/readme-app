import React, { useState } from 'react'; 
import { 
    View, Text, StyleSheet, FlatList, TouchableOpacity, Image 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Iconify } from 'react-native-iconify';
import { useTheme } from '@readme/shared/src/hooks/use-theme';
import { ROUTES } from '@readme/shared/src/constants/routes';
import { useSwapBookSelection } from '@readme/shared/src/hooks/use-swap-book-selection';

export default function SelectSwapBookScreen({ route, navigation }) {
    const { offerDetails } = route.params;
    
    const theme = useTheme();

    const [offeredBooks] = useState(offerDetails?.offeredBooks || []);

    const {
        selectedBookId,
        setSelectedBookId,
        fetchingBookId,
        handleBookPress,
        handleNext,
    } = useSwapBookSelection(offeredBooks, route.params, navigation, ROUTES);

    const renderBookItem = ({ item }) => {
        const isSelected = selectedBookId === item.id;
        const imageUrl = item.image || 'https://via.placeholder.com/150';

        const isThisItemLoading = fetchingBookId === item.id;

        return (
            <TouchableOpacity 
                style={[
                    styles.bookCard, 
                    { backgroundColor: theme.backgroundElement, borderColor: isSelected ? theme.primary : theme.borderLight }
                ]}
                onPress={() => setSelectedBookId(item.id)}
                activeOpacity={0.7}
            >
                <Image source={{ uri: imageUrl }} style={styles.bookImage} />
                <View style={styles.bookInfo}>
                    <Text style={[styles.bookTitle, { color: theme.textItemTitle }]} numberOfLines={1}>
                        {item.title || 'Unknown Title'}
                    </Text>

                    <TouchableOpacity 
                        style={styles.detailsButton}
                        disabled={fetchingBookId !== null} 
                        onPress={() => handleBookPress(item.id)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Iconify icon="lucide:info" size={16} color={theme.subtext} />
                        <Text style={[styles.detailsButtonText, { color: theme.subtext }]}>
                            {/* Scope the loading text strictly to this single card */}
                            {isThisItemLoading ? "Loading..." : "View Details"}
                        </Text>
                    </TouchableOpacity>
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
            <SafeAreaView edges={['top']} style={{ backgroundColor: theme.background }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Iconify icon="lucide:arrow-left" size={24} color={theme.textItemTitle} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.textItemTitle }]}>Step 1: Select Book</Text>
                    <View style={{ width: 32 }} />
                </View>

                <View style={[styles.guidanceContainer, { borderBottomColor: theme.borderLight }]}>
                    <Text style={[styles.guidanceText, { color: theme.subtext }]}>
                        Choose the book you'd like to receive for this exchange.
                    </Text>
                </View>
            </SafeAreaView>

            <FlatList
                data={offeredBooks}
                keyExtractor={item => item.id}
                renderItem={renderBookItem}
                contentContainerStyle={styles.bookListContainer}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.centerContent}>
                        <Text style={{ color: theme.subtext }}>No books were offered.</Text>
                    </View>
                }
            />

            <SafeAreaView edges={['bottom']} style={[styles.bottomBar, { 
                backgroundColor: theme.backgroundElement,
                borderTopColor: theme.borderLight
            }]}>
                <TouchableOpacity 
                    style={[
                        styles.nextButton, 
                        { 
                            backgroundColor: selectedBookId ? (theme.primary || '#E58A1F') : theme.borderLight,
                            shadowColor: selectedBookId ? (theme.primary || '#E58A1F') : '#000',
                            elevation: selectedBookId ? 8 : 0,
                        }
                    ]} 
                    onPress={handleNext}
                    disabled={!selectedBookId}
                    activeOpacity={0.85}
                >
                    <Iconify icon="lucide:map" size={22} color={selectedBookId ? '#FFFFFF' : theme.subtext} />
                    <Text style={[
                        styles.nextButtonText, 
                        { color: selectedBookId ? '#FFFFFF' : theme.subtext }
                    ]}>
                        Choose Location
                    </Text>
                    <Iconify icon="lucide:arrow-right" size={20} color={selectedBookId ? '#FFFFFF' : theme.subtext} />
                </TouchableOpacity>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, zIndex: 10 },
    headerTitle: { fontSize: 20, fontWeight: '700' },
    backButton: { padding: 4 },
    guidanceContainer: { paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 1 },
    guidanceText: { fontSize: 15, lineHeight: 22 },
    centerContent: { padding: 40, alignItems: 'center' },
    bookListContainer: { padding: 20, paddingBottom: 120 },
    bookCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 2, marginBottom: 16 },
    bookImage: { width: 80, height: 120, borderRadius: 8, backgroundColor: '#EAEAEA' },
    bookInfo: { flex: 1, marginLeft: 20, justifyContent: 'center' },
    bookTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
    // 4. Added missing layout styles for the details action link
    detailsButton: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 },
    detailsButtonText: { fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
    checkBadge: { position: 'absolute', top: 16, right: 16 },
    bottomBar: { 
        position: 'absolute', bottom: 0, width: '100%', paddingHorizontal: 20, 
        paddingTop: 16, paddingBottom: 16, borderTopWidth: 1, 
        shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 10 
    },
    nextButton: { 
        width: '100%', borderRadius: 16, paddingVertical: 16, flexDirection: 'row', 
        alignItems: 'center', justifyContent: 'center', gap: 12, 
        shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 
    },
    nextButtonText: { fontSize: 16, fontWeight: '700', letterSpacing: 0.5 }
});
