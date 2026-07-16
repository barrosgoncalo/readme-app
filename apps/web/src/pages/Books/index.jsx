import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, LayoutGrid, List, Heart } from 'lucide-react';
import { useAuth } from '@readme/shared/src/contexts/AuthContext/web';
import {
    MyBooksService,
    FavoriteBooksService,
} from '@readme/shared/src/services/books';
import {
    createBookIfMissing,
} from '@readme/shared/src/services/booksCatalog';
import { hydrateMyBooks } from '@readme/shared/src/utils/hydrateMyBooks';
import { sanitizeIsbn } from '@readme/shared/src/utils/isbn';
import { BOOK_STATUS, BOOK_STATUS_LABELS } from '@readme/shared/src/constants/bookStatus';
import Spinner from '../../components/Spinner.jsx';
import ErrorAlert from '../../components/ErrorAlert.jsx';
import Button from '../../components/Button.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { SkeletonGrid } from '../../components/Skeleton.jsx';
import BookCard from './components/BookCard.jsx';
import AddBookForm from './components/AddBookForm.jsx';
import { WEB_ROUTES } from '../../constants/webRoutes.js';
import styles from './Books.module.css';

const FILTER_ALL = 'all';
const FILTER_FAVORITES = 'favorites';

const FILTERS = [
    { key: FILTER_ALL, label: 'All' },
    { key: BOOK_STATUS.READING, label: BOOK_STATUS_LABELS[BOOK_STATUS.READING] },
    { key: BOOK_STATUS.WANT, label: BOOK_STATUS_LABELS[BOOK_STATUS.WANT] },
    { key: BOOK_STATUS.DONE, label: BOOK_STATUS_LABELS[BOOK_STATUS.DONE] },
    { key: FILTER_FAVORITES, label: 'Liked Books' },
];

// MyBooksService.getBooks() returns { ...trackingDoc, bookDetails } (title/
// authors/coverUrl live in the global `books` cache, joined in by the
// service). Flatten to the shape BookCard/hydrateMyBooks already expect.
function flattenShelfDoc(doc) {
    const details = doc.bookDetails || {};
    return {
        id: doc.id,
        bookId: doc.bookId || doc.id,
        title: details.title || null,
        authors: details.authors || [],
        coverUrl: details.coverUrl || null,
        status: doc.status || BOOK_STATUS.READING,
        progress: doc.progressPercentage ?? 0,
        addedAt: doc.addedAt || null,
        rating: doc.rating ?? null,
        notes: doc.notes || null,
    };
}

function groupByMonth(books) {
    const groups = {};
    books.forEach(book => {
        const date = new Date(book.addedAt || Date.now());
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const label = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (!groups[key]) groups[key] = { label, books: [] };
        groups[key].books.push(book);
    });
    return Object.entries(groups)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([, g]) => g);
}

