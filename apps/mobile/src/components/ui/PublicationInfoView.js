import React, { useState } from 'react'; 
import { 
    View, 
    Text, 
    ScrollView, 
    StatusBar, 
    Dimensions, 
    useColorScheme,
    TouchableWithoutFeedback
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { Image } from 'expo-image';
import ImageViewing from 'react-native-image-viewing';

// Adjust path depending on where you place this file
import { Colors } from '@readme/shared/src/constants/theme';
import { buildBookDetailsStyles } from '../../styles/publicationDetailsStyles';
import { GalleryImageWrapper } from './GalleryImageWrapper'; 

const { width } = Dimensions.get('window');

export function PublicationInfoView({ 
    book, 
    topRightActions, 
    sellerCard, 
    bottomBar 
}) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const styles = buildBookDetailsStyles(theme);

    const [isGalleryVisible, setIsGalleryVisible] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const handleScroll = (event) => {
        const scrollPosition = event.nativeEvent.contentOffset.x;
        const index = Math.round(scrollPosition / width);
        setCurrentImageIndex(index);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={[
                    styles.scrollContent,
                    bottomBar && { paddingBottom: 40 }
                ]}
            >                
                {/* --- HEADER IMAGE CAROUSEL --- */}
                <View style={styles.imageContainer}>
                    <ScrollView 
                        horizontal 
                        pagingEnabled 
                        showsHorizontalScrollIndicator={false}
                        onScroll={handleScroll} 
                        scrollEventThrottle={16}
                    >
                        {book.images.map((imgUrl, index) => (
                            <View key={index} style={styles.singleImageWrapper}>
                                <TouchableWithoutFeedback onPress={() => setIsGalleryVisible(true)}>
                                    <View style={{ width: '100%', height: '100%' }}>
                                        <Image 
                                            source={{ uri: imgUrl }} 
                                            style={styles.bookImage} 
                                            contentFit="cover" 
                                            transition={300} 
                                        />
                                    </View>
                                </TouchableWithoutFeedback>
                            </View>
                        ))}
                    </ScrollView>

                    {/* Pagination Dots */}
                    {book.images.length > 1 && (
                        <View style={styles.paginationContainer}>
                            {book.images.map((_, index) => (
                                <View key={index} style={[styles.dot, currentImageIndex === index && styles.activeDot]} />
                            ))}
                        </View>
                    )}

                    {/* Floating Top Actions (Injected via props) */}
                    <SafeAreaView edges={['top']} style={styles.topButtonsContainer}>
                        {topRightActions}
                    </SafeAreaView>
                </View>

                {/* --- BOOK DETAILS & METADATA --- */}
                <View style={styles.detailsContainer}>
                    <Text style={styles.title}>{book.title}</Text>
                    <Text style={styles.author}>{book.author}</Text>

                    <View style={styles.infoBoxesContainer}>
                        <View style={[styles.infoBox, { marginRight: 8 }]}>
                            <Text style={styles.infoBoxLabel}>Subject</Text>
                            <Text style={styles.infoBoxValue}>{book.subject}</Text>
                        </View>
                        <View style={[styles.infoBox, { marginLeft: 8 }]}>
                            <Text style={styles.infoBoxLabel}>Condition</Text>
                            <Text style={styles.infoBoxValue}>{book.condition}</Text>
                        </View>
                    </View>

                    <Text style={[styles.description, !sellerCard && { marginBottom: 30 }]}>
                        {book.description}
                    </Text>

                    {/* --- SELLER CARD (Injected via props) --- */}
                    {sellerCard}
                </View>
            </ScrollView>

            {/* --- BOTTOM ACTION BAR (Injected via props) --- */}
            {bottomBar}

            {/* --- FULLSCREEN IMAGE VIEWER MODAL --- */}
            <ImageViewing
                images={book.formattedGalleryImages}
                imageIndex={currentImageIndex}
                visible={isGalleryVisible}
                onRequestClose={() => setIsGalleryVisible(false)}
                swipeToCloseEnabled={true}
                doubleTapToZoomEnabled={true}
                ImageComponent={GalleryImageWrapper}
            />
        </View>
    );
}
