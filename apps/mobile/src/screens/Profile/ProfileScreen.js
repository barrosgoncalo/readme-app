import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '@readme/shared/src/contexts/AuthContext';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, Animated, Modal, FlatList } from 'react-native';
import { Iconify } from 'react-native-iconify';
import { useTheme } from '@readme/shared/src/hooks/use-theme';
import { Colors } from '@readme/shared/src/constants/theme';
import { ROUTES } from '@readme/shared/src/constants/routes';
import { buildProfileStyles } from '../../styles/profileStyles';
import { MenuGroup, MenuItem, MenuSwitchItem } from '../../components/ui/MenuComponents';
import { useScrollTabBarControl } from '../../hooks/use-scroll-tab-bar-control';
import { useProfileActions } from '@readme/shared/src/hooks/use-profile-actions';
import { getHighestUnlockedBadge } from '@readme/shared/src/utils/gamificationUtils';
import { useMyPostings } from '@readme/shared/src/hooks/use-my-postings';
import { DB } from '@readme/shared/src/services/DB';

export default function ProfileScreen({ navigation }) {
    const theme = useTheme();
    const styles = buildProfileStyles(theme);

    const { currentUser, refreshUser } = useAuth(); 
    const [focusKey, setFocusKey] = useState(0);

    const handleScroll = useScrollTabBarControl();

    // Fetch the user's publications count cleanly using your existing hook
    const { myBooks } = useMyPostings(currentUser?.uid);

    const currentSwapsCompleted = currentUser?.gamification?.completedSwapsCount ?? 0;
    const currentBadge = getHighestUnlockedBadge(currentSwapsCompleted);

    const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

    // States for your new interactive Follower/Following Modal
    const [modalVisible, setModalVisible] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalUsers, setModalUsers] = useState([]);
    const [modalLoading, setModalLoading] = useState(false);

    const {
        uploading, hasNotifications,
        pickImage, handleNotificationsToggle, handleSignOut
    } = useProfileActions(currentUser, refreshUser);

    const scrollY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const unsubscribeFocus = navigation.addListener('focus', () => {
            setFocusKey(prev => prev + 1);
            if (refreshUser) refreshUser();
        });

        let unsubscribeRealTime = () => {}; 
        if (currentUser?.uid) {
            const { UsersService } = require('@readme/shared/src/services/users');

            unsubscribeRealTime = UsersService.subscribeToUnreadNotificationsCount(
                currentUser.uid, 
                (newCount) => setUnreadNotificationsCount(newCount)
            );
        }

        return () => {
            unsubscribeFocus();
            unsubscribeRealTime();
        };
    }, [navigation, refreshUser, currentUser?.uid]);

    // Handles querying active followers or following records and building profiles
    const handleOpenFollowModal = async (type) => {
        if (!currentUser?.uid) return;

        const isFollowers = type === 'followers';
        setModalTitle(isFollowers ? 'Followers' : 'Following');
        setModalVisible(true);
        setModalLoading(true);
        setModalUsers([]);

        try {
            const { UsersService } = require('@readme/shared/src/services/users');
            const { DB } = require('@readme/shared/src/services/DB');
            let records = [];

            // 1. Query the database using the exact schema fields from your follow model
            if (isFollowers) {
                // People following you (You are the 'followingUid')
                records = await DB.get('follows', [
                    { field: 'followingUid', operator: '==', value: currentUser.uid }
                ]);
            } else {
                // People you follow (You are the 'followerUid')
                records = await DB.get('follows', [
                    { field: 'followerUid', operator: '==', value: currentUser.uid }
                ]);
            }

            // 2. Extract the opposing user's UID and STRICTLY filter out your own UID
            const uids = records
            .map(rec => isFollowers ? rec.followerUid : rec.followingUid)
            .filter(uid => uid && uid !== currentUser.uid); // <-- THIS PREVENTS YOU FROM SEEING YOURSELF

            const uniqueUids = [...new Set(uids)];

            if (uniqueUids.length > 0) {
                let mappedUsers = [];

                // 3. Batch requests into chunks of 10 to satisfy Firestore's 'in' constraint
                for (let i = 0; i < uniqueUids.length; i += 10) {
                    const chunk = uniqueUids.slice(i, i + 10);
                    const profilesMap = await UsersService.fetchAllUsersProfile(chunk);

                    if (profilesMap) {
                        const chunkUsers = Object.keys(profilesMap).map(uid => ({
                            uid,
                            ...profilesMap[uid]
                        }));
                        mappedUsers = [...mappedUsers, ...chunkUsers];
                    }
                }

                setModalUsers(mappedUsers);
            }
        } catch (error) {
            console.error("Error opening profile connection modal:", error);
        } finally {
            setModalLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Animated.ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
                overScrollMode="never"
                scrollEventThrottle={16}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { 
                        useNativeDriver: true, 
                        listener: handleScroll 
                    }
                )}
            >
                {/* --- HEADER SECTION --- */}
                <Animated.View style={[
                    styles.header, 
                    { 
                        zIndex: 1, 
                        transform: [{ translateY: scrollY }] 
                    }
                ]}>
                    <View style={{ 
                        flexDirection: 'row', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        width: '100%', 
                        paddingHorizontal: 30,
                        marginTop: 70
                    }}>
                        <Text style={styles.headerTitle}>Account</Text>

                        <TouchableOpacity 
                            style={{ position: 'relative', padding: 8 }}
                            onPress={() => navigation.navigate(ROUTES.NOTIFICATIONS)}
                        >
                            <Iconify icon="lucide:bell" size={26} color="#FFFFFF" />
                            {unreadNotificationsCount > 0 && (
                                <View style={{ position: 'absolute', top: 4, right: 4, backgroundColor: Colors.password.red, borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 }}>
                                    <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
                                        {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.avatarContainer}>
                        { currentUser?.photoURL ? (
                            <Image source={{ uri: `${currentUser?.photoURL}?t=${focusKey}_${new Date().getTime()}` }} style={styles.profilePicture} />
                        ) : (
                                <Iconify icon="lucide:user" size={45} color={theme.text} />
                            )}
                        {uploading && <ActivityIndicator size="large" color="#0000ff" style={{ position: 'absolute' }} />}
                    </View>

                    <View style={styles.userInfo}>
                        <View style={styles.userNameContainer}>
                            <Text style={styles.userName}>{ currentUser?.username || 'Username' }</Text>
                            {currentBadge && <Image source={currentBadge.image} style={{ width: 25, height: 25 }} contentFit="contain" />}
                        </View>
                        <Text style={styles.userEmail}>{ currentUser?.email || 'Email' }</Text>
                    </View>

                    {/* --- STATS BAR INTEGRATION --- */}
                    <View style={{ 
                        flexDirection: 'row', 
                        justifyContent: 'center', 
                        gap: 5,
                        width: '100%', 
                        marginTop: 12, 
                        paddingBottom: 40
                    }}>
                        <TouchableOpacity style={{ alignItems: 'center', width: 90 }} onPress={() => navigation.navigate(ROUTES.MY_BOOKS)}>
                            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' }}>{myBooks?.length ?? 0}</Text>
                            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 }}>Publications</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={{ alignItems: 'center', width: 90 }} onPress={() => handleOpenFollowModal('followers')}>
                            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' }}>{currentUser?.followersCount ?? 0}</Text>
                            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 }}>Followers</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={{ alignItems: 'center', width: 90 }} onPress={() => handleOpenFollowModal('following')}>
                            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' }}>{currentUser?.followingCount ?? 0}</Text>
                            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 }}>Following</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                {/* --- BODY SECTION (Slides over the header) --- */}
                <View style={[
                    styles.body, 
                    { 
                        zIndex: 2, 
                        elevation: 2, 
                        backgroundColor: theme.background,
                        marginTop: 30
                    }
                ]}>

                    {/* GROUP 1 */}
                    <MenuGroup styles={styles} bgColor={theme.groupShadow}>
                        <MenuItem styles={styles} theme={theme} icon="lucide:book" label="My Books" onPress={() => navigation.navigate(ROUTES.MY_BOOKS)} />
                        <MenuItem styles={styles} theme={theme} icon="lucide:heart" label="Favorites" onPress={() => navigation.navigate(ROUTES.FAVORITES)} />
                        <MenuItem styles={styles} theme={theme} icon="lucide:star" label="Reviews" onPress={() => navigation.navigate(ROUTES.REVIEWS)} />
                        <MenuItem styles={styles} theme={theme} icon="solar:medal-star-circle-linear" label="Level" onPress={() => navigation.navigate(ROUTES.LEVELS)} />
                    </MenuGroup>

                    {/* GROUP 2 */}
                    <MenuGroup styles={styles} bgColor={theme.groupShadow}>
                        <MenuItem styles={styles} theme={theme} icon="lucide:edit" label="Edit Profile" onPress={() => navigation.navigate(ROUTES.EDIT_PROFILE)} />
                        <MenuItem styles={styles} theme={theme} icon="material-symbols:password" label="Privacy & Security" onPress={() => navigation.navigate(ROUTES.PRIVACY_SECURITY)} />
                        <MenuItem styles={styles} theme={theme} icon="fluent:presence-blocked-10-regular" label="View Blocked Users" onPress={() => navigation.navigate(ROUTES.BLOCKED_USERS)} />
                        <MenuSwitchItem styles={styles} theme={theme} icon={hasNotifications ? "fluent:alert-24-regular" : "fluent:alert-off-24-regular"} label={hasNotifications ? "Allow notifications" : "Pause notifications"} value={hasNotifications} onValueChange={handleNotificationsToggle} />
                    </MenuGroup>

                    {/* GROUP 3 */}
                    <MenuGroup styles={styles} bgColor={theme.groupShadow}>
                        <MenuItem styles={styles} theme={theme} icon="lucide:log-out" label="Sign Out" textColor={Colors.password.red} iconColor={Colors.password.red} iconBgColor={`${Colors.password.red}35`} onPress={handleSignOut} />
                    </MenuGroup>

                </View>
            </Animated.ScrollView>

            {/* --- INTERACTIVE USER MODAL POPUP --- */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
                    <View style={{ backgroundColor: theme.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '65%', paddingBottom: 24 }}>
                        
                        {/* Modal Drag Bar / Header */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: theme.groupShadow }}>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>{modalTitle}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ padding: 4 }}>
                                <Iconify icon="lucide:x" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        {/* Modal Content Switch */}
                        {modalLoading ? (
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                <ActivityIndicator size="large" color={theme.text} />
                            </View>
                        ) : modalUsers.length === 0 ? (
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                                <Iconify icon="lucide:users" size={40} color="gray" style={{ marginBottom: 8 }} />
                                <Text style={{ color: 'gray', fontSize: 14 }}>No users found here yet.</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={modalUsers}
                                keyExtractor={(item) => item.uid}
                                contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12 }}
                                renderItem={({ item }) => (
                                    <TouchableOpacity 
                                        style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: 'rgba(128,128,128,0.2)' }}
                                        onPress={() => {
                                            setModalVisible(false); // Hide overlay
                                            navigation.navigate(ROUTES.PUBLIC_PROFILE, { userId: item.uid }); // Routes to dynamic profile screen
                                        }}
                                    >
                                        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(128,128,128,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 14, overflow: 'hidden' }}>
                                            {item.avatarUrl ? (
                                                <Image source={{ uri: item.avatarUrl }} style={{ width: '100%', height: '100%' }} />
                                            ) : (
                                                <Iconify icon="lucide:user" size={20} color={theme.text} />
                                            )}
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text }}>{item.fullName || 'Unnamed User'}</Text>
                                            {item.username && <Text style={{ fontSize: 13, color: 'gray', marginTop: 2 }}>@{item.username}</Text>}
                                        </View>
                                        <Iconify icon="lucide:chevron-right" size={18} color="gray" />
                                    </TouchableOpacity>
                                )}
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}
