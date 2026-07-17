import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@readme/shared/src/services/firebase.web';
import { GAMIFICATION_RANKS } from '@readme/shared/src/constants/gamification';
import { getHighestUnlockedBadge } from '@readme/shared/src/utils/gamificationUtils';
import { useAuth } from '@readme/shared/src/contexts/AuthContext/web';
import { WEB_ROUTES } from '../../constants/webRoutes';
import PageHeader from '../../components/PageHeader.jsx';
import Spinner from '../../components/Spinner.jsx';
import Modal from '../../components/Modal.jsx';
import Button from '../../components/Button.jsx';
import { useToast } from '../../contexts/ToastContext';
import styles from './Level.module.css';

export default function Level() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [, showToast] = useToast(3000);

    const [swapsCompleted, setSwapsCompleted] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selectedBadge, setSelectedBadge] = useState(null);

    useEffect(() => {
        if (!currentUser) return;
        getDoc(doc(db, 'users', currentUser.uid)).then(snap => {
            if (snap.exists()) {
                setSwapsCompleted(snap.data().gamification?.completedSwapsCount ?? 0);
            }
        }).finally(() => setLoading(false));
    }, [currentUser]);

    if (loading) return <Spinner center label="Loading level" />;

    const highestUnlockedBadge = getHighestUnlockedBadge(swapsCompleted);
    const lastRank = GAMIFICATION_RANKS[GAMIFICATION_RANKS.length - 1];
    const targetBadge = GAMIFICATION_RANKS.find(b => b.milestone > swapsCompleted) || lastRank;
    const isMaxed = swapsCompleted >= lastRank.milestone;
    const progressPercentage = Math.min((swapsCompleted / targetBadge.milestone) * 100, 100);

    const hasUnlockedSelected = selectedBadge ? swapsCompleted >= selectedBadge.milestone : false;

    async function handleShare(badge) {
        const message = `I just unlocked the "${badge.title}" badge on ReadMe after completing ${swapsCompleted} book swaps! Join me, share your stories, and clear your shelves!`;
        if (navigator.share) {
            try {
                await navigator.share({ text: message });
            } catch {
                // user cancelled the share sheet — not an error
            }
            return;
        }
        try {
            await navigator.clipboard.writeText(message);
            showToast('Copied to clipboard.');
        } catch {
            showToast('Could not copy to clipboard.');
        }
    }

    return (
        <div className={styles.page}>
            <PageHeader onBack={() => navigate(WEB_ROUTES.PROFILE)} title="Level" />

            <div className={styles.mainCard}>
                <div className={styles.mainBadgeWrap}>
                    <img src={targetBadge.image} alt={targetBadge.title} className={styles.mainBadgeImage} />
                </div>
                <p className={styles.mainTitle}>
                    {isMaxed ? 'Ultimate tier achieved!' : `Complete ${targetBadge.milestone} swaps`}
                </p>
                <div className={styles.progressTrack}>
                    <div className={styles.progressFill} style={{ width: `${progressPercentage}%` }} />
                </div>
                <p className={styles.progressText}>{swapsCompleted}/{targetBadge.milestone}</p>
            </div>

            <div className={styles.grid}>
                {GAMIFICATION_RANKS.map(badge => {
                    const isUnlocked = swapsCompleted >= badge.milestone;
                    const isHighest = highestUnlockedBadge ? badge.id === highestUnlockedBadge.id : false;

                    return (
                        <button
                            type="button"
                            key={badge.id}
                            className={styles.gridItem}
                            onClick={() => setSelectedBadge(badge)}
                        >
                            <div className={`${styles.badgeWrap} ${isHighest ? styles.badgeActive : ''} ${!isUnlocked ? styles.badgeLocked : ''}`}>
                                <img
                                    src={badge.image}
                                    alt={badge.title}
                                    className={`${styles.badgeImage} ${!isUnlocked ? styles.badgeImageLocked : ''}`}
                                />
                            </div>
                            <span className={`${styles.milestoneText} ${!isUnlocked ? styles.milestoneLocked : ''}`}>
                                {badge.milestone}
                            </span>
                        </button>
                    );
                })}
            </div>

            <Modal
                open={selectedBadge !== null}
                onClose={() => setSelectedBadge(null)}
                size="sm"
                showClose={false}
            >
                {selectedBadge && (
                    <div className={styles.modalContent}>
                        <button type="button" className={styles.modalClose} onClick={() => setSelectedBadge(null)} aria-label="Close">
                            <X size={18} />
                        </button>

                        <img src={selectedBadge.image} alt={selectedBadge.title} className={styles.modalBadgeImage} />

                        <p className={styles.modalTitle}>{hasUnlockedSelected ? 'Congratulations!' : 'Keep swapping!'}</p>
                        <p className={styles.modalSubtitle}>Complete {selectedBadge.milestone} swaps</p>
                        <p className={styles.modalBody}>
                            {hasUnlockedSelected
                                ? `This is a significant step towards expanding your shared library space. By reaching the ${selectedBadge.title} milestone, you've helped build a vibrant community of literature sharing.`
                                : `You are currently a ${highestUnlockedBadge?.title || 'Reader'}. Complete more book swaps to unlock the ${selectedBadge.title} badge and keep sharing stories!`}
                        </p>

                        {hasUnlockedSelected && (
                            <>
                                <p className={styles.sharePrompt}>Share with a friend</p>
                                <Button onClick={() => handleShare(selectedBadge)}>Share</Button>
                            </>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}
