import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '@readme/shared/src/contexts/AuthContext';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator, Animated } from 'react-native';
import { Iconify } from 'react-native-iconify';
import { useTheme } from '@readme/shared/src/hooks/use-theme';
import { Colors } from '@readme/shared/src/constants/theme';
import { ROUTES } from '@readme/shared/src/constants/routes';
import { buildProfileStyles } from '../../styles/profileStyles';
import { MenuGroup, MenuItem, MenuSwitchItem } from '../../components/ui/MenuComponents';
import { useScrollTabBarControl } from '../../hooks/use-scroll-tab-bar-control';
import { useProfileActions } from '@readme/shared/src/hooks/use-profile-actions';
import { getHighestUnlockedBadge } from '@readme/shared/src/utils/gamificationUtils';

import { UsersService } from '@readme/shared/src/services/users'; 

export default function ProfileScreen({ navigation }) {
    const theme = useTheme();
    const styles = buildProfileStyles(theme);

    const { currentUser, refreshUser } = useAuth(); 
    const [focusKey, setFocusKey] = useState(0);

    const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

    const handleScroll = useScrollTabBarControl();

    const currentSwapsCompleted = currentUser?.gamification?.completedSwapsCount ?? 0;
    const currentBadge = getHighestUnlockedBadge(currentSwapsCompleted);

    const {
        uploading, hasNotifications,
        pickImage, handleNotificationsToggle, handleSignOut
    } = useProfileActions(currentUser, refreshUser);

    const scrollY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', async () => {
            setFocusKey(prev => prev + 1);
            if (refreshUser) refreshUser();

            if (currentUser?.uid) {
                try {
                    const requests = await UsersService.fetchPendingFollowRequests(currentUser.uid);
                    setPendingRequestsCount(requests.length);
                } catch (error) {
                    console.error("Error fetching requests:", error);
                }
            }
        });
        return unsubscribe;
    }, [navigation, refreshUser, currentUser?.uid]);

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
                        listener: handleScroll // This keeps your tab-bar hiding logic working!
                    }
                )}
            >
                {/* --- HEADER SECTION (Stays fixed in background) --- */}
                <Animated.View style={[
                    styles.header, 
                    { 
                        zIndex: 1, 
                        // This exact translation counters the scroll, gluing it to the screen
                        transform: [{ translateY: scrollY }] 
                    }
                ]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingHorizontal: 20 }}>
                        <Text style={styles.headerTitle}>Account</Text>

                        <TouchableOpacity 
                            style={{ position: 'relative', padding: 8 }}
                            onPress={() => navigation.navigate(ROUTES.FOLLOW_REQUESTS)}
                        >
                            <Iconify icon="lucide:bell" size={26} color="#FFFFFF" />
                            {pendingRequestsCount > 0 && (
                                <View style={{ position: 'absolute', top: 4, right: 4, backgroundColor: Colors.password.red, borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 }}>
                                    <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
                                        {pendingRequestsCount > 99 ? '99+' : pendingRequestsCount}
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
                            {currentBadge && <Image source={currentBadge.image} style={{ width: 25, height: 25 }} resizeMode="contain" />}
                        </View>
                        <Text style={styles.userEmail}>{ currentUser?.email || 'Email' }</Text>
                    </View>
                </Animated.View>

                {/* --- BODY SECTION (Slides over the header) --- */}
                {/* IMPORTANT: Ensure this view has a solid backgroundColor and zIndex: 2 in your styles */}
                <View style={[styles.body, { zIndex: 2, elevation: 2, backgroundColor: theme.background }]}>

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
        </View>
    );
}
