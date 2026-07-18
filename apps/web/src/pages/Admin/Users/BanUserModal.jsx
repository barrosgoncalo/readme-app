import {useState, useEffect} from 'react';
import {X, AlertTriangle, FileText} from 'lucide-react';
import {REPORT_REASON_LABELS, REPORT_STATUS} from '@readme/shared/src/constants/status';
import {DB} from '@readme/shared/src/services/DB';
import styles from './BanUserModal.module.css';

export default function BanUserModal({user, onClose, onConfirm}) {
    const defaultReason = Object.keys(REPORT_REASON_LABELS)[0] || 'other';
    const [reason, setReason] = useState(defaultReason);
    const [loading, setLoading] = useState(false);
    const [reportSummary, setReportSummary] = useState(null);
    const [loadingReports, setLoadingReports] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const fetchUserReports = async () => {
            if (!user) return;
            setLoadingReports(true);
            try {
                // Procura denúncias pendentes onde este utilizador é o alvo
                const pendingReports = await DB.get('reports', [
                    {field: 'reportedUserId', operator: '==', value: user.uid},
                    {field: 'status', operator: '==', value: REPORT_STATUS?.PENDING || 'pending'}
                ]);

                if (isMounted) {
                    // Agrupa as denúncias pelo motivo e soma a contagem
                    const summary = {};
                    pendingReports.forEach(report => {
                        const r = report.reason || 'other';
                        summary[r] = (summary[r] || 0) + (report.reportCount || 1);
                    });
                    setReportSummary(summary);
                }
            } catch (err) {
                console.error("Erro ao carregar denúncias do utilizador:", err);
                if (isMounted) setReportSummary({});
            } finally {
                if (isMounted) setLoadingReports(false);
            }
        };

        fetchUserReports();

        return () => isMounted = false;
    }, [user]);

    const handleConfirm = async () => {
        setLoading(true);
        await onConfirm(user.uid, reason);
        setLoading(false);
    };

    if (!user) return null;

    const hasReports = reportSummary && Object.keys(reportSummary).length > 0;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <div className={styles.titleWrap}>
                        <AlertTriangle size={20} className={styles.warningIcon}/>
                        <h2>Ban User</h2>
                    </div>
                    <button type="button" className={styles.closeBtn} onClick={onClose}>
                        <X size={18}/>
                    </button>
                </div>

                <div className={styles.body}>
                    <p className={styles.description}>
                        You're about to ban <strong>{user.fullName || user.username}</strong> (@{user.username}).
                        The account will be deactivated and moved to banned arquive.
                    </p>

                    {/* Resumo de Denúncias */}
                    <div className={styles.contextBox}>
                        <div className={styles.contextHeader}>
                            <FileText size={16}/>
                            <span>Reports Context</span>
                        </div>
                        {loadingReports ? (
                            <p className={styles.contextText}>Looking for pending reports...</p>
                        ) : hasReports ? (
                            <ul className={styles.reportList}>
                                {Object.entries(reportSummary).map(([rKey, count]) => (
                                    <li key={rKey}>
                                        <span className={styles.reportCount}>{count}x</span>
                                        {REPORT_REASON_LABELS[rKey] || rKey}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className={styles.contextText}>This user doesn't have any pending reports.</p>
                        )}
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="banReason">Motive of Ban</label>
                        <select
                            id="banReason"
                            className={styles.select}
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
                </div>

                <div className={styles.footer}>
                    <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={loading}>
                        Cancelar
                    </button>
                    <button type="button" className={styles.confirmBtn} onClick={handleConfirm} disabled={loading}>
                        {loading ? 'Banning...' : 'Confirm Ban'}
                    </button>
                </div>
            </div>
        </div>
    );
}