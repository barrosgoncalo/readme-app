import React from 'react';
import { 
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    TouchableOpacity,
    useColorScheme
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@readme/shared/src/constants/theme';
import { useNavigation } from '@react-navigation/native';
import { Iconify } from 'react-native-iconify';

export default function BookDetailsScreen({ route }) {

    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    // Removed useMemo. We evaluate this directly now!
    const styles = buildStyles(theme);

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
                    backgroundColor: theme.background // FORCING the background color inline
                }
            ]}
        >
            <ScrollView 
                style={[styles.container, { backgroundColor: theme.background }]} // Forcing here too
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
                            resizeMode="cover"
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

// ─── Styles ──────────────────────────────────────────────────────────────

// Removed color properties from the stylesheet entirely where they were buggy, 
// leaving structural styling intact.
const buildStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 20, 
        paddingBottom: 60,
    },
    backButton: {
        alignSelf: 'flex-start',
        marginBottom: 24,
        padding: 4, 
        marginLeft: -4, 
    },
    title: {
        fontFamily: 'Inter-Regular', 
        fontSize: 28,
        marginBottom: 4,
    },
    subtitle: {
        fontFamily: 'Inter-Regular',
        fontSize: 18,
        marginBottom: 40,
    },
    sectionTitle: {
        fontFamily: 'Inter-Regular',
        fontSize: 24,
        marginBottom: 16,
    },
    descriptionText: {
        fontFamily: 'Inter-Regular',
        fontSize: 15,
        lineHeight: 24,
    },
    imageContainer: {
        alignSelf: 'center',
        marginBottom: 48,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.25, 
        shadowRadius: 30,
        elevation: 15,
    },
    coverImage: {
        width: 300, 
        height: 450, 
        borderRadius: 4, 
    },
    placeholderCover: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    placeholderText: {
        fontFamily: 'Inter-Medium',
    }
});
