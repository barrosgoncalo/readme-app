import React, { memo } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    StyleSheet, 
} from 'react-native';

// External UI Libraries
import { Image } from 'expo-image';
import { Iconify } from 'react-native-iconify';

/**
 * ====================================================================
 * COMPONENT: BookCard
 * ====================================================================
 * An isolated, grid-friendly item representing a book in a list selection.
 * * PERFORMANCE OPTIMIZATION:
 * Wrapped in React.memo() to prevent full list items from re-rendering
 * when changing the selection state of unrelated cards in a FlatList.
 * * @param {Object} item - The parsed book object containing title and imageUrl.
 * @param {Boolean} isSelected - Flag indicating if this specific book is picked.
 * @param {Function} onPress - Callback fired when a card is selected/deselected.
 * @param {Object} theme - Global application theme parameters (light/dark colors).
 */
export const BookCard = memo(({ item, isSelected, onPress, theme }) => (
    <TouchableOpacity 
        style={[
            styles.bookCard, 
            { 
                backgroundColor: theme.backgroundElement,
                borderColor: isSelected ? theme.primary : theme.borderLight,
                borderWidth: isSelected ? 2 : 1
            }
        ]}
        onPress={() => onPress(item)}
        activeOpacity={0.7}
    >
        {/* --- BOOK COVER IMAGE --- */}
        <Image 
            source={{ uri: item.imageUrl }} 
            style={styles.bookImage} 
            contentFit="cover" 
        />
        
        {/* --- BOOK METADATA TEXT CONTAINER --- */}
        <View style={styles.bookInfo}>
            <Text 
                style={[styles.bookTitle, { color: theme.textItemTitle }]} 
                numberOfLines={2}
            >
                {item.title}
            </Text>
        </View>
        
        {/* --- COMPACT SELECTION STATE BADGE --- */}
        {isSelected && (
            <View style={[styles.checkBadge, { backgroundColor: theme.primary }]}>
                <Iconify icon="lucide:check" size={14} color="#FFFFFF" />
            </View>
        )}
    </TouchableOpacity>
));

// ====================================================================
// STYLES
// ====================================================================

const styles = StyleSheet.create({
    // Card Wrapper (Targeted for a 2-column FlatList grid layout)
    bookCard: { 
        width: '48%', 
        borderRadius: 12, 
        overflow: 'hidden', 
        padding: 8, 
        position: 'relative' // Essential context for absolute badges
    },
    // Aspect ratio 0.7 matches classic book geometry natively across devices
    bookImage: { 
        width: '100%', 
        aspectRatio: 0.7, 
        borderRadius: 8, 
        backgroundColor: '#EAEAEA' 
    },
    bookInfo: { 
        marginTop: 8 
    },
    bookTitle: { 
        fontSize: 14, 
        fontWeight: '600' 
    },
    // Floated Selection Marker overlayed cleanly on top of the cover art
    checkBadge: { 
        position: 'absolute', 
        top: 12, 
        right: 12, 
        width: 22, 
        height: 22, 
        borderRadius: 11, 
        justifyContent: 'center', 
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
    },
});
