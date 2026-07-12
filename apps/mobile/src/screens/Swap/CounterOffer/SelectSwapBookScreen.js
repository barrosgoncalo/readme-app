import React, { useState } from 'react'; 
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Iconify } from 'react-native-iconify';
import { useTheme } from '@readme/shared/src/hooks/use-theme';
import { ROUTES } from '@readme/shared/src/constants/routes';
import { useSwapBookSelection } from '@readme/shared/src/hooks/use-swap-book-selection';
import { useCounterOffer } from '@readme/shared/src/contexts/CounterOfferContext';
import { buildSelectSwapBookStyles } from '../../../styles/selectSwapBookScreenStyles'; 

export default function SelectSwapBookScreen({ route, navigation }) {
    const { offerDetails } = route.params;
    const theme = useTheme();
    const styles = buildSelectSwapBookStyles(theme);

    const [offeredBooks] = useState(offerDetails?.offeredBooks || []);

    const {
        selectedBookId,
        setSelectedBookId,
        fetchingBookId,
        handleBookPress,
    } = useSwapBookSelection(offeredBooks, route.params, navigation, ROUTES);

    const { initCounterOffer } = useCounterOffer();

    const onChooseLocationPress = () => {
        const sellerId = route.params?.targetSellerUid 
            || route.params?.targetSeller?.uid 
            || route.params?.targetSeller?.id 
            || route.params?.otherUserId;

        // Save everything cleanly into Global Context
        initCounterOffer({
            chatId: route.params?.chatId || null,
            messageId: route.params?.messageId || null,
            targetSellerUid: sellerId || null,
            offerDetails: offerDetails || null,
            selectedBookId: selectedBookId || null,
        });

        navigation.navigate(ROUTES.SELECT_SWAP_LOCATION);
    };

    const renderBookItem = ({ item }) => {
        const isSelected = selectedBookId === item.id;
        const imageUrl = item.image || 'https://via.placeholder.com/150';
        const isThisItemLoading = fetchingBookId === item.id;

        return (
            <TouchableOpacity 
                style={[styles.bookCard, isSelected && styles.bookCardSelected]}
                onPress={() => setSelectedBookId(item.id)}
                activeOpacity={0.7}
            >
                <Image source={{ uri: imageUrl }} style={styles.bookImage} />
                <View style={styles.bookInfo}>
                    <Text style={styles.bookTitle} numberOfLines={1}>
                        {item.title || 'Unknown Title'}
                    </Text>

                    <TouchableOpacity 
                        style={styles.detailsButton}
                        disabled={fetchingBookId !== null} 
                        onPress={() => handleBookPress(item.id)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Iconify icon="lucide:info" size={16} color={theme.subtext} />
                        <Text style={styles.detailsButtonText}>
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
        <View style={styles.container}>
            <SafeAreaView edges={['top']} style={styles.safeAreaTop}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Iconify icon="lucide:arrow-left" size={24} color={theme.textItemTitle} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Step 1: Select Book</Text>
                    <View style={styles.headerSpacer} />
                </View>

                <View style={styles.guidanceContainer}>
                    <Text style={styles.guidanceText}>
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
                        <Text style={styles.emptyText}>No books were offered.</Text>
                    </View>
                }
            />

            <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
                <TouchableOpacity 
                    style={[styles.nextButton, selectedBookId && styles.nextButtonActive]} 
                    onPress={onChooseLocationPress}
                    disabled={!selectedBookId}
                    activeOpacity={0.85}
                >
                    <Iconify icon="lucide:map" size={22} color={selectedBookId ? '#FFFFFF' : theme.subtext} />
                    <Text style={[styles.nextButtonText, selectedBookId && styles.nextButtonTextActive]}>
                        Choose Location
                    </Text>
                    <Iconify icon="lucide:arrow-right" size={20} color={selectedBookId ? '#FFFFFF' : theme.subtext} />
                </TouchableOpacity>
            </SafeAreaView>
        </View>
    );
}
