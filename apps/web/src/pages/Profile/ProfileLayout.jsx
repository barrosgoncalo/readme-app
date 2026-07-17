import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signOut } from 'firebase/auth';
import {
    BookOpen, Pencil, Ban, Lock, Moon, Users, Award, Heart, LogOut, ChevronRight, Camera,
} from 'lucide-react';

// Shared Services & Contexts
import { UsersService } from '@readme/shared/src/services/users';
import { useAuth } from '@readme/shared/src/contexts/AuthContext/web';
import { useUserRole } from '@readme/shared/src/hooks/use-user-role'; // <-- Added hook

// Local Project Imports
import { db, auth, storage } from '@readme/shared/src/services/firebase';
import { DB } from '@readme/shared/src/services/DB';
import { useTheme } from '../../contexts/ThemeContext';
import { WEB_ROUTES } from '../../constants/webRoutes';
import Spinner from '../../components/Spinner.jsx';
import Toggle from '../../components/Toggle.jsx';
import Card from '../../components/Card.jsx';
import styles from './Profile.module.css';

function initials(userData) {
    const name = userData?.fullName || userData?.username || '';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

const SUB_ROUTES = new Set([
    WEB_ROUTES.PROFILE_FOLLOWING,
    WEB_ROUTES.PROFILE_FOLLOWERS,
    WEB_ROUTES.PROFILE_FAVORITES,
    WEB_ROUTES.PROFILE_LEVEL,
    WEB_ROUTES.PROFILE_BLOCKED_USERS,
]);

export default function ProfileLayout() {
    const { currentUser } = useAuth();
    const { role } = useUserRole(); // <-- Fetch user role
    const { theme, toggle } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const fileInputRef = useRef(null);

    const [userData, setUserData] = useState(null);
    const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
    const [shelfCount, setShelfCount] = useState(null);
    const [loading, setLoading] = useState(true);
    const [photoURL, setPhotoURL] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');

    const showSubPanel = SUB_ROUTES.has(location.pathname);

    useEffect(() => {
        if (!currentUser) return;

        Promise.all([
            getDoc(doc(db, 'users', currentUser.uid)),
            UsersService.getFollowCounts(currentUser.uid),
            DB.count(`users/${currentUser.uid}/myBooks`).catch(() => null),
        ])
        .then(([snap, counts, count]) => {
            if (snap.exists()) {
                const data = snap.data();
                setUserData(data);
                setPhotoURL(data.photoURL || null);
            }
            setFollowCounts(counts);
            setShelfCount(count);
        })
        .catch(err => {
            console.error("Error fetching user profile data:", err);
            setFollowCounts({ followers: 0, following: 0 });
        })
        .finally(() => setLoading(false));
        
    }, [currentUser]);

    async function handleAvatarFileChange(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        
        setUploadError('');
        setUploading(true);
        
        try {
            // 1. Create a reference to the storage location
            const fileRef = ref(storage, `profilePictures/${currentUser.uid}/${file.name}`);
            
            // 2. Upload the file
            await uploadBytes(fileRef, file);
            
            // 3. Get the downloadable URL
            const url = await getDownloadURL(fileRef);
            
            // 4. Update the user's document in Firestore with the new URL
            await updateDoc(doc(db, 'users', currentUser.uid), {
                photoURL: url
            });

            setPhotoURL(url);
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            setUploadError('Upload failed. Please try again.');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    }
    
    async function handleSignOut() {
        try {
            await signOut(auth);
            // Optionally navigate to a public route like login here if AuthContext doesn't handle it
        } catch (error) {
            console.error('Error signing out:', error);
        }
    }

    if (loading) return <Spinner center label="Loading profile" />;

    const settingsGroups = [
        {
            title: 'Content',
            items: [{ icon: BookOpen, label: 'My Books', onClick: () => navigate(WEB_ROUTES.PROFILE_MY_BOOKS) }],
        },
        {
            title: 'Account',
            items: [
                { icon: Pencil, label: 'Edit Profile', onClick: () => navigate(WEB_ROUTES.PROFILE_EDIT) },
                { icon: Ban, label: 'View Blocked Users', onClick: () => navigate(WEB_ROUTES.PROFILE_BLOCKED_USERS) },
                { icon: Lock, label: 'Privacy & Security', onClick: () => navigate(WEB_ROUTES.PROFILE_PRIVACY_SECURITY) },
                { icon: Moon, label: 'Dark Mode', toggle: true },
            ],
        },
        {
            title: 'Social',
            items: [
                { icon: Users, label: 'Following', onClick: () => navigate(WEB_ROUTES.PROFILE_FOLLOWING) },
                { icon: Users, label: 'Followers', onClick: () => navigate(WEB_ROUTES.PROFILE_FOLLOWERS) },
                { icon: Award, label: 'Level', onClick: () => navigate(WEB_ROUTES.PROFILE_LEVEL) },
                { icon: Heart, label: 'Favorites', onClick: () => navigate(WEB_ROUTES.PROFILE_FAVORITES) },
            ],
        },
    ];

    return (
        <div className={styles.page}>
            <div className={styles.dashboard}>
                <Card className={styles.identityCard}>
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

                    <input 
                        ref={fileInputRef} 
                        type="file" 
                        accept="image/*" 
                        style={{ display: 'none' }} 
                        onChange={handleAvatarFileChange} 
                    />
                    {uploadError && <p className={styles.uploadError}>{uploadError}</p>}

                    <p className={styles.userName}>{userData?.username || currentUser?.email}</p>
                    <p className={styles.userEmail}>{currentUser?.email}</p>

                    <div className={styles.statsRow}>
                        <button type="button" className={styles.stat} onClick={() => navigate(WEB_ROUTES.PROFILE_FOLLOWERS)}>
                            <strong>{followCounts.followers}</strong>
                            <span>Followers</span>
                        </button>
                        <button type="button" className={styles.stat} onClick={() => navigate(WEB_ROUTES.PROFILE_FOLLOWING)}>
                            <strong>{followCounts.following}</strong>
                            <span>Following</span>
                        </button>
                        <Link to={WEB_ROUTES.BOOKS} className={styles.stat}>
                            <strong>{shelfCount ?? '—'}</strong>
                            <span>Shelf</span>
                        </Link>
                    </div>

                    <div className={styles.quickActions}>
                        <Link to={WEB_ROUTES.BOOKS} className={styles.quickBtn}>Shelf</Link>
                        <Link to={WEB_ROUTES.PROFILE_MY_BOOKS} className={styles.quickBtn}>My Books</Link>
                        
                        {/* Switch Mode Button (Admin Only) */}
                        {role === 'admin' && (
                            <button 
                                type="button" 
                                className={styles.quickBtn} 
                                onClick={() => navigate('/admin-choice')}
                                style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
                            >
                                Switch Mode
                            </button>
                        )}

                        <button type="button" className={`${styles.quickBtn} ${styles.danger}`} onClick={handleSignOut}>
                            <LogOut size={16} /> Sign Out
                        </button>
                    </div>
                </Card>

                <div className={styles.rightColumn}>
                    {showSubPanel ? (
                        <div className={styles.subPanel}>
                            <Outlet />
                        </div>
                    ) : (
                        settingsGroups.map(group => (
                            <Card key={group.title} className={styles.settingsGroup}>
                                <p className={styles.groupTitle}>{group.title}</p>
                                {group.items.map(item => (
                                    <button
                                        key={item.label}
                                        type="button"
                                        className={`${styles.item} ${item.disabled ? styles.disabled : ''}`}
                                        onClick={item.onClick}
                                        disabled={item.disabled}
                                    >
                                        <span className={styles.itemLeft}>
                                            <span className={styles.iconBox}><item.icon size={20} /></span>
                                            <span className={styles.itemLabel}>{item.label}</span>
                                        </span>
                                        {item.toggle ? (
                                            <Toggle checked={theme === 'dark'} onChange={toggle} />
                                        ) : (
                                            !item.disabled && <ChevronRight size={18} className={styles.chevron} />
                                        )}
                                    </button>
                                ))}
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
