import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import {
    BookOpen, Pencil, Ban, Lock, Moon, Users, Award, Heart, LogOut, ChevronRight, Camera,
} from 'lucide-react';
import { db } from '@readme/shared/src/services/firebase.web';
import { doSignOut } from '@readme/shared/src/services/auth';
import { uploadProfilePicture } from '@readme/shared/src/services/user';
import { useAuth } from '@readme/shared/src/contexts/AuthContext/web';
import { useTheme } from '../../contexts/ThemeContext';
import { WEB_ROUTES } from '../../constants/webRoutes';
import Spinner from '../../components/Spinner.jsx';
import Toggle from '../../components/Toggle.jsx';
import styles from './Profile.module.css';

function initials(userData) {
    const name = userData?.fullName || userData?.username || '';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

export default function Profile() {
    const { currentUser } = useAuth();
    const { theme, toggle } = useTheme();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [photoURL, setPhotoURL] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');

    useEffect(() => {
        if (!currentUser) return;
        getDoc(doc(db, 'users', currentUser.uid)).then(snap => {
            if (snap.exists()) {
                const data = snap.data();
                setUserData(data);
                setPhotoURL(data.photoURL || null);
            }
        }).finally(() => setLoading(false));
    }, [currentUser]);

    async function handleAvatarFileChange(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadError('');
        setUploading(true);
        try {
            const url = await uploadProfilePicture(currentUser.uid, file);
            setPhotoURL(url);
        } catch {
            setUploadError('Upload failed. Please try again.');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    }

    if (loading) return <Spinner center label="Loading profile" />;

    return (
        <div className={styles.page}>

            {/* ── Header ── */}
            <div className={styles.header}>
                <button
                    className={styles.avatarBtn}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    aria-label="Change profile picture"
                >
                    {photoURL ? (
                        <img src={`${photoURL}?t=${Date.now()}`} alt="Profile" className={styles.avatarImg} />
                    ) : (
                        <div className={styles.avatar}>{initials(userData)}</div>
                    )}
                    <div className={styles.avatarOverlay}>
                        {uploading ? <span className={styles.uploadingRing} /> : <Camera size={20} color="#fff" />}
                    </div>
                </button>

                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarFileChange} />
                {uploadError && <p className={styles.uploadError}>{uploadError}</p>}

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

                <button className={styles.item} onClick={() => navigate(WEB_ROUTES.PROFILE_BLOCKED_USERS)}>
                    <span className={styles.itemLeft}>
                        <span className={styles.iconBox}><Ban size={20} /></span>
                        <span className={styles.itemLabel}>View Blocked Users</span>
                    </span>
                    <ChevronRight size={18} className={styles.chevron} />
                </button>

                <button className={styles.item} onClick={() => navigate(WEB_ROUTES.PROFILE_PRIVACY_SECURITY)}>
                    <span className={styles.itemLeft}>
                        <span className={styles.iconBox}><Lock size={20} /></span>
                        <span className={styles.itemLabel}>Privacy &amp; Security</span>
                    </span>
                    <ChevronRight size={18} className={styles.chevron} />
                </button>

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
                <button className={styles.item} onClick={() => navigate(WEB_ROUTES.PROFILE_FRIENDS)}>
                    <span className={styles.itemLeft}>
                        <span className={styles.iconBox}><Users size={20} /></span>
                        <span className={styles.itemLabel}>Friends</span>
                    </span>
                    <ChevronRight size={18} className={styles.chevron} />
                </button>
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
