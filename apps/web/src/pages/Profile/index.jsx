import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import {
    BookOpen, Pencil, Ban, Lock, Moon, Settings, Award, Heart, LogOut, ChevronRight
} from 'lucide-react';
import { db } from '@readme/shared/src/services/firebase.web';
import { doSignOut } from '@readme/shared/src/services/auth.web';
import { useAuth } from '@readme/shared/src/contexts/AuthContext/web';
import { useTheme } from '../../contexts/ThemeContext';
import { WEB_ROUTES } from '../../constants/webRoutes';
import Field from '../../components/Field.jsx';
import Button from '../../components/Button.jsx';
import styles from './Profile.module.css';

function initials(userData) {
    const name = userData?.fullName || userData?.username || '';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

export default function Profile() {
    const { currentUser } = useAuth();
    const { theme, toggle } = useTheme();

    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');

    useEffect(() => {
        if (!currentUser) return;
        getDoc(doc(db, 'users', currentUser.uid)).then(snap => {
            if (snap.exists()) setUserData(snap.data());
        }).finally(() => setLoading(false));
    }, [currentUser]);

    function openEdit() {
        setForm({
            fullName: userData?.fullName || '',
            username: userData?.username || '',
            phoneNumber: userData?.phoneNumber || '',
            isPublic: userData?.profileVisibility === 'public',
        });
        setSaveError('');
        setEditing(true);
    }

    async function handleSave(e) {
        e.preventDefault();
        setSaving(true);
        setSaveError('');
        try {
            const update = {
                fullName: form.fullName.trim(),
                username: form.username.trim(),
                phoneNumber: form.phoneNumber.trim(),
                profileVisibility: form.isPublic ? 'public' : 'private',
            };
            await updateDoc(doc(db, 'users', currentUser.uid), update);
            setUserData(prev => ({ ...prev, ...update }));
            setEditing(false);
        } catch {
            setSaveError('Could not save changes. Please try again.');
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <p className={styles.loadingText}>Loading…</p>;

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

                {/* Edit Profile — expands inline */}
                <button className={styles.item} onClick={editing ? undefined : openEdit}>
                    <span className={styles.itemLeft}>
                        <span className={styles.iconBox}><Pencil size={20} /></span>
                        <span className={styles.itemLabel}>Edit Profile</span>
                    </span>
                    {!editing && <ChevronRight size={18} className={styles.chevron} />}
                </button>

                {editing && (
                    <form className={styles.editForm} onSubmit={handleSave}>
                        <Field label="Full name" value={form.fullName} onChange={v => setForm(f => ({ ...f, fullName: v }))} required />
                        <Field label="Username" value={form.username} onChange={v => setForm(f => ({ ...f, username: v }))} required />
                        <Field label="Phone" type="tel" value={form.phoneNumber} onChange={v => setForm(f => ({ ...f, phoneNumber: v }))} />
                        <div className={styles.visibilityRow}>
                            <span className={styles.visibilityLabel}>Public profile</span>
                            <Toggle checked={form.isPublic} onChange={v => setForm(f => ({ ...f, isPublic: v }))} />
                        </div>
                        {saveError && <p className={styles.errorText}>{saveError}</p>}
                        <div className={styles.editActions}>
                            <Button variant="ghost" onClick={() => setEditing(false)} disabled={saving}>Cancel</Button>
                            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
                        </div>
                    </form>
                )}

                <div className={`${styles.item} ${styles.disabled}`}>
                    <span className={styles.itemLeft}>
                        <span className={styles.iconBox}><Ban size={20} /></span>
                        <span className={styles.itemLabel}>View Blocked Users</span>
                    </span>
                    <ChevronRight size={18} className={styles.chevron} />
                </div>

                <div className={`${styles.item} ${styles.disabled}`}>
                    <span className={styles.itemLeft}>
                        <span className={styles.iconBox}><Lock size={20} /></span>
                        <span className={styles.itemLabel}>Privacy &amp; Security</span>
                    </span>
                    <ChevronRight size={18} className={styles.chevron} />
                </div>

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

function Toggle({ checked, onChange }) {
    return (
        <label className={styles.toggle} onClick={e => e.stopPropagation()}>
            <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
            <span className={styles.toggleTrack} />
        </label>
    );
}
