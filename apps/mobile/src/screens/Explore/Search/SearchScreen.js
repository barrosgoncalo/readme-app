import React, { useState, useEffect, useCallback } from 'react';
import { View, TextInput, FlatList, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Iconify } from 'react-native-iconify';
import { useAuth } from '@readme/shared/src/contexts/AuthContext';
import { useTheme } from '@readme/shared/src/hooks/use-theme';
import { ROUTES } from '@readme/shared/src/constants/routes';
import { searchBookTitles, SORT_OPTIONS } from '@readme/shared/src/services/searchBook';
import { usePublicationSearchFeed } from '@readme/shared/src/hooks/use-publication-search-feed';
import { useUserSearchFeed } from '@readme/shared/src/hooks/use-user-search-feed';
import {useRecentSearches} from "@readme/shared/src/hooks/use-recent-searches";
import { RECENT_SEARCH_TYPES } from '@readme/shared/src/services/recentSearches';
import { buildStyles } from '../../../styles/searchStyles';
import PublicationFilterModal from '../../../components/ui/PublicationFilterModal';
import { Keyboard } from 'react-native';

const BOOK_HITS_PER_PAGE = 8;
const PEOPLE_SEARCH_DEBOUNCE_MS = 350;

const TABS = {
    BOOKS: 'books',
    PEOPLE: 'people'
};

