import React, { useState } from 'react';
import { 
    View,
    Text,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    StyleSheet,
    Modal,
    TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { buildPrivacySecurityStyles } from '../../../styles/privacySecurityStyles';
import { Iconify } from 'react-native-iconify';
import { useTheme } from '@readme/shared/src/hooks/use-theme';
import { Colors } from '@readme/shared/src/constants/theme';
import { ROUTES } from '@readme/shared/src/constants/routes';

import { useAuth } from '@readme/shared/src/contexts/AuthContext'; 
import { doUpdateUserProfile, doDeleteUserProfile, doReauthenticateWithPassword } from '@readme/shared/src/services/auth';

import { MenuGroup, MenuItem, MenuSwitchItem } from '../../../components/ui/MenuComponents';

export default function PrivacySecurityScreen({ navigation }) {
    const theme = useTheme();
    const styles = buildPrivacySecurityStyles(theme);

    const { currentUser, refreshUser } = useAuth();

    const [isPrivate, setIsPrivate] = useState(currentUser?.profileVisibility === 'private');
    
    const [isDeleting, setIsDeleting] = useState(false);

    const [isReauthModalVisible, setIsReauthModalVisible] = useState(false);
    const [password, setPassword] = useState('');

    const handlePrivacyToggle = async (newValue) => {
        setIsPrivate(newValue);

        try {
            await doUpdateUserProfile(currentUser.uid, {
                profileVisibility: newValue ? 'private' : 'public'
            });

            await refreshUser();

        } catch (error) {
            console.error("Error updating visibility:", error);
            Alert.alert("Error", "Failed to update privacy settings. Please try again.");
            setIsPrivate(!newValue);
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            "Delete Account",
            "Are you absolutely sure you want to delete your account? This action cannot be undone and you will lose all your data.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete", 
                    style: "destructive",
                    onPress: async () => {
                        setIsDeleting(true);
                        try {
                            if (!currentUser?.uid) throw new Error('Not authenticated.');
                            
                            await doDeleteUserProfile(currentUser.uid);
                            
                        } catch (error) {
                            if (error.code === 'auth/requires-recent-login') {
                                setIsReauthModalVisible(true);
                            } else {
                                Alert.alert('Error', error.message);
                            }
                        } finally {
                            setIsDeleting(false);
                        }
                    }
                }
            ]
        );
    };

    const handleReauthenticateAndDelete = async () => {
        if (!password) {
            Alert.alert("Error", "Please enter your password.");
            return;
        }

        setIsDeleting(true);
        try {
            await doReauthenticateWithPassword(password);

            setIsReauthModalVisible(false);
            setPassword('');

            await doDeleteUserProfile(currentUser.uid);

        } catch (error) {
            console.error("Reauth error:", error);
            Alert.alert("Authentication Failed", "The password you entered is incorrect. Please try again.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>

                {/* --- CUSTOM HEADER --- */}
                <View style={styles.header}>
                    <TouchableOpacity 
                        onPress={() => navigation.goBack()} 
                        style={styles.backButton}
                        disabled={isDeleting}
                    >
                        <Iconify icon="lucide:arrow-left" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Privacy and Security</Text>
                    <View style={{ width: 24 }} /> 
                </View>

                {/* --- CONTENT --- */}
                <View style={styles.content}>

                    {/* SECTION 1: PRIVACY */}
                    <Text style={styles.sectionTitle}>Privacy</Text>
                    <MenuGroup styles={styles} bgColor={theme.groupShadow}>
                        <MenuSwitchItem
                            styles={styles}
                            theme={theme}
                            icon={isPrivate ? "lucide:lock" : "lucide:globe"}
                            label={isPrivate ? "Private Account" : "Public Account"}
                            value={isPrivate}
                            onValueChange={handlePrivacyToggle}
                            disabled={isDeleting}
                        />
                    </MenuGroup>
                    <Text style={styles.helperText}>
                        {isPrivate 
                            ? "Only approved users can see your library and request book swaps." 
                            : "Anyone can see your library and request book swaps with you."}
                    </Text>

                    {/* SECTION 2: SECURITY */}
                    <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Security</Text>
                    <MenuGroup styles={styles} bgColor={theme.groupShadow}>
                        <MenuItem
                            styles={styles}
                            theme={theme}
                            icon="material-symbols:password"
                            label="Change Password"
                            onPress={() => !isDeleting && navigation.navigate(ROUTES.CHANGE_PASSWORD)}
                        />
                    </MenuGroup>

                    {/* SECTION 3: DANGER ZONE */}
                    <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Account Management</Text>
                    <MenuGroup styles={styles} bgColor={theme.groupShadow}>
                        <MenuItem
                            styles={styles}
                            theme={theme}
                            icon="uiw:user-delete"
                            label="Delete Account"
                            textColor={Colors.password?.red}
                            iconColor={Colors.password?.red}
                            iconBgColor={`${Colors.password?.red}35`}
                            onPress={handleDeleteAccount}
                        />
                    </MenuGroup>

                </View>

                {/* --- LOADING OVERLAY --- */}
                {isDeleting && (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', zIndex: 999 }]}>
                        <ActivityIndicator size="large" color={Colors.password?.red || '#F13B2D'} />
                        <Text style={{ color: 'white', marginTop: 12, fontWeight: '600' }}>Deleting account...</Text>
                    </View>
                )}

                <Modal
                    visible={isReauthModalVisible}
                    transparent={true}
                    animationType="fade"
                >
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }]}>
                        <View style={{ backgroundColor: theme.background, padding: 24, borderRadius: 12 }}>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 8 }}>Security Check</Text>
                            <Text style={{ color: theme.textSecondary, marginBottom: 16 }}>
                                Please enter your password to confirm you want to delete your account.
                            </Text>
                            
                            <TextInput
                                style={{ 
                                    borderWidth: 1, borderColor: theme.border, borderRadius: 8, 
                                    padding: 12, color: theme.text, marginBottom: 20 
                                }}
                                placeholder="Enter your password"
                                placeholderTextColor={theme.textSecondary}
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                                autoCapitalize="none"
                            />

                            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
                                <TouchableOpacity 
                                    style={{ paddingVertical: 10, paddingHorizontal: 16 }}
                                    onPress={() => {
                                        setIsReauthModalVisible(false);
                                        setPassword('');
                                    }}
                                >
                                    <Text style={{ color: theme.text }}>Cancel</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    style={{ backgroundColor: Colors.password?.red || '#F13B2D', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 }}
                                    onPress={handleReauthenticateAndDelete}
                                >
                                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Confirm Delete</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

            </View>
        </SafeAreaView>
    );
}
