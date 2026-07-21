import { useState, useEffect, useRef } from 'react';
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { FileText, User, AlertTriangle } from 'lucide-react';
import { REPORT_REASON_LABELS, REPORT_STATUS } from '@readme/shared/src/constants/status';
import { DB } from '@readme/shared/src/services/DB';
import { banUserAccount } from '@readme/shared/src/services/admin';
import QuickActionModal from './QuickActionModal.jsx';
import styles from './QuickActionModal.module.css';
import localStyles from '../../pages/Admin/Users/BanUserModal.module.css';

export default function BanUserModal({ onClose }) {
    const [allUsers, setAllUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const inputRef = useRef(null);

    const defaultReason = Object.keys(REPORT_REASON_LABELS)[0] || 'other';
    const [reason, setReason] = useState(defaultReason);
    const [banning, setBanning] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const [reportSummary, setReportSummary] = useState(null);
    const [loadingReports, setLoadingReports] = useState(false);

    useEffect(() => {
        const db = getFirestore();
        getDocs(query(collection(db, 'users'), orderBy('fullName')))
            .then(snap => setAllUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() }))))
            .catch(console.error)
            .finally(() => {
                setLoading(false);
                setTimeout(() => inputRef.current?.focus(), 50);
            });
    }, []);

    useEffect(() => {
        let isMounted = true;

        if (!selected) {
            setReportSummary(null);
            return;
        }

        const fetchUserReports = async () => {
            setLoadingReports(true);
            try {
                const pendingReports = await DB.get('reports', [
                    { field: 'reportedUserId', operator: '==', value: selected.uid },
                    { field: 'status', operator: '==', value: REPORT_STATUS?.PENDING || 'pending' }
                ]);

                if (isMounted) {
                    const summary = {};
                    pendingReports.forEach(report => {
                        const r = report.reason || 'other';
                        summary[r] = (summary[r] || 0) + (report.reportCount || 1);
                    });
                    setReportSummary(summary);
                }
            } catch (err) {
                console.error("Erro ao carregar denúncias:", err);
                if (isMounted) setReportSummary({});
            } finally {
                if (isMounted) setLoadingReports(false);
            }
        };

        fetchUserReports();
        return () => isMounted = false;
    }, [selected]);

    const filtered = search.trim()
        ? allUsers.filter(u => {
            const q = search.toLowerCase();
            return (
                (u.fullName || '').toLowerCase().includes(q) ||
                (u.username || '').toLowerCase().includes(q) ||
                (u.userId || u.email || '').toLowerCase().includes(q)
            );
        }).slice(0, 8)
        : [];

    const handleBan = async () => {
        if (!selected) return;
        setBanning(true);
        setError('');
        try {
            await banUserAccount(selected.uid, reason);

            setAllUsers(prev => prev.filter(u => u.uid !== selected.uid));
            setSuccess(`${selected.fullName || selected.username || 'User'} foi banido com sucesso.`);
            setSelected(null);
            setSearch('');
            setReason(defaultReason);
            setTimeout(onClose, 2500);
        } catch (err) {
            setError(err.message || 'Falha ao banir o utilizador.');
        } finally {
            setBanning(false);
        }
    };

    const hasReports = reportSummary && Object.keys(reportSummary).length > 0;
    const modalTitle = selected ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={20} color="#dc2626" />
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>Ban User</span>
        </div>
    ) : "Ban User";

    return (
        <QuickActionModal onClose={onClose} title={modalTitle}>
            {!selected ? (
                <>
                    <div className={styles.searchBox}>
                        <input
                            ref={inputRef}
                            className={styles.searchInput}
                            placeholder="Search user by name, username, or email..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className={styles.body}>
                        {loading ? (
                            <p className={styles.empty}>Loading...</p>
                        ) : !search.trim() ? (
                            <p className={styles.empty}>Type to search for a user.</p>
                        ) : filtered.length === 0 ? (
                            <p className={styles.empty}>No users found.</p>
                        ) : (
                            filtered.map(user => (
                                <div
                                    key={user.uid}
                                    className={styles.userRow}
                                    onClick={() => setSelected(user)}
                                >
                                    <div className={styles.avatar}>
                                        {user.photoURL
                                            ? <img src={user.photoURL} alt="" className={styles.avatarImg} />
                                            : <User size={16} />
                                        }
                                    </div>
                                    <div className={styles.userInfo}>
                                        <div className={styles.userName}>
                                            {user.fullName || user.username || 'Unnamed User'}
                                        </div>
                                        <div className={styles.userMeta}>
                                            {user.userId || user.email || '—'}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    {success && <p className={styles.successMsg} style={{margin: '0 20px 20px'}}>{success}</p>}
                </>
            ) : (
                <>
                    <div className={localStyles.body}>
                        <p className={localStyles.description}>
                            You're about to ban <strong>{selected.fullName || selected.username}</strong> (@{selected.username}).
                            The account will be deactivated and moved to banned arquive.
                        </p>

                        <div className={localStyles.contextBox}>
                            <div className={localStyles.contextHeader}>
                                <FileText size={16}/>
                                <span>Reports Context</span>
                            </div>
                            {loadingReports ? (
                                <p className={localStyles.contextText}>Looking for pending reports...</p>
                            ) : hasReports ? (
                                <ul className={localStyles.reportList}>
                                    {Object.entries(reportSummary).map(([rKey, count]) => (
                                        <li key={rKey}>
                                            <span className={localStyles.reportCount}>{count}x</span>
                                            {REPORT_REASON_LABELS[rKey] || rKey}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className={localStyles.contextText}>This user doesn't have any pending reports.</p>
                            )}
                        </div>

                        <div className={localStyles.field}>
                            <label className={localStyles.label} htmlFor="banReason">Motive of Ban</label>
                            <select
                                id="banReason"
                                className={localStyles.select}
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            >
                                {Object.entries(REPORT_REASON_LABELS).map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {error && <p className={styles.errorMsg} style={{marginTop: 16}}>{error}</p>}
                    </div>

                    <div className={localStyles.footer}>
                        <button type="button" className={localStyles.cancelBtn} onClick={() => setSelected(null)} disabled={banning}>
                            Cancelar
                        </button>
                        <button type="button" className={localStyles.confirmBtn} onClick={handleBan} disabled={banning}>
                            {banning ? 'Banning...' : 'Confirm Ban'}
                        </button>
                    </div>
                </>
            )}
        </QuickActionModal>
    );
}
