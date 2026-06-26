import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ArrowLeft, Shield, MapPin, Bell, KeyRound, UserX, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { db } from '@readme/shared/src/services/firebase.web';
import { doDeleteAccount } from '@readme/shared/src/services/auth.web';
import { useAuth } from '@readme/shared/src/contexts/AuthContext/web';
import { WEB_ROUTES } from '../../constants/webRoutes';
import Button from '../../components/Button.jsx';
import ErrorAlert from '../../components/ErrorAlert.jsx';
import Spinner from '../../components/Spinner.jsx';
import styles from './PrivacySecurity.module.css';

export default function PrivacySecurity() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(null);

    const [isPublic, setIsPublic] = useState(false);
    const [locationServices, setLocationServices] = useState(false);
    const [shareActivity, setShareActivity] = useState(false);

    const [deleteStep, setDeleteStep] = useState(0);
    const [deletePassword, setDeletePassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [deleteError, setDeleteError] = useState('');
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (!currentUser) return;
        getDoc(doc(db, 'users', currentUser.uid)).then(snap => {
            if (!snap.exists()) return;
            const d = snap.data();
            setIsPublic(d.profileVisibility === 'public');
            setLocationServices(d.locationServices ?? false);
            setShareActivity(d.shareActivityData ?? false);
        }).finally(() => setLoading(false));
    }, [currentUser]);

    async function saveField(field, value) {
        setSaving(field);
        try {
            await updateDoc(doc(db, 'users', currentUser.uid), { [field]: value });
        } catch {
            if (field === 'profileVisibility') setIsPublic(v => !v);
            if (field === 'locationServices') setLocationServices(v => !v);
            if (field === 'shareActivityData') setShareActivity(v => !v);
        } finally {
            setSaving(null);
        }
    }

    async function handleDeleteAccount() {
        setDeleteError('');
        setDeleting(true);
        try {
            await doDeleteAccount(deletePassword);
            navigate(WEB_ROUTES.LOGIN, { replace: true });
        } catch (err) {
            setDeleteError(err.message || 'Could not delete account.');
        } finally {
            setDeleting(false);
        }
    }

    if (loading) return <Spinner center label="Loading" />;

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <button className={styles.backBtn} onClick={() => navigate(WEB_ROUTES.PROFILE)}>
                    <ArrowLeft size={20} />
                </button>
                <h1 className={styles.title}>Privacy And Security</h1>
            </div>

            {/* ── Privacy ── */}
            <section className={styles.section}>
                <p className={styles.sectionLabel}>Privacy</p>
                <div className={styles.card}>
                    <ToggleRow
                        icon={<Shield size={18} />}
                        label={isPublic ? 'Public' : 'Private'}
                        checked={isPublic}
                        disabled={saving === 'profileVisibility'}
                        onChange={v => {
                            setIsPublic(v);
                            saveField('profileVisibility', v ? 'public' : 'private');
                        }}
                    />
                    <div className={styles.divider} />
                    <ToggleRow
                        icon={<MapPin size={18} />}
                        label="Location Services"
                        checked={locationServices}
                        disabled={saving === 'locationServices'}
                        onChange={v => {
                            setLocationServices(v);
                            saveField('locationServices', v);
                        }}
                    />
                    <div className={styles.divider} />
                    <ToggleRow
                        icon={<Bell size={18} />}
                        label="Share Activity Data"
                        checked={shareActivity}
                        disabled={saving === 'shareActivityData'}
                        onChange={v => {
                            setShareActivity(v);
                            saveField('shareActivityData', v);
                        }}
                    />
                </div>
            </section>

            {/* ── Security ── */}
            <section className={styles.section}>
                <p className={styles.sectionLabel}>Security</p>
                <div className={styles.card}>
                    <button className={styles.navRow} onClick={() => navigate(WEB_ROUTES.PROFILE_CHANGE_PASSWORD)}>
                        <span className={styles.rowLeft}>
                            <span className={styles.iconBox}><KeyRound size={18} /></span>
                            <span className={styles.rowLabel}>Change Password</span>
                        </span>
                        <ChevronRight size={18} className={styles.chevron} />
                    </button>

                    <div className={styles.divider} />

                    {deleteStep === 0 && (
                        <button className={`${styles.navRow} ${styles.dangerRow}`} onClick={() => { setDeleteStep(1); setDeleteError(''); }}>
                            <span className={styles.rowLeft}>
                                <span className={`${styles.iconBox} ${styles.dangerIcon}`}><UserX size={18} /></span>
                                <span className={`${styles.rowLabel} ${styles.dangerLabel}`}>Delete Account</span>
                            </span>
                            <ChevronRight size={18} className={styles.chevron} />
                        </button>
                    )}

                    {deleteStep === 1 && (
                        <div className={styles.deleteBox}>
                            <p className={styles.deleteWarning}>This permanently deletes your account and all your data. This cannot be undone.</p>
                            <div className={styles.deleteActions}>
                                <Button variant="ghost" onClick={() => setDeleteStep(0)}>Cancel</Button>
                                <Button onClick={() => setDeleteStep(2)} style={{ background: 'var(--error)', color: '#fff' }}>Continue</Button>
                            </div>
                        </div>
                    )}

                    {deleteStep === 2 && (
                        <div className={styles.deleteBox}>
                            <p className={styles.deleteWarning}>Enter your password to confirm deletion.</p>
                            <div className={styles.pwRow}>
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    className={styles.pwInput}
                                    placeholder="Password"
                                    value={deletePassword}
                                    onChange={e => setDeletePassword(e.target.value)}
                                    autoComplete="current-password"
                                />
                                <button type="button" className={styles.pwEye} onClick={() => setShowPw(s => !s)}>
                                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            <ErrorAlert>{deleteError}</ErrorAlert>
                            <div className={styles.deleteActions}>
                                <Button variant="ghost" onClick={() => { setDeleteStep(0); setDeletePassword(''); setDeleteError(''); }}>Cancel</Button>
                                <Button onClick={handleDeleteAccount} disabled={!deletePassword || deleting} style={{ background: 'var(--error)', color: '#fff' }}>
                                    {deleting ? 'Deleting…' : 'Delete my account'}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

function ToggleRow({ icon, label, checked, onChange, disabled }) {
    return (
        <div className={styles.toggleRow}>
            <span className={styles.rowLeft}>
                <span className={styles.iconBox}>{icon}</span>
                <span className={styles.rowLabel}>{label}</span>
            </span>
            <Toggle checked={checked} onChange={onChange} disabled={disabled} />
        </div>
    );
}

function Toggle({ checked, onChange, disabled }) {
    return (
        <label className={styles.toggle} onClick={e => e.stopPropagation()}>
            <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} disabled={disabled} />
            <span className={styles.toggleTrack} />
        </label>
    );
}
