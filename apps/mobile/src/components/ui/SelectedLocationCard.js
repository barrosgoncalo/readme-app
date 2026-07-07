import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SelectedLocationCard({ theme, location, isLoading, isAlternative, onClose }) {
    if (!location) return null;

    return (
        <View style={[styles.actionCard, { backgroundColor: theme.backgroundElement, borderColor: theme.borderLight }]}>
            <View style={styles.actionCardHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.actionTitle, { color: theme.textItemTitle }]}>
                        {location.title}
                    </Text>
                    {isLoading ? (
                        <ActivityIndicator size="small" color={theme.primary} style={{ alignSelf: 'flex-start', marginTop: 4 }} />
                    ) : (
                        <Text style={[styles.actionSub, { color: theme.subtext }]}>
                            {location.address}
                        </Text>
                    )}
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Ionicons name="close" size={20} color={theme.subtext} />
                </TouchableOpacity>
            </View>
            {isAlternative && (
                <Text style={styles.helperText}>
                    💡 Tip: Search an address above, drag the red pin, or tap anywhere on the map.
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    actionCard: { 
        position: 'absolute', 
        bottom: 170, 
        left: 20, 
        right: 20, 
        padding: 16, 
        borderRadius: 12, 
        borderWidth: 1, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.1, 
        shadowRadius: 8, 
        elevation: 5 
    },
    actionCardHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start' 
    },
    actionTitle: { 
        fontSize: 16, 
        fontWeight: '700', 
        marginBottom: 4 
    },
    actionSub: { 
        fontSize: 13, 
        lineHeight: 18 
    },
    closeButton: { 
        padding: 4 
    },
    helperText: { 
        fontSize: 11, 
        color: '#A35C37', 
        marginTop: 10, 
        fontStyle: 'italic' 
    },
});
