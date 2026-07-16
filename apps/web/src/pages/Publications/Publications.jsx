import { useState } from 'react';
import { Search as IconLucideSearch, BookOpen as IconLucideBook, X as IconLucideX, Trash2 as IconLucideTrash } from 'lucide-react';
import { DB } from '@readme/shared/src/services/DB.js';
// 1. Import your shared hook
import { useExploreFeed } from '@readme/shared/src/hooks/use-explore-feed';
import StatusBadge from '../../components/StatusBadge.jsx';
import styles from './Publications.module.css';

export default function Publications() {
    const [search, setSearch] = useState('');
    const [selectedPub, setSelectedPub] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    // 2. Consume the shared hook instead of manual useEffect
    const {
        items: allPublications,
        isLoadingInitial,
        isLoadingMore,
        loadMore,
        refresh
    } = useExploreFeed({
        // You can enforce an admin default sort here if you want
        sortBy: 'DATE_DESC', 
    });

    // Admin action: Delete a publication
    const handleDelete = async (pubId) => {
        if (!window.confirm('Are you sure you want to delete this publication? This action cannot be undone.')) return;
        
        setDeletingId(pubId);
        try {
            await DB.delete('publications', pubId); 
            // 3. Call refresh() from your hook to update the list after deletion
            refresh();
            setSelectedPub(null); 
        } catch (err) {
            console.error('Failed to delete publication:', err);
        } finally {
            setDeletingId(null);
        }
    };

    // Client-side search filtering (Note: this only filters items currently loaded by the feed)
    const filtered = allPublications.filter(pub => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            (pub.title || '').toLowerCase().includes(q) ||
            (pub.author || '').toLowerCase().includes(q) ||
            (pub.ownerName || '').toLowerCase().includes(q) ||
            (pub.genre || '').toLowerCase().includes(q)
        );
    });

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                {/* ... header content stays the same ... */}
            </div>

            <div className={styles.card}>
                <div className={styles.toolbar}>
                    <div className={styles.searchWrapper}>
                        <IconLucideSearch size={15} className={styles.searchIcon} />
                        <input
                            className={styles.searchInput}
                            placeholder="Search by title, author, owner, or genre..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {isLoadingInitial ? (
                    <div className={styles.empty}>Loading publications…</div>
                ) : allPublications.length === 0 ? (
                    // 1. Check if the database has NO books at all
                    <div className={styles.empty}>No publications available in the database.</div>
                ) : (
                    <>
                        {filtered.length === 0 ? (
                            // 2. Check if the CURRENT search yields no results in loaded data
                            <div className={styles.empty}>
                                No matching publications in currently loaded data. Try loading more!
                            </div>
                        ) : (
                            // 3. Render the table if we have matches
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Book Title</th>
                                        <th>Author</th>
                                        <th>Genre</th>
                                        <th>Owner</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(pub => (
                                        <tr key={pub.id}>
                                            <td>
                                                <div className={styles.bookCell}>
                                                    <div className={styles.cover}>
                                                        {pub.coverURL ? (
                                                            <img src={pub.coverURL} alt="" className={styles.coverImg} />
                                                        ) : (
                                                            <IconLucideBook size={16} />
                                                        )}
                                                    </div>
                                                    <span className={styles.bookTitle}>{pub.title || 'Untitled'}</span>
                                                </div>
                                            </td>
                                            <td className={styles.textCell}>{pub.author || '—'}</td>
                                            <td className={styles.textCell}>
                                                <span className={styles.genreTag}>{pub.genre || 'General'}</span>
                                            </td>
                                            <td className={styles.ownerCell}>{pub.ownerName || 'Unknown'}</td>
                                            <td><StatusBadge status={pub.status || 'available'} /></td>
                                            <td>
                                                <button 
                                                    className={styles.openBtn}
                                                    onClick={() => setSelectedPub(pub)}
                                                >
                                                    Open
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        
                        {/* 4. Keep Load More OUTSIDE the filtered check so it's always accessible */}
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <button 
                                onClick={loadMore} 
                                disabled={isLoadingMore}
                                className={styles.loadMoreBtn} 
                            >
                                {isLoadingMore ? 'Loading...' : 'Load More'}
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Publication Detail Modal - (Unchanged) */}
            {selectedPub && (
                <div className={styles.modalOverlay} onClick={() => setSelectedPub(null)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>Publication Details</h2>
                            <button className={styles.closeBtn} onClick={() => setSelectedPub(null)}>
                                <IconLucideX size={18} />
                            </button>
                        </div>
                        
                        <div className={styles.modalBody}>
                            <div className={styles.detailCoverSection}>
                                <div className={styles.largeCover}>
                                    {selectedPub.coverURL ? (
                                        <img src={selectedPub.coverURL} alt="" />
                                    ) : (
                                        <IconLucideBook size={48} />
                                    )}
                                </div>
                                <div className={styles.detailTitleBlock}>
                                    <h3>{selectedPub.title}</h3>
                                    <p className={styles.detailAuthor}>by {selectedPub.author || 'Unknown'}</p>
                                    <StatusBadge status={selectedPub.status || 'available'} />
                                </div>
                            </div>

                            <hr className={styles.divider} />

                            <div className={styles.metaGrid}>
                                <div>
                                    <span className={styles.metaLabel}>Genre</span>
                                    <p className={styles.metaValue}>{selectedPub.genre || '—'}</p>
                                </div>
                                <div>
                                    <span className={styles.metaLabel}>Condition</span>
                                    <p className={styles.metaValue}>{selectedPub.condition || 'Good'}</p>
                                </div>
                                <div>
                                    <span className={styles.metaLabel}>Owner</span>
                                    <p className={styles.metaValue}>{selectedPub.ownerName || '—'}</p>
                                </div>
                                <div>
                                    <span className={styles.metaLabel}>Owner Email</span>
                                    <p className={styles.metaValue}>{selectedPub.ownerEmail || '—'}</p>
                                </div>
                            </div>

                            <div className={styles.descriptionBlock}>
                                <span className={styles.metaLabel}>Description / Notes</span>
                                <p className={styles.descriptionText}>
                                    {selectedPub.description || 'No description provided by the user.'}
                                </p>
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <button 
                                className={styles.deleteActionBtn} 
                                onClick={() => handleDelete(selectedPub.id)}
                                disabled={deletingId !== null}
                            >
                                <IconLucideTrash size={16} />
                                {deletingId === selectedPub.id ? 'Deleting...' : 'Remove Publication'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
