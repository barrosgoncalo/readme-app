import { useState } from 'react';
import { Search, BookOpen, X, Sparkles, ChevronRight, PenLine } from 'lucide-react';
import Field from '../../../components/Field.jsx';
import Button from '../../../components/Button.jsx';
import ErrorAlert from '../../../components/ErrorAlert.jsx';
import Spinner from '../../../components/Spinner.jsx';
import { useBookSearch } from '@readme/shared/src/hooks/use-book-search.js';
import styles from './AddBookForm.module.css';
import { GOOGLE_BOOKS_API_KEY } from '@readme/shared/src/constants/env';
import { normalizeAnyBook } from '@readme/shared/src/models/book'

export default function AddBookForm({ onSubmit, onCancel, submitting, error }) {
    const {
        searchQuery: query,
        setSearchQuery: setQuery,
        searchResults: results,
        isLoading: searching,
        error: searchError
    } = useBookSearch(GOOGLE_BOOKS_API_KEY);

    const [mode, setMode] = useState('search');
    const [selected, setSelected] = useState(null);

    const [isbn, setIsbn] = useState('');
    const [title, setTitle] = useState('');
    const [authors, setAuthors] = useState('');
    const [coverUrl, setCoverUrl] = useState('');
    const [pageCount, setPageCount] = useState('');

    function handleSelect(item) {
        setSelected(normalizeAnyBook(item));
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
            pageCount: parseInt(pageCount, 10) || null,
        });
    }

    function switchMode(next) {
        setMode(next);
        setSelected(null);
    }

    return (
        <div className={styles.form}>
            <div className={styles.formHeader}>
                <div className={styles.formHeading}>
                    <span className={styles.formHeadingIcon}><BookOpen size={18}/></span>
                    <div>
                        <h2 className={styles.formTitle}>Add a book</h2>
                        <p className={styles.formSubtitle}>Search our catalog or enter the details yourself.</p>
                    </div>
                </div>
                <button type="button" className={styles.closeBtn} onClick={onCancel} aria-label="Close">
                    <X size={18}/>
                </button>
            </div>

            <div className={styles.tabs} role="tablist">
                <button
                    type="button"
                    role="tab"
                    aria-selected={mode === 'search'}
                    className={`${styles.tab} ${mode === 'search' ? styles.tabActive : ''}`}
                    onClick={() => switchMode('search')}
                >
                    <Search size={15}/> Search
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={mode === 'manual'}
                    className={`${styles.tab} ${mode === 'manual' ? styles.tabActive : ''}`}
                    onClick={() => switchMode('manual')}
                >
                    <PenLine size={15}/> Manual entry
                </button>
            </div>

            {mode === 'search' && !selected && (
                <>
                    <div className={`${styles.searchRow} ${searching ? styles.searchRowBusy : ''}`}>
                        <Search size={18} className={styles.searchIcon} aria-hidden/>
                        <input
                            className={styles.searchInput}
                            type="text"
                            placeholder="Search by title, author, or ISBN…"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            autoFocus
                        />
                        {searching && <Spinner size={16}/>}
                        {!searching && query && (
                            <button type="button" className={styles.clearQuery} onClick={() => setQuery('')}
                                    aria-label="Clear search">
                                <X size={15}/>
                            </button>
                        )}
                    </div>

                    {searchError && <ErrorAlert>{searchError}</ErrorAlert>}

                    {results.length > 0 && (
                        <ul className={styles.results}>
                            {results.map((item) => {
                                // Use our new normalizer so the UI always gets the data it expects
                                const info = normalizeAnyBook(item);
                                const thumb = info.coverUrl?.replace('http://', 'https://');
                                const year = info.publishedYear;
                                
                                return (
                                    <li key={item.id || info.isbn || Math.random()}>
                                        <button
                                            type="button"
                                            className={styles.resultItem}
                                            onClick={() => handleSelect(item)}
                                        >
                                            {thumb ? (
                                                <img src={thumb} alt="" className={styles.resultThumb}/>
                                            ) : (
                                                <div className={`${styles.resultThumb} ${styles.thumbPlaceholder}`}
                                                     aria-hidden>
                                                    <BookOpen size={16}/>
                                                </div>
                                            )}
                                            <div className={styles.resultInfo}>
                                                <span className={styles.resultTitle}>{info.title}</span>
                                                <span className={styles.resultAuthors}>
                                                    {info.authors?.length > 0 ? info.authors.join(', ') : 'Unknown author'}
                                                </span>
                                                {year && <span className={styles.resultYear}>{year}</span>}
                                            </div>
                                            <ChevronRight size={18} className={styles.resultChevron} aria-hidden/>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    {!query.trim() && (
                        <div className={styles.hint}>
                            <span className={styles.hintIcon}><Sparkles size={22}/></span>
                            <p className={styles.hintTitle}>Find your next read</p>
                            <p className={styles.hintText}>Start typing a title, author, or ISBN to search millions of
                                books.</p>
                        </div>
                    )}

                    {query.trim() && !searching && results.length === 0 && !searchError && (
                        <div className={styles.hint}>
                            <span className={styles.hintIcon}><BookOpen size={22}/></span>
                            <p className={styles.hintTitle}>No results found</p>
                            <p className={styles.hintText}>
                                Try a different search, or{' '}
                                <button type="button" className={styles.inlineLink}
                                        onClick={() => switchMode('manual')}>
                                    add it manually
                                </button>
                                .
                            </p>
                        </div>
                    )}
                </>
            )}

            {mode === 'search' && selected && (
                <>
                    <div className={styles.selectedCard}>
                        <div className={styles.selectedCoverWrap}>
                            {selected.coverUrl ? (
                                <img src={selected.coverUrl} alt="" className={styles.selectedCover}/>
                            ) : (
                                <div className={`${styles.selectedCover} ${styles.thumbPlaceholder}`} aria-hidden>
                                    <BookOpen size={28}/>
                                </div>
                            )}
                        </div>
                        <div className={styles.selectedInfo}>
                            <span className={styles.selectedBadge}>Selected</span>
                            <p className={styles.selectedTitle}>{selected.title}</p>
                            <p className={styles.selectedAuthors}>{selected.authors?.join(', ') || 'Unknown author'}</p>
                            {selected.publishedYear &&
                                <p className={styles.selectedMeta}>Published {selected.publishedYear}</p>}
                        </div>
                        <button type="button" className={styles.clearSelected} onClick={() => setSelected(null)}
                                title="Choose a different book">
                            <X size={16}/>
                        </button>
                    </div>

                    <ErrorAlert>{error}</ErrorAlert>

                    <div className={styles.actions}>
                        <Button variant="ghost" onClick={() => setSelected(null)} disabled={submitting}>Back</Button>
                        <Button onClick={handleConfirm} disabled={submitting}>
                            {submitting ? 'Adding…' : 'Add to My Books'}
                        </Button>
                    </div>
                </>
            )}

            {mode === 'manual' && (
                <form onSubmit={handleManualSubmit} className={styles.manualForm}>
                    <Field label="Title" value={title} onChange={setTitle} required/>
                    <Field label="Authors" value={authors} onChange={setAuthors} placeholder="Comma-separated"
                           required/>
                    <div className={styles.manualRow}>
                        <Field label="ISBN (optional)" value={isbn} onChange={setIsbn} placeholder="9780000000000"/>
                        <Field label="Cover URL (optional)" value={coverUrl} onChange={setCoverUrl}
                               placeholder="https://…"/>
                    </div>
                    <Field label="Page Count (optional)" type="number" value={pageCount} onChange={setPageCount}
                           placeholder="Ex: 350"/>
                    <ErrorAlert>{error}</ErrorAlert>
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
