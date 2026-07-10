import React, { useState } from 'react'; 
import { 
    View, 
    Text, 
    TouchableOpacity, 
    ScrollView, 
    StatusBar, 
    Dimensions, 
    useColorScheme,
    TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 

// External Libraries
import { Image } from 'expo-image';
import ImageViewing from 'react-native-image-viewing';
import { Iconify } from 'react-native-iconify';

// Internal Architecture Imports
import { ROUTES } from '@readme/shared/src/constants/routes';
import { Colors } from '@readme/shared/src/constants/theme';
import { buildBookDetailsStyles } from '../../../styles/publicationDetailsStyles';
import { GalleryImageWrapper } from '../../../components/ui/GalleryImageWrapper';

const { width } = Dimensions.get('window');

const extractBookDetails = (passedItem) => {
    const pubData = passedItem?.publicationData || passedItem || {}; 
    const bookData = pubData.book || {};
    const images = bookData.images?.length > 0 ? bookData.images : ['https://via.placeholder.com/400x600'];

    return {
        id: passedItem?.id || pubData.id,
        title: bookData.title || 'Unknown Title',
        author: bookData.author || 'Unknown Author',
        description: pubData.detailsText || "No description provided for this book.",
        condition: bookData.condition || 'Condition not specified',
        subject: bookData.subject || 'Not specified',
        images: images,
        formattedGalleryImages: images.map(imgUrl => ({ uri: imgUrl }))
    };
};

export default function MyPublicationDetailsScreen({ route, navigation }) {
    // --- Theme & Styles ---
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const styles = buildBookDetailsStyles(theme);

    const isDarkMode = colorScheme === 'dark';

    // --- Dynamic Contrast Configuration ---
    // Light Mode: Pitch Brown Background (#2B1810) with White Text
    // Dark Mode: Clean White Background with Pitch Brown Text for ultra-crisp readability
    const pitchBrown = '#2B1810';
    const buttonBgColor = isDarkMode ? '#FFFFFF' : (theme.textItemTitle || pitchBrown);
    const buttonTextColor = isDarkMode ? pitchBrown : '#FFFFFF';
    const buttonShadowColor = isDarkMode ? '#000000' : buttonBgColor;

    // --- Route Parsing ---
    const passedData = route?.params?.publication;
    const book = extractBookDetails(passedData);

    // --- Visual State Layer ---
    const [isGalleryVisible, setIsGalleryVisible] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const handleScroll = (event) => {
        const scrollPosition = event.nativeEvent.contentOffset.x;
        const index = Math.round(scrollPosition / width);
        setCurrentImageIndex(index);
    };

    const handleEdit = () => {
        navigation.navigate(ROUTES.EDIT_PUBLICATION, { publication: passedData });
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                
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

                    {book.images.length > 1 && (
                        <View style={styles.paginationContainer}>
                            {book.images.map((_, index) => (
                                <View key={index} style={[styles.dot, currentImageIndex === index && styles.activeDot]} />
                            ))}
                        </View>
                    )}

                    {/* Floating Top Actions */}
                    <SafeAreaView edges={['top']} style={styles.topButtonsContainer}>
                        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
                            <Iconify icon="lucide:arrow-left" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
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

                    <Text style={[styles.description, { marginBottom: 30 }]}>{book.description}</Text>
                </View>
            </ScrollView>

            {/* --- FIXED BOTTOM ACTION BAR WITH CORRECTED CONTRAST --- */}
            <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
                <TouchableOpacity 
                    style={[
                        styles.offerButton, 
                        { 
                            backgroundColor: buttonBgColor,
                            shadowColor: buttonShadowColor
                        }
                    ]} 
                    onPress={handleEdit}
                    activeOpacity={0.85}
                >
                    <Iconify icon="lucide:edit-3" size={22} color={buttonTextColor} />
                    <Text style={[styles.offerButtonText, { color: buttonTextColor }]}>
                        Edit Publication
                    </Text>
                </TouchableOpacity>
            </SafeAreaView>

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
