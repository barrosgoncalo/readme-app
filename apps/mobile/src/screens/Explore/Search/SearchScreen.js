import React, { useState, useEffect, useCallback } from 'react';
import { View, TextInput, FlatList, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Iconify } from 'react-native-iconify';
import { useAuth } from '@readme/shared/src/contexts/AuthContext';
import { useTheme } from '@readme/shared/src/hooks/use-theme';
import { ROUTES } from '@readme/shared/src/constants/routes';
import { searchUsers } from '@readme/shared/src/services/searchUser';
import { searchBookTitles, searchPublicationsByBook, SORT_OPTIONS } from '@readme/shared/src/services/searchBook';
import { buildStyles } from '../../../styles/searchStyles';
import PublicationFilterModal from '../../../components/ui/PublicationFilterModal';

const TABS = {
    BOOKS: 'books',
    PEOPLE: 'people'
};

const PAGE_WINDOW = 5;

export default function SearchScreen({ navigation }) {
    const theme = useTheme();
    const styles = buildStyles(theme);

    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState(TABS.BOOKS);
    const [searchText, setSearchText] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const [selectedBook, setSelectedBook] = useState(null);
    const [publications, setPublications] = useState([]);
    const [pubPage, setPubPage] = useState(0);
    const [pubNbPages, setPubNbPages] = useState(1);
    const [pubLoading, setPubLoading] = useState(false);

    // --- filter/sort state for the publications grid ---
    const [filtersVisible, setFiltersVisible] = useState(false);
    const [sortBy, setSortBy] = useState(SORT_OPTIONS.RELEVANCE);
    const [conditionFilters, setConditionFilters] = useState([]);
    const [genreFilters, setGenreFilters] = useState([]);

    const handleUserPress = (user) => {
        navigation.navigate(ROUTES.PUBLIC_PROFILE_SCREEN, { ownerId: user.uid });
    };

    const handleTabChange = (tab) => {
        if (tab === activeTab) return;
        setActiveTab(tab);
        setSearchText('');
        setResults([]);
        setSelectedBook(null);
        setPublications([]);
        setSortBy(SORT_OPTIONS.RELEVANCE);
        setConditionFilters([]);
        setGenreFilters([]);          // new
    };

    const handleSearchTextChange = (text) => {
        setSearchText(text);
        if (selectedBook) setSelectedBook(null);
    };

    const handleBookSuggestionPress = (book) => {
        setSelectedBook({ bookId: book.bookId, title: book.title, author: book.author });
    };

    const handleSearchSubmit = () => {
        if (activeTab === TABS.BOOKS && searchText.trim()) {
            setSelectedBook({ bookId: null, title: searchText.trim() });
        }
    };

    const handleApplyFilters = (newSortBy, newConditions, newGenres) => {
        setSortBy(newSortBy);
        setConditionFilters(newConditions);
        setGenreFilters(newGenres);   // new
        setFiltersVisible(false);
    };

    useEffect(() => {
        if (selectedBook) return;

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
    }, [searchText, activeTab, selectedBook, currentUser]);

    // --- publications for the selected book, filtered/sorted, 10-per-page ---
    const fetchPublicationsPage = useCallback(async (pageToLoad) => {
        if (!selectedBook) return;
        setPubLoading(true);
        try {
            const { publications: pubs, page, nbPages } = await searchPublicationsByBook(
                selectedBook,
                { page: pageToLoad, sortBy, conditions: conditionFilters, genres: genreFilters }
            );
            setPublications(pubs);
            setPubPage(page);
            setPubNbPages(nbPages);
        } catch (error) {
            console.error("Erro ao procurar publicações:", error);
            setPublications([]);
        } finally {
            setPubLoading(false);
        }
    }, [selectedBook, sortBy, conditionFilters, genreFilters]);   // add genreFilters to deps


    useEffect(() => {
        if (selectedBook) fetchPublicationsPage(0);
    }, [selectedBook, fetchPublicationsPage]);

    const goToPublicationsPage = (targetPage) => {
        if (targetPage === pubPage || targetPage < 0 || targetPage >= pubNbPages) return;
        fetchPublicationsPage(targetPage);
    };

    const handlePublicationPress = (publication) => {
        navigation.navigate(ROUTES.PUBLICATION_DETAILS, {
            publication,
            seller: publication.seller
        });
    };

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

    const renderBookSuggestionItem = useCallback(({ item }) => (
        <TouchableOpacity style={styles.resultRow} onPress={() => handleBookSuggestionPress(item)}>
            <View style={styles.bookTextContainer}>
                <Text style={styles.resultUsername}>{item.title}</Text>
                <Text style={[styles.resultFullName, { marginTop: 4 }]}>{item.author}</Text>
            </View>
        </TouchableOpacity>
    ), [styles]);

    const renderPublicationCard = useCallback(({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => handlePublicationPress(item)} activeOpacity={0.85}>
            <View style={styles.coverWrapper}>
                {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.coverImage} />
                ) : (
                    <View style={[styles.coverImage, styles.coverPlaceholder]}>
                        <Iconify icon="lucide:book" size={28} color={theme.subtext} />
                    </View>
                )}
            </View>
            <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.cardAuthor} numberOfLines={1}>{item.author}</Text>
            <Text style={styles.cardSeller} numberOfLines={1}>{item.seller?.name}</Text>
        </TouchableOpacity>
    ), [styles, theme]);

    const renderPagination = () => {
        if (pubNbPages <= 1) return null;

        const start = Math.max(0, Math.min(pubPage - Math.floor(PAGE_WINDOW / 2), pubNbPages - PAGE_WINDOW));
        const end = Math.min(pubNbPages, start + PAGE_WINDOW);
        const pages = [];
        for (let i = Math.max(0, start); i < end; i++) pages.push(i);

        return (
            <View style={styles.paginationRow}>
                <TouchableOpacity
                    style={styles.pageArrow}
                    onPress={() => goToPublicationsPage(pubPage - 1)}
                    disabled={pubPage === 0}
                >
                    <Iconify icon="lucide:chevron-left" size={18} color={pubPage === 0 ? theme.subtext : theme.text} />
                </TouchableOpacity>

                {pages.map((p) => (
                    <TouchableOpacity
                        key={p}
                        style={[styles.pageNumber, p === pubPage && styles.pageNumberActive]}
                        onPress={() => goToPublicationsPage(p)}
                    >
                        <Text style={[styles.pageNumberText, p === pubPage && styles.pageNumberTextActive]}>
                            {p + 1}
                        </Text>
                    </TouchableOpacity>
                ))}

                <TouchableOpacity
                    style={styles.pageArrow}
                    onPress={() => goToPublicationsPage(pubPage + 1)}
                    disabled={pubPage === pubNbPages - 1}
                >
                    <Iconify icon="lucide:chevron-right" size={18} color={pubPage === pubNbPages - 1 ? theme.subtext : theme.text} />
                </TouchableOpacity>
            </View>
        );
    };

    const showingPublications = activeTab === TABS.BOOKS && !!selectedBook;
    const renderItem = activeTab === TABS.PEOPLE ? renderUserItem : renderBookSuggestionItem;
    const hasActiveFilters = sortBy !== SORT_OPTIONS.RELEVANCE || conditionFilters.length > 0 || genreFilters.length > 0;

    return (
        <View style={styles.container}>
            <View style={styles.searchBar}>
                <Iconify icon="lucide:search" size={20} color={theme.subtext} />

                <TextInput
                    style={styles.searchInput}
                    placeholder={activeTab === TABS.PEOPLE ? "Search users..." : "Search books..."}
                    placeholderTextColor={theme.subtext}
                    value={searchText}
                    onChangeText={handleSearchTextChange}
                    onSubmitEditing={handleSearchSubmit}
                    returnKeyType="search"
                    autoCapitalize="none"
                    autoCorrect={false}
                />

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {(loading || pubLoading) && <ActivityIndicator size="small" color={theme.secondary} />}

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

            {/* --- TAB BUTTONS + FILTER BUTTON --- */}
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

                {showingPublications && (
                    <TouchableOpacity
                        style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
                        onPress={() => setFiltersVisible(true)}
                        activeOpacity={0.8}
                    >
                        <Iconify
                            icon="lucide:sliders-horizontal"
                            size={16}
                            color={hasActiveFilters ? theme.pillButtonActiveText : theme.pillButtonMutedText}
                        />
                        {hasActiveFilters && <View style={styles.filterBadgeDot} />}
                    </TouchableOpacity>
                )}
            </View>

            {showingPublications ? (
                <FlatList
                    key="publications-two-column"
                    data={publications}
                    numColumns={2}
                    keyExtractor={(item) => item.id}
                    renderItem={renderPublicationCard}
                    columnWrapperStyle={styles.columnWrapper}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        !pubLoading ? (
                            <View style={styles.emptyState}>
                                <Iconify icon="lucide:book-x" size={36} color={theme.subtext} />
                                <Text style={styles.emptyStateText}>
                                    {hasActiveFilters ? 'No copies match these filters' : 'No copies found for this book'}
                                </Text>
                            </View>
                        ) : null
                    }
                    ListFooterComponent={publications.length > 0 ? renderPagination : null}
                    ListFooterComponentStyle={styles.footerWrapper}
                />
            ) : (
                <FlatList
                    key="suggestions-one-column"
                    data={results}
                    keyExtractor={(item) => (activeTab === TABS.PEOPLE ? item.uid : item.key)}
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
            )}

            <PublicationFilterModal
                visible={filtersVisible}
                onClose={() => setFiltersVisible(false)}
                onApply={handleApplyFilters}
                initialSortBy={sortBy}
                initialConditions={conditionFilters}
                initialGenres={genreFilters}
                theme={theme}
                styles={styles}
            />
        </View>
    );
}
