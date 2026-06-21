import React, { useState, useEffect } from 'react';
import { useAuth } from '@readme/shared/src/contexts/AuthContext';
import { View, Text, Image, TouchableOpacity, ScrollView, Alert, Switch, useColorScheme, ActivityIndicator } from 'react-native';
import { Iconify } from 'react-native-iconify';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@readme/shared/src/constants/theme';
import { ROUTES } from '@readme/shared/src/constants/routes';
import { doSignOut, doUpdateUserProfile } from '@readme/shared/src/services/auth';
import { buildStyles } from '../../styles/profileStyles';
import { uploadProfilePicture } from '@readme/shared/src/services/user';
import { MenuGroup, MenuItem, MenuSwitchItem } from '../../components/ui/MenuComponents';

import { useScrollTabBarControl } from '../../hooks/use-scroll-tab-bar-control';

export default function ProfileScreen({ navigation }) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const styles = buildStyles(theme);

    const { currentUser, refreshUser } = useAuth(); 
    const [uploading, setUploading] = useState(false);
    const [focusKey, setFocusKey] = useState(0);

    const [hasNotifications, setHasNotifications] = useState(
        currentUser?.notificationSettings?.pushEnabled ?? false
    );

    const handleScroll = useScrollTabBarControl();

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            setFocusKey(prev => prev + 1);

            if (refreshUser) {
                refreshUser();
            }
        });

        return unsubscribe;
    }, [navigation, refreshUser]);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            const imageUri = result.assets[0].uri;
            handleUpload(imageUri);
        }
    };

    const handleUpload = async (imageUri) => {
        setUploading(true);
        try {
            await uploadProfilePicture(currentUser.uid, imageUri);
            alert("Foto atualizada com sucesso!");
        } catch (error) {
            alert("Erro ao atualizar a foto.");
        } finally {
            setUploading(false);
        }
    };

    const handleNotificationsToggle = async (newValue) => {
        setHasNotifications(newValue);
        try {
            await doUpdateUserProfile(currentUser.uid, {
                'notificationSettings.pushEnabled': newValue
            });

            await refreshUser();

        } catch (error) {
            console.error("Error updating notifications settings:", error);
            Alert.alert("Error", "Failed to update notifications settings. Please try again.");
            setHasNotifications(!newValue);
        }
    }

    const handleSignOut = async () => {
        console.log("A terminar sessão...");
        await doSignOut();
    };

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
                        <Iconify 
                            icon="material-symbols:verified"
                            size={20}
                            color="#F58B2E" />
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
                        />
                        <MenuItem
                            styles={styles}
                            theme={theme}
                            icon="lucide:heart"
                            label="Favorites"
                        />
                        <MenuItem
                            styles={styles}
                            theme={theme}
                            icon="solar:medal-star-circle-linear"
                            label="Level"
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
