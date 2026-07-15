import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Iconify } from 'react-native-iconify';

export default function OfferBottomDock({ theme, canSend, loading, isProposingAlternative, onSend, onToggleAlternative }) {
    return (
        <SafeAreaView edges={['bottom']} style={[styles.bottomBar, { 
            backgroundColor: theme.backgroundElement,
            borderTopColor: theme.borderLight
        }]}>
            <TouchableOpacity 
                style={[
                    styles.sendButton, 
                    { 
                        backgroundColor: canSend ? (theme.primary || '#E58A1F') : theme.borderLight,
                        shadowColor: canSend ? (theme.primary || '#E58A1F') : '#000',
                        elevation: canSend ? 8 : 0,
                    }
                ]} 
                onPress={onSend}
                disabled={!canSend || loading}
                activeOpacity={0.85}
            >
                <Iconify icon="lucide:send" size={20} color={canSend ? '#FFFFFF' : theme.subtext} />
                <Text style={[
                    styles.sendButtonText, 
                    { color: canSend ? '#FFFFFF' : theme.subtext }
                ]}>
                    {isProposingAlternative ? "Propose This Spot" : "Send Offer"}
                </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.proposeAlternativeButton} onPress={onToggleAlternative}>
                <Text style={[
                    styles.proposeAlternativeText, 
                    { color: isProposingAlternative ? '#E53E3E' : (theme.secondary || '#E58A1F') }
                ]}>
                    {isProposingAlternative ? "Cancel and use seller's locations" : "Or propose a different location"}
                </Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    bottomBar: { 
        position: 'absolute',
        bottom: 0,
        width: '100%',
        paddingHorizontal: 24, 
        paddingTop: 16, 
        paddingBottom: 16, 
        borderTopWidth: 1, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: -4 }, 
        shadowOpacity: 0.05, 
        shadowRadius: 12, 
        elevation: 10 
    },
    sendButton: { 
        width: '100%', 
        borderRadius: 16, 
        paddingVertical: 16, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: 8,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    sendButtonText: { 
        fontSize: 16, 
        fontWeight: '700', 
        letterSpacing: 0.5 
    },
    proposeAlternativeButton: { 
        marginTop: 14, 
        alignItems: 'center', 
        paddingVertical: 4 
    },
    proposeAlternativeText: { 
        fontSize: 14, 
        fontWeight: '600' 
    }
});
