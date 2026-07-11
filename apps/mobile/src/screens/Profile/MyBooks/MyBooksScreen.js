import React, { useEffect, useState } from 'react';
import { 
    View, 
    Text, 
    FlatList, 
    ActivityIndicator, 
    StatusBar,
    TouchableOpacity,
    useColorScheme 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Iconify } from 'react-native-iconify';
import { useAuth } from '@readme/shared/src/contexts/AuthContext';
import { Colors } from '@readme/shared/src/constants/theme';
import { ROUTES } from '@readme/shared/src/constants/routes';
import { buildBookGridStyles } from '../../../styles/bookGridStyles';

import { BookGridItem } from '../../../components/ui/BookGridItem';
import { useMyPostings } from '@readme/shared/src/hooks/use-my-postings';

export default function MyPostingsScreen({ navigation }) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const styles = buildBookGridStyles(theme); 

    const insets = useSafeAreaInsets();
    const { currentUser } = useAuth();

    const { myBooks, isLoading, fetchMyPostings, handleToggleFavorite } = useMyPostings(currentUser?.uid);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchMyPostings();
        });
        return unsubscribe;
    }, [navigation, fetchMyPostings]);

    return (
        <View style={styles.container}>
            <StatusBar 
                barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} 
                backgroundColor={theme.background} 
            />

            {/* --- CABEÇALHO --- */}
            <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                paddingHorizontal: 16, 
                paddingTop: insets.top + 12, 
                paddingBottom: 16,
            }}>
                <TouchableOpacity 
                    onPress={() => navigation.goBack()}
                    style={{ padding: 8, marginLeft: -8, marginRight: 8 }}
                >
                    <Iconify icon="lucide:arrow-left" size={24} color={theme.text} />
                </TouchableOpacity>

                <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.text }}>
                    Postings
                </Text>
            </View>

            {isLoading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                    <FlatList
                        data={myBooks}
                        keyExtractor={(item) => item.id}
                        numColumns={2}
                        columnWrapperStyle={styles.row}
                        contentContainerStyle={styles.gridContainer}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <BookGridItem 
                                bookId={item.id}
                                title={item.title}
                                author={item.author}
                                imageUrl={item.imageUrl}
                                styles={styles} 
                                theme={theme}
                                isFavorite={item.isFavorite}
                                favoriteCount={item.favoriteCount}
                                onPress={() => navigation.navigate(ROUTES.MY_PUBLICATION_DETAILS, { 
                                    publication: item 
                                })}
                                onToggleFavorite={handleToggleFavorite}
                            />
                        )}
                        ListEmptyComponent={
                            <View style={{ flex: 1, alignItems: 'center', marginTop: 60, paddingHorizontal: 32 }}>
                                <Iconify icon="lucide:book-open" size={48} color={theme.subtext} style={{ marginBottom: 12, opacity: 0.5 }} />
                                <Text style={{ textAlign: 'center', color: theme.subtext, fontSize: 15, lineHeight: 22 }}>
                                    You haven't posted any books yet. Books you put up for swapping will appear here.
                                </Text>
                            </View>
                        }
                    />
                )}
        </View>
    );
}
