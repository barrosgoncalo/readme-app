import React, { useState } from 'react';
import { 
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Iconify } from 'react-native-iconify';
import { Colors } from '@readme/shared/src/constants/theme';
import { ROUTES } from '@readme/shared/src/constants/routes';

import { useAuth } from '@readme/shared/src/contexts/AuthContext'; 
import { doUpdateUserProfile } from '@readme/shared/src/services/auth';

import { MenuGroup, MenuItem, MenuSwitchItem } from '../../../components/ui/MenuComponents';

export default function PrivacySecurityScreen({ navigation }) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const styles = buildStyles(theme);

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
// --- ESTILOS DA PÁGINA ---
const buildStyles = (theme) => StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: theme.background || '#F3F3F3', // Cor de fundo do ecrã
    },
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.text,
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '400',
        color: theme.text,
        marginBottom: 8,
        marginLeft: 4,
    },
    helperText: {
        fontSize: 13,
        color: theme.subtext || '#888888',
        marginTop: 4,
        marginLeft: 4,
        marginRight: 4,
        lineHeight: 18,
    },

    // --- ESTILOS NECESSÁRIOS PARA OS COMPONENTES REUTILIZADOS ---
    // (Podes remover estes se o MenuComponents já importar o seu próprio stylesheet)
    menuGroup: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 30,
        backgroundColor: theme.iconBg || '#EAEAEA',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyIconPlaceholder: {
        width: 18,
        height: 18,
    },
    menuItemLabel: {
        fontSize: 16,
        fontWeight: '500',
    },
});