export default function Books({ compact = false, selectedBookId = null }) {
    const { currentUser } = useAuth();
    const uid = currentUser?.uid;
    const navigate = useNavigate();

    const [books, setBooks] = useState([]);
    const [favoriteIds, setFavoriteIds] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

    const [showAddForm, setShowAddForm] = useState(false);
    const [adding, setAdding] = useState(false);
    const [addError, setAddError] = useState(null);

    const [busyId, setBusyId] = useState(null);
    const [viewMode, setViewMode] = useState('grid');
    const [activeFilter, setActiveFilter] = useState(FILTER_ALL);

    const load = useCallback(async () => {
        if (!uid) return;
        setLoading(true);
        setLoadError(null);
        try {
            const [rawMyBooks, favBooks] = await Promise.all([
                MyBooksService.getBooks(uid),
                FavoriteBooksService.getBooks(uid),
            ]);
            const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
            const hydrated = await hydrateMyBooks(rawMyBooks.map(flattenShelfDoc), {
                apiKey,
                onRepair: (bookId, data) => createBookIfMissing(bookId, { ...data, isbn: bookId, addedBy: uid }),
            });

            setBooks(hydrated);
            setFavoriteIds(new Set(favBooks.map(b => b.id)));
        } catch (err) {
            setLoadError(err.message || 'Could not load your books.');
        } finally {
            setLoading(false);
        }
    }, [uid]);

    useEffect(() => { load(); }, [load]);

    async function handleAdd(data) {
        if (!uid) return;
        setAdding(true);
        setAddError(null);
        try {
            const bookId = sanitizeIsbn(data.isbn) || crypto.randomUUID();
            await MyBooksService.saveBookToShelf(uid, {
                bookId,
                title: data.title || null,
                authors: data.authors || [],
                coverUrl: data.coverUrl || null,
                isbn: sanitizeIsbn(data.isbn) || null,
            }, BOOK_STATUS.READING, { progressPercentage: 0 });
            setShowAddForm(false);
            await load();
        } catch (err) {
            setAddError(err.message || 'Could not add this book.');
        } finally {
            setAdding(false);
        }
    }

    async function handleRemove(bookId) {
        if (!uid) return;
        const prev = books;
        setBooks(b => b.filter(book => book.id !== bookId));
        setBusyId(bookId);
        try {
            await MyBooksService.deleteBook(uid, bookId);
        } catch {
            setBooks(prev);
            setLoadError('Could not remove book. Try again.');
        } finally {
            setBusyId(null);
        }
    }

    async function handleRate(bookId, rating) {
        if (!uid) return;
        const newRating = rating === 0 ? null : rating;
        const prev = books;
        setBooks(b => b.map(book => book.id === bookId ? { ...book, rating: newRating } : book));
        setBusyId(bookId);
        try {
            await MyBooksService.updateBook(uid, bookId, { rating: newRating });
        } catch {
            setBooks(prev);
        } finally {
            setBusyId(null);
        }
    }

    async function handleToggleFavorite(bookId) {
        if (!uid) return;
        const wasFav = favoriteIds.has(bookId);
        const next = new Set(favoriteIds);
        if (wasFav) next.delete(bookId); else next.add(bookId);
        setFavoriteIds(next);
        setBusyId(bookId);
        try {
            if (wasFav) {
                await FavoriteBooksService.deleteBook(uid, bookId);
            } else {
                const book = books.find(b => b.id === bookId);
                await FavoriteBooksService.saveBookToShelf(uid, {
                    bookId,
                    title: book?.title || null,
                    authors: book?.authors || [],
                    coverUrl: book?.coverUrl || null,
                });
            }
        } catch (err) {
            console.error('Error toggling favorite:', err);
            setFavoriteIds(favoriteIds);
        } finally {
            setBusyId(null);
        }
    }

    const filteredBooks = books.filter(b => {
        if (activeFilter === FILTER_ALL) return true;
        if (activeFilter === FILTER_FAVORITES) return favoriteIds.has(b.id);
        return (b.status || BOOK_STATUS.READING) === activeFilter;
    });

    const currentlyReading = activeFilter === FILTER_ALL
        ? filteredBooks.filter(b => (b.status || BOOK_STATUS.READING) === BOOK_STATUS.READING)
        : [];
    const rest = activeFilter === FILTER_ALL
        ? filteredBooks.filter(b => (b.status || BOOK_STATUS.READING) !== BOOK_STATUS.READING)
        : filteredBooks;
    const monthGroups = groupByMonth(rest);

    return (
        <div className={`${styles.page} ${compact ? styles.compact : ''}`}>
            {!compact && (
                <div className={styles.header}>
                    <h1 className={styles.title}>Shelf</h1>
                    <div className={styles.headerActions}>
                        <div className={styles.viewToggle} role="group" aria-label="View mode">
                            <button
                                type="button"
                                className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewBtnActive : ''}`}
                                onClick={() => setViewMode('grid')}
                                title="Grid view"
                            >
                                <LayoutGrid size={16} />
                            </button>
                            <button
                                type="button"
                                className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewBtnActive : ''}`}
                                onClick={() => setViewMode('list')}
                                title="List view"
                            >
                                <List size={16} />
                            </button>
                        </div>
                        {!showAddForm && (
                            <button type="button" className={styles.addBtn} onClick={() => setShowAddForm(true)}>
                                <Plus size={16} />
                                Add new book
                            </button>
                        )}
                    </div>
                </div>
            )}

            {!compact && books.length > 0 && (
                <div className={styles.filterBar} role="group" aria-label="Filter books">
                    {FILTERS.map(f => (
                        <button
                            key={f.key}
                            type="button"
                            className={`${styles.filterPill} ${activeFilter === f.key ? styles.filterPillActive : ''}`}
                            onClick={() => setActiveFilter(f.key)}
                        >
                            {f.key === FILTER_FAVORITES && <Heart size={13} />}
                            {f.label}
                        </button>
                    ))}
                </div>
            )}

            <ErrorAlert>{loadError}</ErrorAlert>

            {showAddForm && (
                <AddBookForm
                    onSubmit={handleAdd}
                    onCancel={() => { setShowAddForm(false); setAddError(null); }}
                    submitting={adding}
                    error={addError}
                />
            )}

            {loading ? (
                <SkeletonGrid count={8} />
            ) : books.length === 0 && !showAddForm ? (
                <EmptyState
                    title="Your shelf is empty"
                    message="Start building your reading list by adding your first book."
                    actionLabel="Add your first book"
                    onAction={() => setShowAddForm(true)}
                />
            ) : filteredBooks.length === 0 && !showAddForm ? (
                <EmptyState
                    title="No books here"
                    message="No books match this filter yet."
                />
            ) : viewMode === 'grid' && !compact ? (
                <div className={styles.gridView}>
                    {currentlyReading.length > 0 && (
                        <section>
                            <p className={styles.sectionLabel}>Currently Reading</p>
                            <div className={styles.spotlightGrid}>
                                {currentlyReading.map(book => (
                                    <BookCard
                                        key={book.id}
                                        book={book}
                                        variant="featured"
                                        isSelected={selectedBookId === book.id}
                                        isFavorite={favoriteIds.has(book.id)}
                                        onToggleFavorite={() => handleToggleFavorite(book.id)}
                                        onRemove={() => handleRemove(book.id)}
                                        onEdit={() => navigate(WEB_ROUTES.bookDetail(book.id))}
                                        busy={busyId === book.id}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {rest.length > 0 && (
                        <section>
                            {currentlyReading.length > 0 && <p className={styles.sectionLabel}>On your shelf</p>}
                            <div className={styles.bookGrid}>
                                {rest.map(book => (
                                    <BookCard
                                        key={book.id}
                                        book={book}
                                        variant="grid"
                                        isSelected={selectedBookId === book.id}
                                        isFavorite={favoriteIds.has(book.id)}
                                        onToggleFavorite={() => handleToggleFavorite(book.id)}
                                        onRemove={() => handleRemove(book.id)}
                                        onEdit={() => navigate(WEB_ROUTES.bookDetail(book.id))}
                                        busy={busyId === book.id}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            ) : (
                <>
                    {currentlyReading.length > 0 && (
                        <section>
                            <p className={styles.sectionLabel}>Currently Reading</p>
                            <div className={styles.currentList}>
                                {currentlyReading.map(book => (
                                    <BookCard
                                        key={book.id}
                                        book={book}
                                        variant={compact ? 'grid' : 'featured'}
                                        isSelected={selectedBookId === book.id}
                                        isFavorite={favoriteIds.has(book.id)}
                                        onToggleFavorite={() => handleToggleFavorite(book.id)}
                                        onRemove={() => handleRemove(book.id)}
                                        onEdit={() => navigate(WEB_ROUTES.bookDetail(book.id))}
                                        busy={busyId === book.id}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {monthGroups.map(group => (
                        <section key={group.label}>
                            <p className={styles.sectionLabel}>{group.label}</p>
                            <div className={styles.groupList}>
                                {group.books.map(book => (
                                    <BookCard
                                        key={book.id}
                                        book={book}
                                        variant={compact ? 'grid' : 'row'}
                                        isSelected={selectedBookId === book.id}
                                        isFavorite={favoriteIds.has(book.id)}
                                        onToggleFavorite={() => handleToggleFavorite(book.id)}
                                        onRemove={() => handleRemove(book.id)}
                                        onEdit={() => navigate(WEB_ROUTES.bookDetail(book.id))}
                                        busy={busyId === book.id}
                                    />
                                ))}
                            </div>
                        </section>
                    ))}
                </>
            )}
        </div>
    );
}
