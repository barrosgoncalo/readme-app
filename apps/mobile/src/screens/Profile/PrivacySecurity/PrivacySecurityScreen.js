import React, { useState } from 'react';
import { 
    View,
    Text,
    TouchableOpacity,
    Alert,
    useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { buildPrivacySecurityStyles } from '../../../styles/privacySecurityStyles';
import { Iconify } from 'react-native-iconify';
import { Colors } from '@readme/shared/src/constants/theme';
import { ROUTES } from '@readme/shared/src/constants/routes';

import { useAuth } from '@readme/shared/src/contexts/AuthContext'; 
import { doUpdateUserProfile } from '@readme/shared/src/services/auth';

import { MenuGroup, MenuItem, MenuSwitchItem } from '../../../components/ui/MenuComponents';

export default function PrivacySecurityScreen({ navigation }) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const styles = buildPrivacySecurityStyles(theme);

    const { currentUser, refreshUser } = useAuth();

    const [isPrivate, setIsPrivate] = useState(currentUser?.profileVisibility === 'private');

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
        alert("Delete account flow initiated");
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>

                {/* --- CUSTOM HEADER --- */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
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
                            onPress={() => navigation.navigate(ROUTES.CHANGE_PASSWORD)}
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
                            textColor={Colors.password?.red || '#F13B2D'}
                            iconColor={Colors.password?.red || '#F13B2D'}
                            iconBgColor={`${Colors.password?.red || '#F13B2D'}35`}
                            onPress={handleDeleteAccount}
                        />
                    </MenuGroup>

                </View>
            </View>
        </SafeAreaView>
    );
}
