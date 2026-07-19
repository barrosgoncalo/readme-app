import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { UsersService } from '@readme/shared/src/services/users';
import { DB } from '@readme/shared/src/services/DB';
import { useAuth } from '@readme/shared/src/contexts/AuthContext/web';
import { WEB_ROUTES } from '../../constants/webRoutes';
import Spinner from '../../components/Spinner.jsx';
import UserAvatar from '../../components/UserAvatar.jsx';
import { useToast } from '../../contexts/ToastContext';
import listStyles from '../../components/UserListPage.module.css';
import styles from './FollowRequests.module.css';

export default function FollowRequests() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [, showToast] = useToast(3000);

    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [requests, setRequests] = useState([]);
    const [busy, setBusy] = useState(null);

    useEffect(() => {
        if (!currentUser) return;
        let cancelled = false;
        loadRequests(cancelled);
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser]);

    async function loadRequests(cancelledFlag) {
        setLoading(true);
        setLoadError(null);
        try {
            const requestDocs = await UsersService.fetchPendingFollowRequests(currentUser.uid);
            const profiles = await Promise.all(
                requestDocs.map(async (doc) => {
                    const profile = await UsersService.fetchSummaryUserProfile(doc.requesterUid).catch(() => null);
                    // Keep the notification doc's own id separate from the requester's uid,
                    // so we can delete the correct notification doc on accept/decline.
                    return profile ? { ...profile, id: doc.requesterUid, notificationId: doc.id } : null;
                })
            );
            if (cancelledFlag) return;
            setRequests(profiles.filter(Boolean));
        } catch (err) {
            console.error('Error loading follow requests:', err);
            if (!cancelledFlag) {
                setLoadError('Could not load follow requests.');
                showToast('Could not load follow requests. Please try again.');
            }
        } finally {
            if (!cancelledFlag) setLoading(false);
        }
    }

    // Mirrors the mobile app's deleteNotification behavior, so a request resolved on
    // web doesn't leave a stale FOLLOW_REQUEST notification sitting in the DB for mobile.
    async function deleteFollowRequestNotification(notificationId) {
        if (!notificationId) return;
        try {
            await DB.remove(`users/${currentUser.uid}/notifications`, notificationId);
        } catch (err) {
            // Non-fatal: the request was still accepted/declined successfully,
            // just log so we can catch orphaned notifications.
            console.error('Failed to delete follow request notification:', err);
        }
    }

    async function handleAccept(requesterUid, notificationId) {
        setBusy(requesterUid);
        try {
            await UsersService.acceptFollowRequest(currentUser.uid, requesterUid);
            await deleteFollowRequestNotification(notificationId);
            setRequests(prev => prev.filter(r => r.id !== requesterUid));
            showToast('Follow request accepted.');
        } catch (err) {
            console.error('Error accepting request:', err);
            showToast(err?.message || 'Could not accept request. Please try again.');
        } finally {
            setBusy(null);
        }
    }

    async function handleDecline(requesterUid, notificationId) {
        setBusy(requesterUid);
        try {
            await UsersService.declineFollowRequest(currentUser.uid, requesterUid);
            await deleteFollowRequestNotification(notificationId);
            setRequests(prev => prev.filter(r => r.id !== requesterUid));
            showToast('Follow request declined.');
        } catch (err) {
            console.error('Error declining request:', err);
            showToast(err?.message || 'Could not decline request. Please try again.');
        } finally {
            setBusy(null);
        }
    }

    if (loading) return <Spinner center label="Loading follow requests" />;

    return (
        <div className={listStyles.page}>
            <div className={listStyles.header}>
                <button className={listStyles.backBtn} onClick={() => navigate(WEB_ROUTES.PROFILE)}>
                    <ArrowLeft size={20} />
                </button>
                <h1 className={listStyles.title}>Follow Requests</h1>
            </div>

            <div className={listStyles.meta}>
                <span className={listStyles.count}>
                    {requests.length} PENDING {requests.length === 1 ? 'REQUEST' : 'REQUESTS'}
                </span>
            </div>

            {loadError ? (
                <div className={listStyles.empty}>
                    {loadError}{' '}
                    <button
                        type="button"
                        className={styles.acceptBtn}
                        onClick={() => loadRequests(false)}
                    >
                        Retry
                    </button>
                </div>
            ) : requests.length === 0 ? (
                <div className={listStyles.empty}>No pending follow requests.</div>
            ) : (
                <div className={listStyles.list}>
                    {requests.map((user, i) => (
                        <div key={user.id}>
                            {i > 0 && <div className={listStyles.divider} />}
                            <div className={listStyles.row}>
                                <UserAvatar user={user} />
                                <div className={listStyles.info}>
                                    <span className={listStyles.name}>{user.fullName || user.username || 'Unknown'}</span>
                                    {user.username && <span className={listStyles.username}>@{user.username}</span>}
                                </div>
                                <div className={styles.actions}>
                                    <button
                                        type="button"
                                        className={styles.acceptBtn}
                                        onClick={() => handleAccept(user.id, user.notificationId)}
                                        disabled={busy === user.id}
                                    >
                                        {busy === user.id ? '…' : 'Accept'}
                                    </button>
                                    <button
                                        type="button"
                                        className={listStyles.actionBtn}
                                        onClick={() => handleDecline(user.id, user.notificationId)}
                                        disabled={busy === user.id}
                                    >
                                        Decline
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}