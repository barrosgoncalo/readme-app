import { useState, useEffect } from 'react';
import { Search, BookOpen, X } from 'lucide-react';
import Field from '../../../components/Field.jsx';
import Button from '../../../components/Button.jsx';
import ErrorAlert from '../../../components/ErrorAlert.jsx';
import Spinner from '../../../components/Spinner.jsx';
import styles from './AddBookForm.module.css';

const BOOKS_API_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;

async function searchGoogleBooks(query) {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=8&printType=books&key=${BOOKS_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Search failed (${res.status}).`);
    const data = await res.json();
    return data.items || [];
}

function extractBookData(item) {
    const info = item.volumeInfo || {};
    const identifiers = info.industryIdentifiers || [];
    const isbn13 = identifiers.find((id) => id.type === 'ISBN_13')?.identifier || null;
    const isbn10 = identifiers.find((id) => id.type === 'ISBN_10')?.identifier || null;
    const isbn = isbn13 || isbn10;
    const coverUrl = info.imageLinks?.thumbnail?.replace('http://', 'https://') || null;
    return {
        isbn,
        title: info.title || '',
        authors: info.authors || [],
        coverUrl,
    };
}

export default function AddBookForm({ onSubmit, onCancel, submitting, error }) {
    const [mode, setMode] = useState('search'); // 'search' | 'manual'
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState(null);
    const [selected, setSelected] = useState(null);

    // Manual mode fields
    const [isbn, setIsbn] = useState('');
    const [title, setTitle] = useState('');
    const [authors, setAuthors] = useState('');
    const [coverUrl, setCoverUrl] = useState('');

    useEffect(() => {
        if (mode !== 'search') return;
        const q = query.trim();
        if (!q) { setResults([]); return; }
        const timer = setTimeout(async () => {
            setSearching(true);
            setSearchError(null);
            try {
                setResults(await searchGoogleBooks(q));
            } catch (err) {
                setSearchError(err.message || 'Search failed. Check your connection.');
            } finally {
                setSearching(false);
            }
        }, 350);
        return () => clearTimeout(timer);
    }, [query, mode]);

    function handleSelect(item) {
        setSelected(extractBookData(item));
        setResults([]);
        setQuery('');
    }

    function handleConfirm() {
        if (!selected) return;
        onSubmit(selected);
    }

    function handleManualSubmit(e) {
        e.preventDefault();
        if (!title.trim() || !authors.trim() || submitting) return;
        onSubmit({
            isbn: isbn.trim() || null,
            title: title.trim(),
            authors: authors.split(',').map((a) => a.trim()).filter(Boolean),
            coverUrl: coverUrl.trim() || null,
        });
    }

    return (
        <div className={styles.form}>
            {mode === 'search' && !selected && (
                <>
                    <div className={styles.searchRow}>
                        <Search size={16} className={styles.searchIcon} aria-hidden />
                        <input
                            className={styles.searchInput}
                            type="text"
                            placeholder="Search by title, author, or ISBN…"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            autoFocus
                        />
                        {searching && <Spinner size={16} />}
                    </div>

                    {searchError && <ErrorAlert>{searchError}</ErrorAlert>}

                    {results.length > 0 && (
                        <ul className={styles.results}>
                            {results.map((item) => {
                                const info = item.volumeInfo || {};
                                const thumb = info.imageLinks?.thumbnail?.replace('http://', 'https://');
                                return (
                                    <li key={item.id}>
                                        <button
                                            type="button"
                                            className={styles.resultItem}
                                            onClick={() => handleSelect(item)}
                                        >
                                            {thumb ? (
                                                <img src={thumb} alt="" className={styles.resultThumb} />
                                            ) : (
                                                <div className={`${styles.resultThumb} ${styles.thumbPlaceholder}`} aria-hidden>
                                                    <BookOpen size={16} />
                                                </div>
                                            )}
                                            <div className={styles.resultInfo}>
                                                <span className={styles.resultTitle}>{info.title || 'Untitled'}</span>
                                                <span className={styles.resultAuthors}>
                                                    {info.authors?.join(', ') || 'Unknown author'}
                                                </span>
                                            </div>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    {query.trim() && !searching && results.length === 0 && !searchError && (
                        <p className={styles.noResults}>No results found.</p>
                    )}

                    <div className={styles.footer}>
                        <button type="button" className={styles.modeLink} onClick={() => setMode('manual')}>
                            Enter details manually instead
                        </button>
                        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
                    </div>
                </>
            )}

            {mode === 'search' && selected && (
                <>
                    <div className={styles.selectedCard}>
                        {selected.coverUrl ? (
                            <img src={selected.coverUrl} alt="" className={styles.selectedCover} />
                        ) : (
                            <div className={`${styles.selectedCover} ${styles.thumbPlaceholder}`} aria-hidden>
                                <BookOpen size={24} />
                            </div>
                        )}
                        <div className={styles.selectedInfo}>
                            <p className={styles.selectedTitle}>{selected.title}</p>
                            <p className={styles.selectedAuthors}>{selected.authors.join(', ') || 'Unknown author'}</p>
                        </div>
                        <button type="button" className={styles.clearSelected} onClick={() => setSelected(null)} title="Choose a different book">
                            <X size={16} />
                        </button>
                    </div>

                    <ErrorAlert>{error}</ErrorAlert>

                    <div className={styles.actions}>
                        <Button variant="ghost" onClick={onCancel} disabled={submitting}>Cancel</Button>
                        <Button onClick={handleConfirm} disabled={submitting}>
                            {submitting ? 'Adding…' : 'Add to My Books'}
                        </Button>
                    </div>
                </>
            )}

            {mode === 'manual' && (
                <form onSubmit={handleManualSubmit} style={{ display: 'contents' }}>
                    <Field label="ISBN (optional)" value={isbn} onChange={setIsbn} placeholder="9780000000000" />
                    <Field label="Title" value={title} onChange={setTitle} required />
                    <Field label="Authors" value={authors} onChange={setAuthors} placeholder="Comma-separated" required />
                    <Field label="Cover URL (optional)" value={coverUrl} onChange={setCoverUrl} placeholder="https://…" />
                    <ErrorAlert>{error}</ErrorAlert>
                    <div className={styles.footer}>
                        <button type="button" className={styles.modeLink} onClick={() => setMode('search')}>
                            Search instead
                        </button>
                    </div>
                    <div className={styles.actions}>
                        <Button variant="ghost" onClick={onCancel} disabled={submitting}>Cancel</Button>
                        <Button type="submit" disabled={!title.trim() || !authors.trim() || submitting}>
                            {submitting ? 'Adding…' : 'Add book'}
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );
}
