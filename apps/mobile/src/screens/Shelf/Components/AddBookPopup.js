import React from 'react';
import { 
    Modal, 
    View, 
    Text, 
    TouchableOpacity, 
    TouchableWithoutFeedback,
} from 'react-native';
import { buildAddBookPopupStyles } from '../../../styles/addBookPopupStyles';
import { Iconify } from 'react-native-iconify';
import { useTheme } from '@readme/shared/src/hooks/use-theme';
import { ROUTES } from '@readme/shared/src/constants/routes';
import { useNavigation } from '@react-navigation/native';

export default function AddBookPopup({ isVisible, onClose }) {
    const navigation = useNavigation();
    const theme = useTheme();

    const styles = buildAddBookPopupStyles(theme);

    return (
        <Modal
            visible={isVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            {/* Clickable overlay to close the modal */}
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    
                    {/* Prevent touches inside the sheet from closing the modal */}
                    <TouchableWithoutFeedback>
                        <View style={styles.sheet}>
                            <View style={styles.dragHandle} />
                            
                            <Text style={styles.title}>Add a Book</Text>

                            <TouchableOpacity 
                                style={styles.optionBtn}
                                activeOpacity={0.7}
                                onPress={() => {
                                    onClose();
                                    navigation.navigate(ROUTES.BARCODE_SCANNER); 
                                }}
                            >
                                <Iconify icon="lucide:scan-barcode" size={24} color={theme.textItemTitle} />
                                <Text style={styles.optionText}>Scan Barcode</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.optionBtn}
                                activeOpacity={0.7}
                                onPress={() => {
                                    onClose();
                                    navigation.navigate(ROUTES.SEARCH_BOOK);
                                }}
                            >
                                <Iconify icon="lucide:search" size={24} color={theme.textItemTitle} />
                                <Text style={styles.optionText}>Search Title / Author</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableWithoutFeedback>

                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}
