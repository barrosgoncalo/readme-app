import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '@readme/shared/src/contexts/AuthContext/web';
import {
    myBooksService,
    favoriteBooksService,
} from '@readme/shared/src/services/books.web';
import {
    getBooksByIds,
    createBookIfMissing,
} from '@readme/shared/src/services/booksCatalog.web';
import Spinner from '../../components/Spinner.jsx';
import ErrorAlert from '../../components/ErrorAlert.jsx';
import Button from '../../components/Button.jsx';
import BookCard from './components/BookCard.jsx';
import AddBookForm from './components/AddBookForm.jsx';
import styles from './Books.module.css';

// ISBN-13 digits only — minimal sanitization so Firestore ID is safe.
function sanitizeIsbn(isbn) {
    if (!isbn) return null;
    const stripped = isbn.replace(/[^0-9Xx]/g, '');
    return stripped || null;
}

export default function Books() {
    const { currentUser } = useAuth();
    const uid = currentUser?.uid;

    const [books, setBooks] = useState([]);              // hydrated catalog docs
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
            const [myIds, favIds] = await Promise.all([
                myBooksService.getBooks(uid),
                favoriteBooksService.getBooks(uid),
            ]);
            const catalogDocs = await getBooksByIds(myIds);
            // Render any orphan myBooks ids (no catalog doc) as degraded entries.
            const present = new Set(catalogDocs.map((b) => b.id));
            const orphans = myIds.filter((id) => !present.has(id))
                .map((id) => ({ id, title: null, authors: [], coverUrl: null }));
            setBooks([...catalogDocs, ...orphans]);
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
            await myBooksService.addBook(uid, bookId);
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
        setBooks((b) => b.filter((book) => book.id !== bookId));
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
            if (wasFav) {
                await favoriteBooksService.removeBook(uid, bookId);
            } else {
                await favoriteBooksService.addBook(uid, bookId);
            }
        } catch {
            setFavoriteIds(favoriteIds);
            setLoadError('Could not update favorite. Try again.');
        } finally {
            setBusyId(null);
        }
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>My Books</h1>
                {!showAddForm && books.length > 0 && (
                    <button type="button" className={styles.addBtn} onClick={() => setShowAddForm(true)}>
                        <Plus size={16} /> Add a book
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
                    <p className={styles.emptyTitle}>No books yet</p>
                    <p>Start your shelf by adding your first book.</p>
                    <div style={{ maxWidth: 240, margin: '16px auto 0' }}>
                        <Button onClick={() => setShowAddForm(true)}>Add your first book</Button>
                    </div>
                </div>
            ) : (
                <div className={styles.list}>
                    {books.map((book) => (
                        <BookCard
                            key={book.id}
                            book={book}
                            isFavorite={favoriteIds.has(book.id)}
                            onToggleFavorite={() => handleToggleFavorite(book.id)}
                            onRemove={() => handleRemove(book.id)}
                            busy={busyId === book.id}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
