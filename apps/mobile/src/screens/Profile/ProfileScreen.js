import React, { useState, useEffect } from 'react';
import { useAuth } from '@readme/shared/src/contexts/AuthContext';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Iconify } from 'react-native-iconify';
import { useTheme } from '@readme/shared/src/hooks/use-theme';
import { Colors } from '@readme/shared/src/constants/theme';
import { ROUTES } from '@readme/shared/src/constants/routes';
import { buildProfileStyles } from '../../styles/profileStyles';
import { MenuGroup, MenuItem, MenuSwitchItem } from '../../components/ui/MenuComponents';

import { useScrollTabBarControl } from '../../hooks/use-scroll-tab-bar-control';

import { useProfileActions } from '@readme/shared/src/hooks/use-profile-actions';

import { getHighestUnlockedBadge } from '@readme/shared/src/utils/gamificationUtils';


export default function ProfileScreen({ navigation }) {
    const theme = useTheme();
    const styles = buildProfileStyles(theme);

    const { currentUser, refreshUser } = useAuth(); 
    const [focusKey, setFocusKey] = useState(0);
    const handleScroll = useScrollTabBarControl();

    const currentSwapsCompleted = currentUser?.gamification?.completedSwapsCount ?? 0;
    const currentBadge = getHighestUnlockedBadge(currentSwapsCompleted);

    const {
        uploading, hasNotifications,
        pickImage, handleNotificationsToggle, handleSignOut
    } = useProfileActions(currentUser, refreshUser);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            setFocusKey(prev => prev + 1);
            if (refreshUser) refreshUser();
        });
        return unsubscribe;
    }, [navigation, refreshUser]);

    return (
        <View style={styles.container}>

            {/* --- HEADER SECTION(estático) --- */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Account</Text>

                <View>
                    <TouchableOpacity onPress={pickImage} disabled={uploading}>
                        <View style={styles.avatarContainer }>
                            { currentUser?.photoURL ? (
                                <Image 
                                    source={{ 
                                        uri: `${currentUser?.photoURL}?t=${focusKey}_${new Date().getTime()}` 

                                    }} 

                                    style={styles.profilePicture} 
                                />

                            ) : (
                                    <Iconify icon="lucide:user" size={45} color={theme.text} />
                                )}

                            {uploading && (
                                <ActivityIndicator size="large" color="#0000ff" style={{ position: 'absolute' }} />
                            )}
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={styles.userInfo}>
                    <View style={styles.userNameContainer}>
                        <Text style={styles.userName}>
                            { currentUser?.username || 'Username' }
                        </Text>
                        {currentBadge && (
                            <Image
                                source={currentBadge.image}
                                style={{ width: 25, height: 25 }}
                                resizeMode="contain"
                            />
                        )}
                    </View>
                    <Text style={styles.userEmail}>
                        { currentUser?.email || 'Email' }
                    </Text>
                </View>
            </View>

            {/* --- BODY SECTION(móvel) --- */}
            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
                overScrollMode="never"
                onScroll={handleScroll}
                scrollEventThrottle={16}
            >
                {/* O "Papel" que desliza por cima */}
                <View style={styles.body}>

                    {/* GROUP 1 */}
                    <MenuGroup styles={styles} bgColor={theme.groupShadow}>
                        <MenuItem
                            styles={styles}
                            theme={theme}
                            icon="lucide:book"
                            label="My Books"
                            onPress={() => navigation.navigate(ROUTES.MY_BOOKS)}
                        />
                        <MenuItem
                            styles={styles}
                            theme={theme}
                            icon="lucide:heart"
                            label="Favorites"
                            onPress={() => navigation.navigate(ROUTES.FAVORITES)}
                        />
                        <MenuItem
                            styles={styles}
                            theme={theme}
                            icon="lucide:star"
                            label="Reviews"
                            onPress={() => navigation.navigate(ROUTES.REVIEWS)}
                        />
                        <MenuItem
                            styles={styles}
                            theme={theme}
                            icon="solar:medal-star-circle-linear"
                            label="Level"
                            onPress={() => navigation.navigate(ROUTES.LEVELS)}
                        />
                    </MenuGroup>

                    {/* GROUP 2 */}
                    <MenuGroup styles={styles} bgColor={theme.groupShadow}>
                        <MenuItem
                            styles={styles}
                            theme={theme}
                            icon="lucide:edit"
                            label="Edit Profile"
                            onPress={() => navigation.navigate(ROUTES.EDIT_PROFILE)}
                        />
                        <MenuItem
                            styles={styles}
                            theme={theme}
                            icon="material-symbols:password"
                            label="Privacy & Security"
                            onPress={() => navigation.navigate(ROUTES.PRIVACY_SECURITY)}
                        />
                        <MenuItem
                            styles={styles}
                            theme={theme}
                            icon="fluent:presence-blocked-10-regular"
                            label="View Blocked Users"
                            onPress={() => navigation.navigate(ROUTES.BLOCKED_USERS)}
                        />
                        <MenuSwitchItem
                            styles={styles}
                            theme={theme}
                            icon={hasNotifications ? "fluent:alert-24-regular" : "fluent:alert-off-24-regular"}
                            label={hasNotifications ? "Allow notifications" : "Pause notifications"}
                            value={hasNotifications}
                            onValueChange={handleNotificationsToggle}
                        />
                    </MenuGroup>

                    {/* GROUP 3 */}
                    <MenuGroup styles={styles} bgColor={theme.groupShadow}>
                        <MenuItem 
                            styles={styles}
                            theme={theme}
                            icon="lucide:log-out" 
                            label="Sign Out" 
                            textColor={Colors.password.red} 
                            iconColor={Colors.password.red}
                            iconBgColor={`${Colors.password.red}35`}
                            onPress={handleSignOut}
                        />
                    </MenuGroup>

                </View>
            </ScrollView>
        </View>
    );
}
