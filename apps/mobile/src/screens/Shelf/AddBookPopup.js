// src/components/ui/AddBookPopup.js

import React from 'react';
import { 
    Modal, 
    View, 
    Text, 
    TouchableOpacity, 
    StyleSheet, 
    TouchableWithoutFeedback,
    useColorScheme
} from 'react-native';
import { Iconify } from 'react-native-iconify';
import { Colors } from '@readme/shared/src/constants/theme';
import { ROUTES } from '@readme/shared/src/constants/routes';
import { useNavigation } from '@react-navigation/native';

export default function AddBookPopup({ isVisible, onClose }) {
    const navigation = useNavigation();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const styles = StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'flex-end',
        },
        sheet: {
            backgroundColor: theme.backgroundElement,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 24,
            paddingBottom: 40,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 10,
        },
        dragHandle: {
            width: 40,
            height: 5,
            borderRadius: 3,
            backgroundColor: theme.borderLight || '#E4DFDC',
            alignSelf: 'center',
            marginBottom: 20,
        },
        title: {
            fontFamily: 'Inter-SemiBold',
            fontSize: 20,
            color: theme.textItemTitle,
            marginBottom: 20,
            textAlign: 'center',
        },
        optionBtn: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.background,
            padding: 16,
            borderRadius: 12,
            marginBottom: 12,
        },
        optionText: {
            fontFamily: 'Inter-Regular',
            fontSize: 16,
            color: theme.textItemTitle,
            marginLeft: 12,
        }
    });

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
