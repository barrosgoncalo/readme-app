import { useState, useEffect, useRef } from 'react';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import { User, ChevronDown, LogOut } from 'lucide-react';
import styles from './ProfileDropdown.module.css'; // Add styles here

export default function ProfileDropdown() {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const dropdownRef = useRef(null);
    const auth = getAuth();

    useEffect(() => {
        return onAuthStateChanged(auth, (user) => setCurrentUser(user));
    }, [auth]);

    const toggleDropdown = () => setDropdownOpen(prev => !prev);

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (err) {
            console.error('Logout failed:', err);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={styles.profileContainer} ref={dropdownRef}>
            <button 
                className={styles.profileTrigger} 
                onClick={toggleDropdown}
                aria-expanded={dropdownOpen}
            >
                <div className={styles.avatar}>
                    {currentUser?.photoURL ? (
                        <img src={currentUser.photoURL} alt="" className={styles.avatarImg} />
                    ) : (
                        <User size={16} />
                    )}
                </div>
                <span className={styles.userName}>
                    {currentUser?.displayName || 'Admin'}
                </span>
                <ChevronDown 
                    size={14} 
                    className={`${styles.chevron} ${dropdownOpen ? styles.rotate : ''}`} 
                />
            </button>

            {dropdownOpen && (
                <div className={styles.dropdownMenu}>
                    <div className={styles.dropdownHeader}>
                        <p className={styles.userEmail}>{currentUser?.email || 'admin@swapby.com'}</p>
                    </div>
                    <hr className={styles.divider} />
                    <button className={styles.logoutBtn} onClick={handleLogout}>
                        <LogOut size={14} />
                        Log out
                    </button>
                </div>
            )}
        </div>
    );
}
