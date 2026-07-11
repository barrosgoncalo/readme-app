import React from 'react'; 
import { Text, TouchableOpacity, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { Iconify } from 'react-native-iconify';

// Internal Architecture Imports
import { PublicationInfoView } from '../../../components/ui/PublicationInfoView';
import { ROUTES } from '@readme/shared/src/constants/routes';
import { Colors } from '@readme/shared/src/constants/theme';
import { buildBookDetailsStyles } from '../../../styles/publicationDetailsStyles';
import { PublicationService } from '@readme/shared/src/services/publications';

const extractBookDetails = (passedItem) => {
    const pubData = passedItem?.publicationData || passedItem || {};
    const details = PublicationService.normalizePublicationDetails(pubData);
    return {
        ...details,
        id: passedItem?.id || pubData.id || details.id,
        formattedGalleryImages: details.images.map(imgUrl => ({ uri: imgUrl })),
    };
};

/**
 * @typedef {Object} MyPublicationDetailsParams
 * @property {Object} publication - Required. A publication summary or raw doc,
 *   normalized via PublicationService.normalizePublicationDetails.
 *   No `seller` param — this screen never renders a seller card (it's always the current user's own listing).
 */
export default function MyPublicationDetailsScreen({ route, navigation }) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const styles = buildBookDetailsStyles(theme);
    const isDarkMode = colorScheme === 'dark';

    const pitchBrown = '#2B1810';
    const buttonBgColor = isDarkMode ? '#FFFFFF' : (theme.textItemTitle || pitchBrown);
    const buttonTextColor = isDarkMode ? pitchBrown : '#FFFFFF';
    const buttonShadowColor = isDarkMode ? '#000000' : buttonBgColor;

    const passedData = route?.params?.publication;
    const book = extractBookDetails(passedData);

    const handleEdit = () => {
        navigation.navigate(ROUTES.EDIT_PUBLICATION, { publication: passedData });
    };

    // --- Compose UI Parts ---
    const renderTopActions = () => (
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
            <Iconify icon="lucide:arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
    );

    const renderBottomBar = () => (
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
    );

    return (
        <PublicationInfoView 
            book={book}
            topRightActions={renderTopActions()}
            bottomBar={renderBottomBar()}
        />
    );
}
