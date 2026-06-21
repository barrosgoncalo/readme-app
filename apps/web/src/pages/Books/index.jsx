import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAuth } from '@readme/shared/src/contexts/AuthContext/web';
import {
    myBooksService,
    favoriteBooksService,
} from '@readme/shared/src/services/books.web';
import {
    getBook,
    getBookByIsbn,
    getBooksByIds,
    createBookIfMissing,
} from '@readme/shared/src/services/booksCatalog.web';
import { mapGoogleBook } from '@readme/shared/src/models/book';
import { sanitizeIsbn } from '@readme/shared/src/utils/isbn';
import Spinner from '../../components/Spinner.jsx';
import ErrorAlert from '../../components/ErrorAlert.jsx';
import Button from '../../components/Button.jsx';
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

export default function Books() {
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

    const load = useCallback(async () => {
        if (!uid) return;
        setLoading(true);
        setLoadError(null);
        try {
            const [rawMyBooks, favIds] = await Promise.all([
                myBooksService.getBooksData(uid),
                favoriteBooksService.getBooks(uid),
            ]);
            const myIds = rawMyBooks.map(d => d.id);
            const myBooksMap = Object.fromEntries(rawMyBooks.map(m => [m.id, m]));

            let catalogMap = {};
            try {
                const catalogDocs = await getBooksByIds(myIds);
                catalogDocs.forEach(c => { catalogMap[c.id] = c; });
            } catch (err) {
                console.error('[Books] batch catalog fetch failed, trying individual:', err);
            }
            // For any book still missing metadata, try a direct getDoc as fallback
            const missingIds = myIds.filter(id => !catalogMap[id]);
            if (missingIds.length > 0) {
                const settled = await Promise.allSettled(missingIds.map(id => getBook(id)));
                settled.forEach((res, i) => {
                    if (res.status === 'fulfilled' && res.value) {
                        catalogMap[missingIds[i]] = res.value;
                    }
                });
            }

            const hydrated = myIds.map(id => {
                const my = myBooksMap[id];
                const cat = catalogMap[id];
                return {
                    id,
                    title: cat?.title || my?.title || null,
                    authors: cat?.authors || my?.authors || [],
                    coverUrl: cat?.coverUrl || my?.coverUrl || null,
                    description: cat?.description || null,
                    status: my?.status || 'reading',
                    progress: my?.progress ?? 0,
                    addedAt: my?.addedAt || null,
                    rating: my?.rating ?? null,
                    notes: my?.notes || null,
                    availableForTrade: my?.availableForTrade ?? false,
                };
            });

            // Repair legacy books: if a book still has no title and its ID looks like an
            // ISBN, try the global cache by ISBN first, then fall back to Google Books.
            const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
            const needsRepair = hydrated.filter(b => !b.title && /^\d{10,13}$/.test(b.id));
            if (needsRepair.length > 0) {
                await Promise.allSettled(needsRepair.map(async b => {
                    try {
                        let title, authors, coverUrl, description;

                        // Cache check first
                        const cached = await getBookByIsbn(b.id);
                        if (cached?.title) {
                            ({ title, authors, coverUrl, description } = cached);
                            authors = authors || [];
                        } else if (apiKey) {
                            const res = await fetch(
                                `https://www.googleapis.com/books/v1/volumes?q=isbn:${b.id}&maxResults=1&key=${apiKey}`
                            );
                            const json = await res.json();
                            const item = json.items?.[0];
                            if (!item) return;
                            const mapped = mapGoogleBook(item);
                            if (!mapped.title || mapped.title === 'Unknown Title') return;
                            title = mapped.title;
                            authors = mapped.authors;
                            coverUrl = mapped.coverUrl;
                            description = mapped.description;
                        } else {
                            return;
                        }

                        const idx = hydrated.findIndex(h => h.id === b.id);
                        if (idx !== -1) {
                            hydrated[idx] = { ...hydrated[idx], title, authors, coverUrl, description };
                        }
                        // Backfill so next load is instant
                        myBooksService.updateBook(uid, b.id, { title, authors, coverUrl }).catch(() => {});
                        createBookIfMissing(b.id, { title, authors, coverUrl, description, isbn: b.id, addedBy: uid }).catch(() => {});
                    } catch { /* ignore — display stays as placeholder */ }
                }));
            }

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
                status: 'reading',
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

    const currentlyReading = books.filter(b => (b.status || 'reading') === 'reading');
    const rest = books.filter(b => (b.status || 'reading') !== 'reading');
    const monthGroups = groupByMonth(rest);

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Your Reading List</h1>
                {!showAddForm && (
                    <button type="button" className={styles.addBtn} onClick={() => setShowAddForm(true)}>
                        <Plus size={16} />
                        Add new book
                    </button>
                )}
            </div>

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
                <Spinner center label="Loading your books" />
            ) : books.length === 0 && !showAddForm ? (
                <div className={styles.empty}>
                    <p className={styles.emptyTitle}>Your shelf is empty</p>
                    <p className={styles.emptyText}>Start building your reading list by adding your first book.</p>
                    <div style={{ maxWidth: 240, margin: '20px auto 0' }}>
                        <Button onClick={() => setShowAddForm(true)}>Add your first book</Button>
                    </div>
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
                                        variant="featured"
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
                                        variant="row"
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
