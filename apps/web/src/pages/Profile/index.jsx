import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import {
    BookOpen, Pencil, Ban, Lock, Moon, Settings, Award, Heart, LogOut, ChevronRight,
    Globe, Eye, EyeOff,
} from 'lucide-react';
import { db } from '@readme/shared/src/services/firebase.web';
import { doSignOut, doUpdateUserPassword, doDeleteAccount } from '@readme/shared/src/services/auth.web';
import { useAuth } from '@readme/shared/src/contexts/AuthContext/web';
import { useTheme } from '../../contexts/ThemeContext';
import { WEB_ROUTES } from '../../constants/webRoutes';
import Button from '../../components/Button.jsx';
import Spinner from '../../components/Spinner.jsx';
import ErrorAlert from '../../components/ErrorAlert.jsx';
import styles from './Profile.module.css';

function initials(userData) {
    const name = userData?.fullName || userData?.username || '';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

export default function Profile() {
    const { currentUser } = useAuth();
    const { theme, toggle } = useTheme();
    const navigate = useNavigate();

    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);


    // Privacy & Security panel
    const [privacyOpen, setPrivacyOpen] = useState(false);
    const [isPublic, setIsPublic] = useState(false);
    const [privacySaving, setPrivacySaving] = useState(false);

    // Change password
    const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
    const [pwSaving, setPwSaving] = useState(false);
    const [pwError, setPwError] = useState('');
    const [pwSuccess, setPwSuccess] = useState(false);
    const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });

    // Delete account
    const [deleteStep, setDeleteStep] = useState(0); // 0=hidden, 1=confirm, 2=password
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteError, setDeleteError] = useState('');
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (!currentUser) return;
        getDoc(doc(db, 'users', currentUser.uid)).then(snap => {
            if (snap.exists()) {
                const data = snap.data();
                setUserData(data);
                setIsPublic(data.profileVisibility === 'public');
            }
        }).finally(() => setLoading(false));
    }, [currentUser]);

    async function handlePrivacyToggle(value) {
        setIsPublic(value);
        setPrivacySaving(true);
        try {
            await updateDoc(doc(db, 'users', currentUser.uid), {
                profileVisibility: value ? 'public' : 'private',
            });
            setUserData(prev => ({ ...prev, profileVisibility: value ? 'public' : 'private' }));
        } catch {
            setIsPublic(!value); // revert
        } finally {
            setPrivacySaving(false);
        }
    }

    async function handleChangePassword(e) {
        e.preventDefault();
        setPwError('');
        setPwSuccess(false);
        if (pwForm.next !== pwForm.confirm) {
            setPwError('New passwords do not match.');
            return;
        }
        if (pwForm.next.length < 6) {
            setPwError('New password must be at least 6 characters.');
            return;
        }
        setPwSaving(true);
        try {
            await doUpdateUserPassword(pwForm.current, pwForm.next);
            setPwForm({ current: '', next: '', confirm: '' });
            setPwSuccess(true);
        } catch (err) {
            setPwError(err.message || 'Could not change password.');
        } finally {
            setPwSaving(false);
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

    if (loading) return <Spinner center label="Loading profile" />;

    return (
        <div className={styles.page}>

            {/* ── Header ── */}
            <div className={styles.header}>
                <div className={styles.avatar}>{initials(userData)}</div>
                <p className={styles.userName}>{userData?.username || currentUser?.email}</p>
                <p className={styles.userEmail}>{currentUser?.email}</p>
            </div>

            {/* ── Group 1: Content ── */}
            <div className={styles.group}>
                <Link to={WEB_ROUTES.BOOKS} className={styles.item}>
                    <span className={styles.itemLeft}>
                        <span className={styles.iconBox}><BookOpen size={20} /></span>
                        <span className={styles.itemLabel}>My Books</span>
                    </span>
                    <ChevronRight size={18} className={styles.chevron} />
                </Link>
            </div>

            {/* ── Group 2: Account ── */}
            <div className={styles.group}>

                <button className={styles.item} onClick={() => navigate(WEB_ROUTES.PROFILE_EDIT)}>
                    <span className={styles.itemLeft}>
                        <span className={styles.iconBox}><Pencil size={20} /></span>
                        <span className={styles.itemLabel}>Edit Profile</span>
                    </span>
                    <ChevronRight size={18} className={styles.chevron} />
                </button>

                <div className={`${styles.item} ${styles.disabled}`}>
                    <span className={styles.itemLeft}>
                        <span className={styles.iconBox}><Ban size={20} /></span>
                        <span className={styles.itemLabel}>View Blocked Users</span>
                    </span>
                    <ChevronRight size={18} className={styles.chevron} />
                </div>

                {/* Privacy & Security — expands inline */}
                <button className={styles.item} onClick={() => { setPrivacyOpen(o => !o); setPwError(''); setPwSuccess(false); setDeleteStep(0); }}>
                    <span className={styles.itemLeft}>
                        <span className={styles.iconBox}><Lock size={20} /></span>
                        <span className={styles.itemLabel}>Privacy &amp; Security</span>
                    </span>
                    <ChevronRight size={18} className={`${styles.chevron} ${privacyOpen ? styles.chevronOpen : ''}`} />
                </button>

                {privacyOpen && (
                    <div className={styles.privacyPanel}>

                        {/* ── Privacy ── */}
                        <p className={styles.panelSection}>Privacy</p>
                        <div className={styles.privacyRow}>
                            <span className={styles.itemLeft}>
                                <span className={styles.iconBox}>{isPublic ? <Globe size={18} /> : <Lock size={18} />}</span>
                                <span>
                                    <span className={styles.itemLabel}>{isPublic ? 'Public' : 'Private'}</span>
                                    <span className={styles.helperText}>
                                        {isPublic
                                            ? 'Anyone can see your library and request book swaps.'
                                            : 'Only approved users can see your library and request book swaps.'}
                                    </span>
                                </span>
                            </span>
                            <Toggle checked={isPublic} onChange={handlePrivacyToggle} disabled={privacySaving} />
                        </div>

                        {/* ── Change Password ── */}
                        <p className={styles.panelSection}>Security</p>
                        <form className={styles.pwForm} onSubmit={handleChangePassword}>
                            <PasswordField
                                label="Current password"
                                value={pwForm.current}
                                onChange={v => setPwForm(f => ({ ...f, current: v }))}
                                show={showPw.current}
                                onToggleShow={() => setShowPw(s => ({ ...s, current: !s.current }))}
                            />
                            <PasswordField
                                label="New password"
                                value={pwForm.next}
                                onChange={v => { setPwForm(f => ({ ...f, next: v })); setPwSuccess(false); }}
                                show={showPw.next}
                                onToggleShow={() => setShowPw(s => ({ ...s, next: !s.next }))}
                            />
                            <PasswordField
                                label="Confirm new password"
                                value={pwForm.confirm}
                                onChange={v => setPwForm(f => ({ ...f, confirm: v }))}
                                show={showPw.confirm}
                                onToggleShow={() => setShowPw(s => ({ ...s, confirm: !s.confirm }))}
                            />
                            {pwSuccess && <p className={styles.pwSuccess}>Password changed successfully.</p>}
                            <ErrorAlert>{pwError}</ErrorAlert>
                            <Button
                                type="submit"
                                disabled={!pwForm.current || !pwForm.next || !pwForm.confirm || pwSaving}
                            >
                                {pwSaving ? 'Saving…' : 'Change password'}
                            </Button>
                        </form>

                        {/* ── Delete Account ── */}
                        <p className={styles.panelSection}>Account Management</p>
                        {deleteStep === 0 && (
                            <button
                                type="button"
                                className={`${styles.item} ${styles.danger}`}
                                onClick={() => { setDeleteStep(1); setDeleteError(''); }}
                            >
                                <span className={styles.itemLeft}>
                                    <span className={styles.iconBox}><LogOut size={18} /></span>
                                    <span className={styles.itemLabel}>Delete Account</span>
                                </span>
                            </button>
                        )}
                        {deleteStep === 1 && (
                            <div className={styles.deleteConfirm}>
                                <p className={styles.deleteWarning}>This permanently deletes your account and all your data. This cannot be undone.</p>
                                <div className={styles.editActions}>
                                    <Button variant="ghost" onClick={() => setDeleteStep(0)}>Cancel</Button>
                                    <Button onClick={() => setDeleteStep(2)} style={{ background: 'var(--error)', color: '#fff' }}>Continue</Button>
                                </div>
                            </div>
                        )}
                        {deleteStep === 2 && (
                            <div className={styles.deleteConfirm}>
                                <p className={styles.deleteWarning}>Enter your password to confirm deletion.</p>
                                <PasswordField
                                    label="Password"
                                    value={deletePassword}
                                    onChange={setDeletePassword}
                                    show={showPw.delete}
                                    onToggleShow={() => setShowPw(s => ({ ...s, delete: !s.delete }))}
                                />
                                <ErrorAlert>{deleteError}</ErrorAlert>
                                <div className={styles.editActions}>
                                    <Button variant="ghost" onClick={() => { setDeleteStep(0); setDeletePassword(''); setDeleteError(''); }}>Cancel</Button>
                                    <Button
                                        onClick={handleDeleteAccount}
                                        disabled={!deletePassword || deleting}
                                        style={{ background: 'var(--error)', color: '#fff' }}
                                    >
                                        {deleting ? 'Deleting…' : 'Delete my account'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className={styles.item} onClick={toggle} style={{ cursor: 'pointer' }}>
                    <span className={styles.itemLeft}>
                        <span className={styles.iconBox}><Moon size={20} /></span>
                        <span className={styles.itemLabel}>Dark Mode</span>
                    </span>
                    <Toggle checked={theme === 'dark'} onChange={toggle} />
                </div>

            </div>

            {/* ── Group 3: Preferences ── */}
            <div className={styles.group}>
                <div className={`${styles.item} ${styles.disabled}`}>
                    <span className={styles.itemLeft}>
                        <span className={styles.iconBox}><Settings size={20} /></span>
                        <span className={styles.itemLabel}>Settings</span>
                    </span>
                    <ChevronRight size={18} className={styles.chevron} />
                </div>
                <div className={`${styles.item} ${styles.disabled}`}>
                    <span className={styles.itemLeft}>
                        <span className={styles.iconBox}><Award size={20} /></span>
                        <span className={styles.itemLabel}>Level</span>
                    </span>
                    <ChevronRight size={18} className={styles.chevron} />
                </div>
                <div className={`${styles.item} ${styles.disabled}`}>
                    <span className={styles.itemLeft}>
                        <span className={styles.iconBox}><Heart size={20} /></span>
                        <span className={styles.itemLabel}>Favorites</span>
                    </span>
                    <ChevronRight size={18} className={styles.chevron} />
                </div>
            </div>

            {/* ── Group 4: Sign out ── */}
            <div className={styles.group}>
                <button className={`${styles.item} ${styles.danger}`} onClick={doSignOut}>
                    <span className={styles.itemLeft}>
                        <span className={styles.iconBox}><LogOut size={20} /></span>
                        <span className={styles.itemLabel}>Sign Out</span>
                    </span>
                </button>
            </div>

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

function PasswordField({ label, value, onChange, show, onToggleShow }) {
    return (
        <div className={styles.pwFieldWrap}>
            <label>{label}</label>
            <div className={styles.pwInputRow}>
                <input
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    autoComplete="off"
                />
                <button type="button" className={styles.pwEyeBtn} onClick={onToggleShow} tabIndex={-1}>
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>
        </div>
    );
}
