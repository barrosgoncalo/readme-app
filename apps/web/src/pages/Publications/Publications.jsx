import { useState, useEffect } from 'react';
import { Search as IconLucideSearch, BookOpen as IconLucideBook, X as IconLucideX, Trash2 as IconLucideTrash } from 'lucide-react';
import { DB } from '@readme/shared/src/services/DB.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import Pagination from '../../components/Pagination.jsx';
import styles from './Publications.module.css';

const PAGE_SIZE_DEFAULT = 10;

export default function Publications() {
    const [allPublications, setAllPublications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);
    const [selectedPub, setSelectedPub] = useState(null); // Holds the publication to "open" in detail modal
    const [deletingId, setDeletingId] = useState(null);

    // Fetch publications ordered by title
    useEffect(() => {
        const fetchPublications = async () => {
            try {
                // Fetch using your DB wrapper
                const fetchedData = await DB.getOrderedBy('publications', { field: 'title' });
                // Maps standard document 'id' to 'uid' or keeps 'id'
                setAllPublications(fetchedData.map(pub => ({ ...pub, id: pub.id })));
            } catch (err) {
                console.error('Error fetching publications:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchPublications();
    }, []);

    // Admin action: Delete a publication
    const handleDelete = async (pubId) => {
        if (!window.confirm('Are you sure you want to delete this publication? This action cannot be undone.')) return;
        
        setDeletingId(pubId);
        try {
            // Adjust this call to your DB wrapper's delete method (e.g. DB.delete('publications', pubId))
            await DB.delete('publications', pubId); 
            setAllPublications(prev => prev.filter(p => p.id !== pubId));
            setSelectedPub(null); // Close modal if open
        } catch (err) {
            console.error('Failed to delete publication:', err);
        } finally {
            setDeletingId(null);
        }
    };

    // Client-side search filtering
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

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

    const handleSearch = (val) => { setSearch(val); setPage(1); };
    const handlePageSize = (val) => { setPageSize(val); setPage(1); };

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Publications</h1>
                    <p className={styles.subtitle}>Monitor books put up for trade by users.</p>
                </div>
            </div>

            <div className={styles.card}>
                <div className={styles.toolbar}>
                    <div className={styles.searchWrapper}>
                        <IconLucideSearch size={15} className={styles.searchIcon} />
                        <input
                            className={styles.searchInput}
                            placeholder="Search by title, author, owner, or genre..."
                            value={search}
                            onChange={e => handleSearch(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className={styles.empty}>Loading publications…</div>
                ) : paged.length === 0 ? (
                    <div className={styles.empty}>No publications found.</div>
                ) : (
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
                            {paged.map(pub => (
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

                <Pagination
                    page={page}
                    totalPages={totalPages}
                    total={filtered.length}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={handlePageSize}
                />
            </div>

            {/* Publication Detail Modal / Drawer */}
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
