// src/components/SuccessModal.js
import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    Image,
} from 'react-native';
import { useTheme } from '@readme/shared/src/hooks/use-theme';
import { Iconify } from 'react-native-iconify';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { buildPublicationSuccessStyles } from '../../styles/publicationSuccessStyles';

export default function SuccessModal({ visible, onClose, onGoHome, bookName }) {
    // 3. Setup the theme hook
    const theme = useTheme();
    const styles = buildPublicationSuccessStyles(theme);

    return (
        <Modal
            transparent={true}
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    
                    {/* Bookworm Illustration */}
                    <Image 
                        source={require('../../../assets/images/bookworm.png')}
                        style={styles.successImage} 
                    />

                    {/* --- GRADIENT TEXT WRAPPER --- */}
                    <MaskedView
                        style={styles.gradientMaskContainer}
                        maskElement={
                            <View style={styles.maskElementContainer}>
                                <Text style={styles.successTitle}>CONGRATS</Text>
                            </View>
                        }
                    >
                        {/* start={x:0, y:0} and end={x:1, y:0} makes it go left to right */}
                        <LinearGradient
                            colors={['#F58B2E', '#9482FF']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.gradientFill}
                        />
                    </MaskedView>
                    
                    <Text style={styles.successSubtitle}>Your Book:</Text>
                    <Text style={styles.successBookName}>{bookName || 'Art of War'}</Text>
                    
                    <Text style={styles.successMessage}>Successfully Uploaded</Text>
                    
                    <TouchableOpacity style={styles.homeButton} onPress={onGoHome} activeOpacity={0.8}>
                        <Iconify icon="lucide:home" size={18} color="#FFFFFF" />
                        <Text style={styles.homeButtonText}>Go to Home</Text>
                    </TouchableOpacity>

                </View>
            </View>
        </Modal>
    );
}
