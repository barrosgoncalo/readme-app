import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, LayoutGrid, List } from 'lucide-react';
import { useAuth } from '@readme/shared/src/contexts/AuthContext/web';
import {
    myBooksService,
    favoriteBooksService,
} from '@readme/shared/src/services/books';
import {
    createBookIfMissing,
} from '@readme/shared/src/services/booksCatalog';
import { hydrateMyBooks } from '@readme/shared/src/utils/hydrateMyBooks';
import { sanitizeIsbn } from '@readme/shared/src/utils/isbn';
import { BOOK_STATUS } from '@readme/shared/src/constants/bookStatus';
import Spinner from '../../components/Spinner.jsx';
import ErrorAlert from '../../components/ErrorAlert.jsx';
import Button from '../../components/Button.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { SkeletonGrid } from '../../components/Skeleton.jsx';
import BookCard from './components/BookCard.jsx';
import AddBookForm from './components/AddBookForm.jsx';
import { WEB_ROUTES } from '../../constants/webRoutes.js';
import styles from './Books.module.css';

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

    const load = useCallback(async () => {
        if (!uid) return;
        setLoading(true);
        setLoadError(null);
        try {
            const [rawMyBooks, favIds] = await Promise.all([
                myBooksService.getBooksData(uid),
                favoriteBooksService.getBookIds(uid),
            ]);
            const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
            const hydrated = await hydrateMyBooks(rawMyBooks, {
                apiKey,
                onRepair: (bookId, data) => Promise.all([
                    myBooksService.updateBook(uid, bookId, { title: data.title, authors: data.authors, coverUrl: data.coverUrl }),
                    createBookIfMissing(bookId, { ...data, isbn: bookId, addedBy: uid }),
                ]),
            });

            setBooks(hydrated);
            setFavoriteIds(new Set(favIds));
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
            await createBookIfMissing(bookId, { ...data, isbn: sanitizeIsbn(data.isbn), addedBy: uid });
            await myBooksService.addBook(uid, bookId, {
                status: BOOK_STATUS.READING,
                progress: 0,
                title: data.title || null,
                authors: data.authors || [],
                coverUrl: data.coverUrl || null,
            });
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
            await myBooksService.removeBook(uid, bookId);
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
            await myBooksService.updateBook(uid, bookId, { rating: newRating });
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
            if (wasFav) await favoriteBooksService.removeBook(uid, bookId);
            else await favoriteBooksService.addBook(uid, bookId);
        } catch {
            setFavoriteIds(favoriteIds);
        } finally {
            setBusyId(null);
        }
    }

    const currentlyReading = books.filter(b => (b.status || BOOK_STATUS.READING) === BOOK_STATUS.READING);
    const rest = books.filter(b => (b.status || BOOK_STATUS.READING) !== BOOK_STATUS.READING);
    const monthGroups = groupByMonth(rest);

    return (
        <div className={`${styles.page} ${compact ? styles.compact : ''}`}>
            {!compact && (
                <div className={styles.header}>
                    <h1 className={styles.title}>Your Reading List</h1>
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
            ) : viewMode === 'grid' && !compact ? (
                <div className={styles.bookGrid}>
                    {books.map(book => (
                        <BookCard
                            key={book.id}
                            book={book}
                            variant="grid"
                            isSelected={selectedBookId === book.id}
                            isFavorite={favoriteIds.has(book.id)}
                            onToggleFavorite={() => handleToggleFavorite(book.id)}
                            onRemove={() => handleRemove(book.id)}
                            onRate={(rating) => handleRate(book.id, rating)}
                            onEdit={() => navigate(WEB_ROUTES.bookDetail(book.id))}
                            busy={busyId === book.id}
                        />
                    ))}
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
                                        onRate={(rating) => handleRate(book.id, rating)}
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
                                        onRate={(rating) => handleRate(book.id, rating)}
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
