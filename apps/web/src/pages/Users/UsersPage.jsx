import { useState, useEffect, useRef } from 'react';
import { getAuth } from 'firebase/auth';
import { alterUserPrivileges } from '@readme/shared/src/services/admin';
import {Search, User, Eye, DownloadIcon} from 'lucide-react';
import {DB} from '@readme/shared/src/services/DB.js';
import {searchUsers} from '@readme/shared/src/services/searchUser.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import Pagination from '../../components/Pagination.jsx';
import UserDetailModal from '../../components/UserDetailModal.jsx';
import styles from './UsersPage.module.css';

const CSV_COLUMNS = [
    { header: 'Full Name', get: (u) => u.fullName || '' },
    { header: 'Username', get: (u) => u.username || '' },
    { header: 'Email', get: (u) => u.userId || u.email || '' },
    { header: 'Role', get: (u) => u.role || 'user' },
    { header: 'Account Status', get: (u) => u.accountStatus || '' },
    { header: 'UID', get: (u) => u.uid },
];

const escapeCsvCell = (value) => {
    const str = String(value ?? '');
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

const exportUsersToCsv = (users) => {
    const rows = [
        CSV_COLUMNS.map((c) => c.header),
        ...users.map((u) => CSV_COLUMNS.map((c) => escapeCsvCell(c.get(u)))),
    ];
    const csv = rows.map((row) => row.join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `users-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
};

const PAGE_SIZE_DEFAULT = 10;

export default function UsersPage() {
    const [displayedUsers, setDisplayedUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);
    const [viewUser, setViewUser] = useState(null);
    const [totalUsers, setTotalUsers] = useState(0);

    const lastVisibleDocs = useRef({});

    const auth = getAuth();

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
            lastVisibleDocs.current = {};
        }, 150);
        return () => clearTimeout(handler);
    }, [search]);

    useEffect(() => {
        let isMounted = true;

        const loadUsers = async () => {
            setLoading(true);
            try {
                if (debouncedSearch.trim()) {
                    const {users, nbHits} = await searchUsers(debouncedSearch, {
                        page: page - 1,
                        hitsPerPage: pageSize
                    });

                    if (isMounted) {
                        setDisplayedUsers(users);
                        setTotalUsers(nbHits);
                    }
                } else {
                    const total = await DB.count('users');
                    const cursor = page > 1 ? lastVisibleDocs.current[page - 1] : null;

                    const result = await DB.getPaginated(
                        'users',
                        {field: 'fullName', direction: 'asc'},
                        pageSize,
                        cursor
                    );

                    if (isMounted) {
                        setDisplayedUsers(result.docs);
                        setTotalUsers(total);
                        lastVisibleDocs.current[page] = result.lastVisible;
                    }
                }
            } catch (err) {
                console.error('Error fetching users:', err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadUsers();

        return () => {
            isMounted = false;
        };
    }, [debouncedSearch, page, pageSize]);

    const handleRoleChange = async (targetUid, currentRole) => {
        const makeAdmin = currentRole !== 'admin';
        setActionLoading(targetUid);
        try {
            const result = await alterUserPrivileges(targetUid, makeAdmin);
            if (result.data.success) {
                setDisplayedUsers(prev =>
                    prev.map(u => u.uid === targetUid ? {...u, role: makeAdmin ? 'admin' : 'user'} : u)
                );
            }
        } catch (err) {
            console.error('Role change failed:', err.code, err.message, err.details);
        } finally {
            setActionLoading(null);
        }
    };

    const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize));

    const handleSearch = (val) => {
        setSearch(val);
    };

    const handlePageSize = (val) => {
        setPageSize(val);
        setPage(1);
        lastVisibleDocs.current = {};
    };

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Users</h1>
                    <p className={styles.subtitle}>Manage user accounts and roles.</p>
                </div>
                <button type="button" className={styles.exportBtn} onClick={() => exportUsersToCsv(totalUsers)}>
                    <DownloadIcon size={16} />
                    Export Users
                </button>
            </div>

            <div className={styles.card}>
                <div className={styles.toolbar}>
                    <div className={styles.searchWrapper}>
                        <Search size={15} className={styles.searchIcon}/>
                        <input
                            className={styles.searchInput}
                            placeholder="Search users..."
                            value={search}
                            onChange={e => handleSearch(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className={styles.empty}>Loading users...</div>
                ) : displayedUsers.length === 0 ? (
                    <div className={styles.empty}>No users found.</div>
                ) : (
                    <div className={styles.scroll}>
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
                            {displayedUsers.map(user => (
                                <tr key={user.uid}>
                                    <td>
                                        <div className={styles.userCell}>
                                            <div className={styles.avatar}>
                                                {user.photoURL
                                                    ? <img src={user.photoURL} alt="" className={styles.avatarImg}/>
                                                    : <User size={16}/>
                                                }
                                            </div>
                                            <div>
                                                <div className={styles.userName}>{user.fullName || user.username || 'Unnamed User'}</div>
                                                {user.username && <div className={styles.userHandle}>@{user.username}</div>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className={styles.emailCell}>{user.userId || user.email || '-'}</td>
                                    <td><StatusBadge status={user.role || 'user'}/></td>
                                    <td>
                                        <div className={styles.actionsCell}>
                                            <button
                                                type="button"
                                                className={styles.iconBtn}
                                                onClick={() => setViewUser(user)}
                                                aria-label="View user details"
                                            >
                                                <Eye size={16} />
                                            </button>
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
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                )}

                <Pagination
                    page={page}
                    totalPages={totalPages}
                    total={totalUsers}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={handlePageSize}
                />
            </div>

            {viewUser && <UserDetailModal user={viewUser} onClose={() => setViewUser(null)} />}
        </div>
    );
}
