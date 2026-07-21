import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, KeyRound, UserX, ChevronRight, Eye, EyeOff, Phone } from 'lucide-react';
import { doDeleteUserProfile, doReauthenticateWithPassword, doReauthenticateWithGoogle } from '@readme/shared/src/services/auth';
import { useAuth } from '@readme/shared/src/contexts/AuthContext/web';
import { WEB_ROUTES } from '../../constants/webRoutes';
import Button from '../../components/Button.jsx';
import ErrorAlert from '../../components/ErrorAlert.jsx';
import Spinner from '../../components/Spinner.jsx';
import Toggle from '../../components/Toggle.jsx';
import styles from './PrivacySecurity.module.css';
import { DB } from '@readme/shared/src/services/DB';

export default function PrivacySecurity() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(null);

    const [isPrivate, setIsPrivate] = useState(false);
    const [shareContact, setShareContact] = useState(false);

    const [deleteStep, setDeleteStep] = useState(0);
    const [deletePassword, setDeletePassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [deleteError, setDeleteError] = useState('');
    const [deleting, setDeleting] = useState(false);

    const isGoogleAuth = currentUser?.providerData?.some(
        (provider) => provider.providerId === 'google.com'
    );

    const hasPasswordAuth = currentUser?.providerData?.some(
        (provider) => provider.providerId === 'password'
    );

    useEffect(() => {
        if (!currentUser) return;

        DB.get('users', currentUser.uid).then(d => {
            if (!d) return;
            setIsPrivate(d.profileVisibility === 'private');
            setShareContact(d.shareContactDetails === true);
        }).finally(() => setLoading(false));
    }, [currentUser]);

    async function saveField(field, value) {
        setSaving(field);
        try {
            await DB.update('users', currentUser.uid, { [field]: value });
        } catch {
            if (field === 'profileVisibility') setIsPrivate(v => !v);
            if (field === 'shareContactDetails') setShareContact(v => !v);
        } finally {
            setSaving(null);
        }
    }

    async function handleInitialDelete() {
        setDeleteError('');
        setDeleting(true);

        if (isGoogleAuth) {
            try {
                await doReauthenticateWithGoogle();
                await doDeleteUserProfile(currentUser.uid);
                navigate(WEB_ROUTES.LOGIN, { replace: true });
            } catch (error) {
                console.error("Google Re-auth Error:", error);
                if (error.code === 'auth/popup-blocked') {
                    setDeleteError("Your browser blocked the sign-in popup. Please allow popups for this site and try again.");
                } else if (error.code === 'auth/popup-closed-by-user') {
                    setDeleteError("Google authentication was cancelled.");
                } else {
                    setDeleteError(error.message || "Google authentication failed.");
                }
                setDeleting(false);
            }
            return;
        }

        try {
            await doDeleteUserProfile(currentUser.uid);
            navigate(WEB_ROUTES.LOGIN, { replace: true });
        } catch (error) {
            if (error.code === 'auth/requires-recent-login') {
                setDeleteStep(2);
            } else {
                setDeleteError(error.message || 'Could not delete account.');
            }
            setDeleting(false);
        }
    }

    async function handleReauthAndDelete() {
        if (!deletePassword) {
            setDeleteError("Please enter your password.");
            return;
        }

        setDeleteError('');
        setDeleting(true);
        try {
            await doReauthenticateWithPassword(deletePassword);
            await doDeleteUserProfile(currentUser.uid);
            navigate(WEB_ROUTES.LOGIN, { replace: true });
        } catch (error) {
            console.error("Reauth error:", error);
            setDeleteError("Authentication Failed: The password you entered is incorrect. Please try again.");
            setDeleting(false);
        }
    }

    if (loading) return <Spinner center label="Loading" />;

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <button className={styles.backBtn} onClick={() => navigate(WEB_ROUTES.PROFILE)} disabled={deleting}>
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
                        label={'Private Account'}
                        checked={isPrivate}
                        disabled={saving === 'profileVisibility' || deleting}
                        onChange={v => {
                            setIsPrivate(v);
                            saveField('profileVisibility', v ? 'private' : 'public');
                        }}
                    />
                </div>
                <p className={styles.helperText} style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #666)', marginTop: '6px', paddingLeft: '4px' }}>
                    {isPrivate
                        ? "Only approved users can see your publications and request book swaps."
                        : "Anyone can see your publications and request book swaps with you."}
                </p>
            </section>

            {/* ── Contact Details ── */}
            <section className={styles.section}>
                <p className={styles.sectionLabel}>Contact Details</p>
                <div className={styles.card}>
                    <ToggleRow
                        icon={<Phone size={18} />}
                        label={'Share Contact Details'}
                        checked={shareContact}
                        disabled={saving === 'shareContactDetails' || deleting}
                        onChange={v => {
                            setShareContact(v);
                            saveField('shareContactDetails', v);
                        }}
                    />
                </div>
                <p className={styles.helperText} style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #666)', marginTop: '6px', paddingLeft: '4px' }}>
                    {shareContact
                        ? "Buyers will see a Call / SMS button on your publications."
                        : "Buyers can only contact you through in-app messages."}
                </p>
            </section>

            {/* ── Security ── */}
            <section className={styles.section}>
                <p className={styles.sectionLabel}>Security</p>
                <div className={styles.card}>
                    {hasPasswordAuth && (
                        <>
                            <button
                                className={styles.navRow}
                                disabled={deleting}
                                onClick={() => navigate(WEB_ROUTES.PROFILE_CHANGE_PASSWORD, { state: { from: WEB_ROUTES.PROFILE_PRIVACY_SECURITY } })}
                            >
                                <span className={styles.rowLeft}>
                                    <span className={styles.iconBox}><KeyRound size={18} /></span>
                                    <span className={styles.rowLabel}>Change Password</span>
                                </span>
                                <ChevronRight size={18} className={styles.chevron} />
                            </button>
                            <div className={styles.divider} />
                        </>
                    )}

                    {deleteStep === 0 && (
                        <button disabled={deleting} className={`${styles.navRow} ${styles.dangerRow}`} onClick={() => { setDeleteStep(1); setDeleteError(''); }}>
                            <span className={styles.rowLeft}>
                                <span className={`${styles.iconBox} ${styles.dangerIcon}`}><UserX size={18} /></span>
                                <span className={`${styles.rowLabel} ${styles.dangerLabel}`}>Delete Account</span>
                            </span>
                            <ChevronRight size={18} className={styles.chevron} />
                        </button>
                    )}

                    {deleteStep === 1 && (
                        <div className={styles.deleteBox}>
                            <p className={styles.deleteWarning}>Are you absolutely sure you want to delete your account? This action cannot be undone and you will lose all your data.</p>

                            {deleteError && <ErrorAlert>{deleteError}</ErrorAlert>}

                            <div className={styles.deleteActions}>
                                <Button variant="ghost" disabled={deleting} onClick={() => setDeleteStep(0)}>Cancel</Button>
                                <Button onClick={handleInitialDelete} disabled={deleting} style={{ background: 'var(--error)', color: '#fff' }}>
                                    {deleting ? 'Deleting…' : 'Delete'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {deleteStep === 2 && (
                        <div className={styles.deleteBox}>
                            <p className={styles.deleteWarning}>Please enter your password to confirm you want to delete your account.</p>
                            <div className={styles.pwRow}>
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    className={styles.pwInput}
                                    placeholder="Enter your password"
                                    value={deletePassword}
                                    onChange={e => setDeletePassword(e.target.value)}
                                    autoComplete="current-password"
                                    disabled={deleting}
                                />
                                <button type="button" className={styles.pwEye} onClick={() => setShowPw(s => !s)} disabled={deleting}>
                                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {deleteError && <ErrorAlert>{deleteError}</ErrorAlert>}
                            <div className={styles.deleteActions}>
                                <Button variant="ghost" disabled={deleting} onClick={() => { setDeleteStep(0); setDeletePassword(''); setDeleteError(''); }}>Cancel</Button>
                                <Button onClick={handleReauthAndDelete} disabled={deleting || !deletePassword} style={{ background: 'var(--error)', color: '#fff' }}>
                                    {deleting ? 'Deleting…' : 'Confirm Delete'}
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