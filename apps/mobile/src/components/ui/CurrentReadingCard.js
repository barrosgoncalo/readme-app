import React, { useState } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    Image,
    TextInput
} from 'react-native';
import { Iconify } from 'react-native-iconify';

export const CurrentReadingCard = ({ 
    book, 
    theme, 
    styles, 
    navigation, 
    onLongPress, 
    onSaveProgress,
    detailsRoute
}) => {
    const [isUpdating, setIsUpdating] = useState(false);
    const [localPage, setLocalPage] = useState(String(book.currentPage || 0));

    const totalPages = book.bookDetails?.pageCount || 100; 
    const safeTotal = totalPages > 0 ? totalPages : 100;

    return (
        <TouchableOpacity 
            style={[styles.currentReadingCard, { marginBottom: 16 }]}
            activeOpacity={0.8}
            onPress={() => { 
                if (!isUpdating && detailsRoute) { 
                    navigation.navigate(detailsRoute, { book: book }); 
                } 
            }}
            onLongPress={() => onLongPress(book)} 
        >
            {book.bookDetails?.coverUrl ? (
                <Image source={{ uri: book.bookDetails.coverUrl }} style={styles.bookCover} />
            ) : (
                <View style={[styles.bookCover, styles.fallbackCover]}>
                    <Iconify icon="lucide:book" size={24} color={theme.textMuted} />
                </View>
            )}

            <View style={styles.currentReadingInfo}>
                <View style={styles.bookTextWrapper}>
                    <Text style={styles.currentBookTitle} numberOfLines={1}>
                        {book.bookDetails?.title?.replace(/[\r\n]+/g, ' ').trim() || 'Unknown Title'}
                    </Text>
                    <Text style={styles.currentBookAuthor} numberOfLines={1}>
                        {book.bookDetails?.authors?.join(', ') || 'Unknown Author'}
                    </Text>
                </View>

                {!isUpdating ? (
                    <TouchableOpacity 
                        style={styles.updateProgressButton} 
                        activeOpacity={0.8}
                        onPress={() => {
                            setLocalPage(String(book.currentPage || 0)); 
                            setIsUpdating(true);
                        }}
                    >
                        <Text style={styles.updateProgressText}>Update Progress</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={[styles.updateInputRow, { backgroundColor: theme.border }]}>
                        <TextInput
                            style={[styles.pageTextInput, { backgroundColor: theme.background, color: theme.text }]}
                            keyboardType="number-pad"
                            value={localPage}
                            onChangeText={setLocalPage}
                            autoFocus={true}
                            selectTextOnFocus={true} 
                            maxLength={5}
                        />
                        
                        <Text style={[styles.maxPage, { color: theme.textMuted }]}>
                            / {safeTotal}
                        </Text>
                        
                        <TouchableOpacity 
                            onPress={() => {
                                const parsedPage = parseInt(localPage, 10) || 0;
                                onSaveProgress(book.bookId, parsedPage, safeTotal);
                                setIsUpdating(false);
                            }}
                            style={[styles.smallSaveButton, { backgroundColor: theme.primary }]}
                        >
                            <Text style={styles.smallSaveButtonText}>Save</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            <View style={styles.progressContainer}>
                <Text style={styles.progressText}>{book.progressPercentage || 0}%</Text>
                <Iconify icon="fluent:caret-right-24-filled" size={16} color={theme.textMuted} />
            </View>
        </TouchableOpacity>
    );
};
