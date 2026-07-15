import { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { alterUserPrivileges } from '@readme/shared/src/services/admin';
import StatusBadge from '../../components/StatusBadge.jsx';
import Pagination from '../../components/Pagination.jsx';
import styles from './AdminDashboard.module.css';

const PAGE_SIZE_DEFAULT = 10;

export default function AdminDashboard() {
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);

    const db = getFirestore();
    const auth = getAuth();

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const q = query(collection(db, 'users'), orderBy('fullName'));
                const snap = await getDocs(q);
                setAllUsers(snap.docs.map(doc => ({ uid: doc.id, ...doc.data() })));
            } catch (err) {
                console.error('Error fetching users:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, [db]);

    const handleRoleChange = async (targetUid, currentRole) => {
        const makeAdmin = currentRole !== 'admin';
        setActionLoading(targetUid);
        try {
            const result = await alterUserPrivileges(targetUid, makeAdmin);
            if (result.success) {
                setAllUsers(prev =>
                    prev.map(u => u.uid === targetUid ? { ...u, role: makeAdmin ? 'admin' : 'user' } : u)
                );
            }
        } catch (err) {
            console.error('Role change failed:', err.code, err.message, err.details);
        } finally {
            setActionLoading(null);
        }
    };

    const filtered = allUsers.filter(u => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            (u.fullName || '').toLowerCase().includes(q) ||
            (u.username || '').toLowerCase().includes(q) ||
            (u.email || '').toLowerCase().includes(q)
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
                    <h1 className={styles.title}>Users</h1>
                    <p className={styles.subtitle}>Manage user accounts and roles.</p>
                </div>
            </div>

            <div className={styles.card}>
                <div className={styles.toolbar}>
                    <div className={styles.searchWrapper}>
                        <IconLucideSearch size={15} className={styles.searchIcon} />
                        <input
                            className={styles.searchInput}
                            placeholder="Search users..."
                            value={search}
                            onChange={e => handleSearch(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className={styles.empty}>Loading users…</div>
                ) : paged.length === 0 ? (
                    <div className={styles.empty}>No users found.</div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paged.map(user => (
                                <tr key={user.uid}>
                                    <td>
                                        <div className={styles.userCell}>
                                            <div className={styles.avatar}>
                                                {user.photoURL
                                                    ? <img src={user.photoURL} alt="" className={styles.avatarImg} />
                                                    : <IconLucideUser size={16} />
                                                }
                                            </div>
                                            <div>
                                                <div className={styles.userName}>{user.fullName || user.username || 'Unnamed User'}</div>
                                                {user.username && <div className={styles.userHandle}>@{user.username}</div>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className={styles.emailCell}>{user.userId || user.email || '—'}</td>
                                    <td><StatusBadge status={user.role || 'user'} /></td>
                                    <td>
                                        {user.uid === auth.currentUser?.uid ? (
                                            <span className={styles.youLabel}>You</span>
                                        ) : (
                                            <button
                                                className={user.role === 'admin' ? `${styles.actionBtn} ${styles.demote}` : `${styles.actionBtn} ${styles.promote}`}
                                                disabled={actionLoading !== null}
                                                onClick={() => handleRoleChange(user.uid, user.role)}
                                            >
                                                {actionLoading === user.uid
                                                    ? 'Saving…'
                                                    : user.role === 'admin' ? 'Demote' : 'Promote'
                                                }
                                            </button>
                                        )}
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
        </div>
    );
}