export default function SearchScreen({ navigation }) {
    const theme = useTheme();
    const styles = buildStyles(theme);

    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState(TABS.BOOKS);
    const [searchText, setSearchText] = useState('');

    // --- Books tab: autocomplete suggestions (unchanged, one-shot) ---
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedBook, setSelectedBook] = useState(null);

    // --- People tab: debounced query feeding the infinite-scroll feed ---
    const [debouncedPeopleQuery, setDebouncedPeopleQuery] = useState('');

    // --- filter/sort state for the publications grid ---
    const [filtersVisible, setFiltersVisible] = useState(false);
    const [sortBy, setSortBy] = useState(SORT_OPTIONS.RELEVANCE);
    const [conditionFilters, setConditionFilters] = useState([]);
    const [genreFilters, setGenreFilters] = useState([]);

    // --- infinite-scroll feed for publications matching selectedBook ---
    const {
        items: publications,
        isLoadingInitial: pubLoadingInitial,
        isLoadingMore: pubLoadingMore,
        loadMore: loadMorePublications,
    } = usePublicationSearchFeed({
        book: selectedBook,
        sortBy,
        conditions: conditionFilters,
        genres: genreFilters,
        excludeUid: currentUser.uid,
    });

    // --- infinite-scroll feed for the People tab ---
    const {
        items: people,
        isLoadingInitial: peopleLoadingInitial,
        isLoadingMore: peopleLoadingMore,
        loadMore: loadMorePeople,
    } = useUserSearchFeed({
        searchText: debouncedPeopleQuery,
        currentUserId: currentUser.uid,
    });

    const recentSearchType = activeTab === TABS.PEOPLE
        ? RECENT_SEARCH_TYPES.PEOPLE
        : RECENT_SEARCH_TYPES.BOOKS;

    const { recentSearches, saveRecentSearch, removeRecent, clearRecents } = useRecentSearches(recentSearchType);

    const handleUserPress = (user) => {
        setSearchText(user.username);
        saveRecentSearch(user.username);
        navigation.navigate(ROUTES.PUBLIC_PROFILE, { ownerId: user.uid });
    };

    const handleRecentPress = (query) => {
        Keyboard.dismiss();
        setSearchText(query);
        if (activeTab === TABS.BOOKS) {
            setSelectedBook({ bookId: null, title: query });
        }
        // For People, setSearchText above flows into the debounce effect
        // below and populates debouncedPeopleQuery as usual.
    };

    const handleTabChange = (tab) => {
        if (tab === activeTab) return;
        setActiveTab(tab);
        setSearchText('');
        setResults([]);
        setSelectedBook(null);
        setDebouncedPeopleQuery('');
        setSortBy(SORT_OPTIONS.RELEVANCE);
        setConditionFilters([]);
        setGenreFilters([]);
    };

    const handleSearchTextChange = (text) => {
        setSearchText(text);
        if (selectedBook) setSelectedBook(null);
    };

    const handleBookSuggestionPress = (book) => {
        Keyboard.dismiss();
        const query = [book.title, book.author].filter(Boolean).join(' ');
        setSearchText(query);
        setSelectedBook({ bookId: book.bookId, title: book.title, author: book.author });
        saveRecentSearch(query);
    };

    const handleSearchSubmit = () => {
        if (activeTab === TABS.BOOKS && searchText.trim()) {
            setSelectedBook({ bookId: null, title: searchText.trim() });
            saveRecentSearch(searchText);
        } else if (activeTab === TABS.PEOPLE && searchText.trim()) {
            saveRecentSearch(searchText);
        }
    };

    const handleApplyFilters = (newSortBy, newConditions, newGenres) => {
        setSortBy(newSortBy);
        setConditionFilters(newConditions);
        setGenreFilters(newGenres);
        setFiltersVisible(false);
    };

    // Books-tab autocomplete: unchanged, one-shot debounce.
    useEffect(() => {
        if (activeTab !== TABS.BOOKS) return;
        if (selectedBook) return;

        if (!searchText.trim()) {
            setResults([]);
            return;
        }

        setLoading(true);
        const debounce = setTimeout(async () => {
            try {
                const books = await searchBookTitles(searchText, BOOK_HITS_PER_PAGE, currentUser.uid);
                setResults(books);
            } catch (error) {
                console.error("Erro na pesquisa:", error);
            } finally {
                setLoading(false);
            }
        }, PEOPLE_SEARCH_DEBOUNCE_MS);

        return () => clearTimeout(debounce);
    }, [searchText, activeTab, selectedBook, currentUser]);

    // People-tab: just debounce searchText into debouncedPeopleQuery.
    // useUserSearchFeed's own effect reacts to that value changing and
    // triggers loadInitial — no fetch call here.
    useEffect(() => {
        if (activeTab !== TABS.PEOPLE) return;

        const debounce = setTimeout(() => {
            setDebouncedPeopleQuery(searchText.trim());
        }, PEOPLE_SEARCH_DEBOUNCE_MS);

        return () => clearTimeout(debounce);
    }, [searchText, activeTab]);

    const handlePublicationPress = (publication) => {
        navigation.navigate(ROUTES.PUBLICATION_DETAILS, {
            publication,
            seller: publication.seller
        });
    };

    const renderRecentItem = useCallback(({ item }) => (
        <TouchableOpacity style={styles.recentRow} onPress={() => handleRecentPress(item)}>
            <Iconify icon="lucide:history" size={18} color={theme.subtext} style={styles.recentIcon} />
            <Text style={styles.recentText} numberOfLines={1}>{item}</Text>
            <TouchableOpacity
                style={styles.recentRemoveBtn}
                onPress={() => removeRecent(item)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
                <Iconify icon="lucide:x" size={16} color={theme.subtext} />
            </TouchableOpacity>
        </TouchableOpacity>
    ), [styles, theme, removeRecent]);


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

    const renderPublicationFooter = () => {
        if (!pubLoadingMore) return null;
        return (
            <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator size="small" color={theme.primary} />
            </View>
        );
    };

    const renderPeopleFooter = () => {
        if (!peopleLoadingMore) return null;
        return (
            <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator size="small" color={theme.primary} />
            </View>
        );
    };

    const showingPublications = activeTab === TABS.BOOKS && !!selectedBook;
    const showingPeopleResults = activeTab === TABS.PEOPLE && !!searchText.trim();
    const hasActiveFilters = sortBy !== SORT_OPTIONS.RELEVANCE || conditionFilters.length > 0 || genreFilters.length > 0;

    // Only true while the debounce timer is pending or the feed hasn't
    // resolved its first page yet for the *current* text — avoids a
    // spinner that stays tied to a stale query while typing.
    const peopleQueryPending = activeTab === TABS.PEOPLE
        && searchText.trim() !== debouncedPeopleQuery;
    const peopleLoading = peopleQueryPending || peopleLoadingInitial;

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
                    {activeTab === TABS.PEOPLE
                        ? (peopleLoading && <ActivityIndicator size="small" color={theme.secondary} />)
                        : ((loading || pubLoadingInitial) && <ActivityIndicator size="small" color={theme.secondary} />)
                    }

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

            {/* --- separator --- */}
            <View style={styles.separator} />


            {showingPublications ? (
                <FlatList
                    key="publications-two-column"
                    data={publications}
                    numColumns={2}
                    keyExtractor={(item) => item.id}
                    renderItem={renderPublicationCard}
                    columnWrapperStyle={styles.columnWrapper}
                    contentContainerStyle={styles.listContent}
                    onEndReached={loadMorePublications}
                    onEndReachedThreshold={0.5}
                    ListEmptyComponent={
                        !pubLoadingInitial ? (
                            <View style={styles.emptyState}>
                                <Iconify icon="lucide:book-x" size={36} color={theme.subtext} />
                                <Text style={styles.emptyStateText}>
                                    {hasActiveFilters ? 'No copies match these filters' : 'No copies found for this book'}
                                </Text>
                            </View>
                        ) : null
                    }
                    ListFooterComponent={renderPublicationFooter}
                    ListFooterComponentStyle={styles.footerWrapper}
                />
            ) : showingPeopleResults ? (
                <FlatList
                    key="people-one-column"
                    data={people}
                    keyExtractor={(item) => item.uid}
                    renderItem={renderUserItem}
                    keyboardShouldPersistTaps="handled"
                    onEndReached={loadMorePeople}
                    onEndReachedThreshold={0.5}
                    ListEmptyComponent={
                        !peopleLoading ? (
                            <View style={styles.emptyState}>
                                <Iconify icon="lucide:user-x" size={36} color={theme.subtext} />
                                <Text style={styles.emptyStateText}>No users found</Text>
                            </View>
                        ) : null
                    }
                    ListFooterComponent={renderPeopleFooter}
                />
            ) : activeTab === TABS.BOOKS && searchText.trim() ? (
                <FlatList
                    key="suggestions-one-column"
                    data={results}
                    keyExtractor={(item) => item.key}
                    renderItem={renderBookSuggestionItem}
                    keyboardShouldPersistTaps="handled"
                    ListEmptyComponent={
                        !loading ? (
                            <View style={styles.emptyState}>
                                <Iconify icon="lucide:book-x" size={36} color={theme.subtext} />
                                <Text style={styles.emptyStateText}>No books found</Text>
                            </View>
                        ) : null
                    }
                />
            ) : (
                <FlatList
                    key="recents-one-column"
                    data={recentSearches}
                    keyExtractor={(item, index) => `${item}-${index}`}
                    renderItem={renderRecentItem}
                    keyboardShouldPersistTaps="handled"
                    ListHeaderComponent={
                        recentSearches.length > 0 ? (
                            <View style={styles.recentHeader}>
                                <Text style={styles.recentHeaderText}>Recent</Text>
                                <TouchableOpacity onPress={clearRecents}>
                                    <Text style={styles.recentClearText}>Clear</Text>
                                </TouchableOpacity>
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
