import React, { useState, useEffect, useCallback } from 'react';
import { View, TextInput, FlatList, Text, Image, TouchableOpacity, useColorScheme, ActivityIndicator } from 'react-native';
import { Iconify } from 'react-native-iconify';
import { useAuth } from '@readme/shared/src/contexts/AuthContext';
import { Colors } from '@readme/shared/src/constants/theme';
import { ROUTES } from '@readme/shared/src/constants/routes';
import { searchUsers } from '@readme/shared/src/services/searchUser';
import { searchBookTitles } from '@readme/shared/src/services/searchBook';
import { buildStyles } from '../../styles/searchStyles';

const TABS = {
    BOOKS: 'books',
    PEOPLE: 'people'
};

export default function SearchScreen({ navigation }) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const styles = buildStyles(theme);

    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState(TABS.BOOKS); // Figma shows Books selected by default
    const [searchText, setSearchText] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleUserPress = (user) => {
        navigation.navigate(ROUTES.PUBLIC_PROFILE_SCREEN, { ownerId: user.uid });
    };

    const handleBookPress = (book) => {
        navigation.navigate(ROUTES.BOOKS_LIST, {
            bookId: book.bookId,
            title: book.title,
        });
    };


    const handleTabChange = (tab) => {
        if (tab === activeTab) return;
        setActiveTab(tab);
        setSearchText('');
        setResults([]);
    };

    useEffect(() => {
        if (!searchText.trim()) {
            setResults([]);
            return;
        }

        setLoading(true);
        const debounce = setTimeout(async () => {
            try {
                if (activeTab === TABS.PEOPLE) {
                    const users = await searchUsers(searchText, currentUser.uid);
                    setResults(users);
                } else {
                    const books = await searchBookTitles(searchText);
                    setResults(books);
                }
            } catch (error) {
                console.error("Erro na pesquisa:", error);
            } finally {
                setLoading(false);
            }
        }, 350);

        return () => clearTimeout(debounce);
    }, [searchText, activeTab]);


    const renderUserItem = useCallback(({ item }) => (
        <TouchableOpacity
            style={styles.resultRow}
            onPress={() => handleUserPress(item)}
        >
            <View style={styles.avatar}>
                {item.photoURL ? (
                    <Image source={{ uri: item.photoURL }} style={styles.avatarImage} />
                ) : (
                    <Iconify icon="lucide:user" size={22} color={theme.text} />
                )}
            </View>
            <View style={styles.resultTextContainer}>
                <Text style={styles.resultUsername}>{item.username}</Text>
                <Text style={styles.resultFullName}>{item.fullName}</Text>
            </View>
        </TouchableOpacity>
    ), [navigation, theme, styles]);

    const renderBookItem = useCallback(({ item }) => (
        <TouchableOpacity style={styles.resultRow} onPress={() => handleBookPress(item)}>
            <View style={styles.bookTextContainer}>
                <Text style={styles.resultUsername}>{item.title}</Text>
                <Text style={[styles.resultFullName, { marginTop: 4 }]}>{item.author}</Text>
            </View>
        </TouchableOpacity>
    ), [styles]);

    const renderItem = activeTab === TABS.PEOPLE ? renderUserItem : renderBookItem;

    return (
        <View style={styles.container}>
            <View style={styles.searchBar}>
                <Iconify icon="lucide:search" size={20} color={theme.subtext} />

                <TextInput
                    style={styles.searchInput}
                    placeholder={activeTab === TABS.PEOPLE ? "Search users..." : "Search books..."}
                    placeholderTextColor={theme.subtext}
                    value={searchText}
                    onChangeText={setSearchText}
                    autoCapitalize="none"
                    autoCorrect={false}
                />

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {loading && <ActivityIndicator size="small" color={theme.secondary} />}

                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={{
                            width: 18,
                            height: 18,
                            borderRadius: 9,
                            backgroundColor: theme.backgroundSelected,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                        activeOpacity={0.7}
                    >
                        <Iconify
                            icon="lucide:x"
                            size={12}
                            color={theme.subtext}
                            strokeWidth={3.5}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* --- TAB BUTTONS --- */}
            <View style={styles.tabButtonsRow}>
                <TouchableOpacity
                    style={[styles.pillButton, activeTab === TABS.BOOKS && styles.tabButtonActive]}
                    onPress={() => handleTabChange(TABS.BOOKS)}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.tabButtonText, activeTab === TABS.BOOKS && styles.tabButtonTextActive]}>
                        Books
                    </Text>
                </TouchableOpacity>

                {/* TODO: add a "Communities" tab here too, per the Figma, once that search exists */}

                <TouchableOpacity
                    style={[styles.pillButton, activeTab === TABS.PEOPLE && styles.tabButtonActive]}
                    onPress={() => handleTabChange(TABS.PEOPLE)}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.tabButtonText, activeTab === TABS.PEOPLE && styles.tabButtonTextActive]}>
                        People
                    </Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={results}
                keyExtractor={(item) => (activeTab === TABS.PEOPLE ? item.uid : item.id)}
                renderItem={renderItem}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                    !loading && searchText.trim() ? (
                        <View style={styles.emptyState}>
                            <Iconify
                                icon={activeTab === TABS.PEOPLE ? "lucide:user-x" : "lucide:book-x"}
                                size={36}
                                color={theme.subtext}
                            />
                            <Text style={styles.emptyStateText}>
                                {activeTab === TABS.PEOPLE ? 'No users found' : 'No books found'}
                            </Text>
                        </View>
                    ) : null
                }
            />
        </View>
    );
}