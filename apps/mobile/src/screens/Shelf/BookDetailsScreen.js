import React from 'react';
import { 
    View,
    Text,
    Image,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { buildBookDetailsStyles } from '../../styles/bookDetailsStyle'; 
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@readme/shared/src/hooks/use-theme';
import { Iconify } from 'react-native-iconify';

export default function BookDetailsScreen({ route, navigation }) {
    const insets = useSafeAreaInsets();

    const theme = useTheme();

    const styles = buildBookDetailsStyles();
    const { book } = route.params || {};
    const bookData = book?.bookDetails || book || {};
    const title = bookData.title || 'Unknown Title';
    const authors = bookData.authors?.join(', ') || 'Unknown Author';
    const coverUrl = bookData.coverUrl;
    const rawDescription = bookData.description || 'No description available for this book.';
    const cleanDescription = rawDescription.replace(/<[^>]+>/g, '');

    return (
        <View 
            style={[
                styles.container, 
                { 
                    paddingTop: insets.top, 
                    paddingBottom: insets.bottom,
                    backgroundColor: theme.background
                }
            ]}
        >
            <ScrollView 
                style={[styles.container, { backgroundColor: theme.background }]}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Back Button ── */}
                <TouchableOpacity 
                    style={styles.backButton} 
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <Iconify icon="lucide:arrow-left" size={22} color={theme.text} />
                </TouchableOpacity>
                {/* ── Header ── */}
                {/* Forcing text colors inline to bypass cache */}
                <Text style={[styles.title, { color: theme.text }]} numberOfLines={2} ellipsizeMode="tail">
                    {title}
                </Text>
                <Text style={[styles.subtitle, { color: theme.textMuted }]} numberOfLines={1} ellipsizeMode="tail">
                    {authors}
                </Text>
                {/* ── Book Cover with Shadow ── */}
                <View style={styles.imageContainer}>
                    {coverUrl ? (
                        <Image 
                            source={{ uri: coverUrl }} 
                            style={styles.coverImage}
                            contentFit="cover"
                        />
                    ) : (
                            <View style={[styles.coverImage, styles.placeholderCover, { backgroundColor: theme.backgroundElement || '#EAEAEA', borderColor: theme.border || '#DDDDDD' }]}>
                                <Text style={[styles.placeholderText, { color: theme.textMuted }]}>No Cover Available</Text>
                            </View>
                        )}
                </View>
                {/* ── Description Section ── */}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Description</Text>
                <Text style={[styles.descriptionText, { color: theme.textMuted }]}>
                    {cleanDescription}
                </Text>
            </ScrollView>
        </View>
    );
}
