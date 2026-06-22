// src/components/SuccessModal.js
import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Image
} from 'react-native';
import { Fonts } from '@readme/shared/src/constants/theme';
import { Iconify } from 'react-native-iconify';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

export default function SuccessModal({ visible, onClose, onGoHome, bookName }) {
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
                                <Text style={styles.successTitle}>SUCCESS</Text>
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

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: '#00000060',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        backgroundColor: '#DCDCDC',
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingBottom: 30,
        alignItems: 'center',
        marginTop: 80,
    },
    successImage: {
        width: 250,
        height: 220,
        marginTop: -120,
        resizeMode: 'contain',
        marginBottom: 10,
    },
    gradientMaskContainer: {
        height: 50,
        width: '100%',
        marginBottom: 8,
    },
    maskElementContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gradientFill: {
        flex: 1,
    },
    successTitle: {
        fontSize: 30,
        fontWeight: '900',
        color: '#FFA500', 
        letterSpacing: 0,
        marginBottom: 16,
        fontFamily: Fonts.inter_semi,
        lineHeight: 45,
    },
    successSubtitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111111',
        marginBottom: 2,
    },
    successBookName: {
        fontSize: 14,
        color: '#666666',
        textDecorationLine: 'underline',
        marginBottom: 16,
    },
    successMessage: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111111',
        marginBottom: 24,
    },
    homeButton: {
        flexDirection: 'row',
        backgroundColor: '#5C3A21',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        gap: 10,
        width: '80%',
        justifyContent: 'center',
    },
    homeButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
