import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { auth } from '@readme/shared/src/services/firebase';
import { doBlockUser } from '@readme/shared/src/services/block';
import { UsersService } from '@readme/shared/src/services/users';
import { PublicationService } from '@readme/shared/src/services/publications';
import { ReviewService } from '@readme/shared/src/services/reviews';
import { getHighestUnlockedBadge } from '@readme/shared/src/utils/gamificationUtils';
import { ReportsService } from '@readme/shared/src/services/reports';
import { REPORT_TARGET_TYPE, REPORT_REASON_LABELS } from '@readme/shared/src/constants/status';

export function usePublicProfile(userId, navigation) {
    const [profile, setProfile] = useState(null);
    const [publications, setPublications] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('publications');
    const [isFollowing, setIsFollowing] = useState(false);
    const [isRequestPending, setIsRequestPending] = useState(false);

    const currentUserUid = auth?.currentUser?.uid;

    const loadProfileData = useCallback(async (showRefreshIndicator = false) => {
        if (!userId) {
            Alert.alert("Error", "User ID not found.");
            setLoading(false);
            return;
        }

        if (showRefreshIndicator) setRefreshing(true);
        else setLoading(true);

        try {
            const [profileData, publicationsData, reviewsData] = await Promise.all([
                UsersService.fetchUserProfile(userId),
                PublicationService.fetchUserPublications(userId),
                ReviewService.fetchUserReviews(userId)
            ]);

            setProfile(profileData);
            setPublications(publicationsData || []);
            setReviews(reviewsData || []);
            setIsFollowing(profileData?.isCurrentUserFollowing || false);
            setIsRequestPending(profileData?.isRequestPending || false);
        } catch (error) {
            console.error("Error loading profile data:", error);
            Alert.alert("Error", "Failed to load profile details. Please try again.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [userId]);

    useEffect(() => {
        loadProfileData();
    }, [loadProfileData]);

    const handleFollowToggle = useCallback(async () => {
        const isTargetPrivate = profile?.profileVisibility === 'private';

        if (isTargetPrivate && !isFollowing) {
            setIsRequestPending(true);
            try {
                await UsersService.toggleFollowUser(userId, true, true);
            } catch (error) {
                console.error("Error sending follow request:", error);
                setIsRequestPending(false);
                Alert.alert("Error", "Could not send follow request.");
            }
            return;
        }

        const previousFollowingState = isFollowing;
        setIsFollowing(!previousFollowingState);

        try {
            await UsersService.toggleFollowUser(userId, !previousFollowingState, false);
        } catch (error) {
            console.error("Error updating follow status:", error);
            setIsFollowing(previousFollowingState);
            Alert.alert("Error", "Could not update follow status.");
        }
    }, [userId, isFollowing, profile]);

    const handleBlockUser = useCallback(async () => {
        if (!currentUserUid) {
            Alert.alert("Error", "You must be logged in to block a user.");
            return;
        }

        try {
            await doBlockUser(currentUserUid, userId);

            Alert.alert(
                "User Blocked",
                `You have blocked ${profile?.username || 'this user'}. You will no longer see their content.`,
                [{
                    text: "OK",
                    onPress: () => {
                        if (navigation?.canGoBack()) {
                            navigation.popToTop();
                        }
                    }
                }]
            );
        } catch (error) {
            console.error("Error blocking user:", error);
            Alert.alert("Error", "Could not block the user at this time. Please try again.");
        }
    }, [userId, profile, navigation, currentUserUid]);

    const submitAccountReport = useCallback(async (reason) => {
        try {
            const snapshot = ReportsService.buildAccountSnapshot(profile);

            await ReportsService.submitReport(
                currentUserUid,
                REPORT_TARGET_TYPE.ACCOUNT,
                userId,
                userId,
                reason,
                snapshot
            );

            Alert.alert("Report Submitted", "Thanks — our team will review this profile.");
        } catch (error) {
            console.error("Error reporting profile:", error);
            Alert.alert("Something Went Wrong", "We couldn't submit your report. Please try again.");
        }
    }, [profile, userId, currentUserUid]);

    const handleReportProfile = useCallback(() => {
        if (!currentUserUid) {
            Alert.alert("Error", "You must be logged in to report a user.");
            return;
        }

        if (!userId) {
            Alert.alert("Something Went Wrong", "We couldn't identify who to report. Please try again.");
            return;
        }

        Alert.alert(
            "Report Profile",
            "Why are you reporting this profile?",
            [
                { text: "Cancel", style: "cancel" },
                ...Object.entries(REPORT_REASON_LABELS).map(([reason, label]) => ({
                    text: label,
                    onPress: () => submitAccountReport(reason)
                }))
            ]
        );
    }, [userId, currentUserUid, submitAccountReport]);

    const handleOpenOptions = useCallback(() => {
        Alert.alert("User Options", `What would you like to do with ${profile?.username || 'this user'}?`, [
            { text: "Cancel", style: "cancel" },
            { text: "Report User", onPress: handleReportProfile },
            {
                text: "Block User",
                style: "destructive",
                onPress: () => {
                    Alert.alert(
                        "Confirm Block",
                        `Are you sure you want to block ${profile?.username || 'this user'}?`,
                        [
                            { text: "Cancel", style: "cancel" },
                            { text: "Block", style: "destructive", onPress: handleBlockUser }
                        ]
                    );
                }
            }
        ]);
    }, [profile, handleBlockUser, handleReportProfile]);

    // --- Derived values ---
    const isValidPhoto = profile?.photoURL && profile.photoURL !== 'null' && profile.photoURL.trim() !== '';
    const currentBadge = getHighestUnlockedBadge(profile?.gamification?.completedSwapsCount ?? 0);

    let displayedFollowers = profile?.followers || 0;
    if (profile) {
        if (isFollowing && !profile.isCurrentUserFollowing) {
            displayedFollowers += 1;
        } else if (!isFollowing && profile.isCurrentUserFollowing) {
            displayedFollowers -= 1;
        }
    }

    return {
        profile,
        publications,
        reviews,
        loading,
        refreshing,
        activeTab,
        setActiveTab,
        isFollowing,
        isRequestPending,
        isValidPhoto,
        currentBadge,
        displayedFollowers,
        loadProfileData,
        handleFollowToggle,
        handleOpenOptions,
    };
}