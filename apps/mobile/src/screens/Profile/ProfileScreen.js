import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, Button, useColorScheme } from 'react-native';
import { Iconify } from 'react-native-iconify';
import { Colors } from '@readme/shared/src/constants/theme';
import { ROUTES } from '@readme/shared/src/constants/'
import { buildStyles } from '../../styles/profileStyles';
import { doSignOut } from '@readme/shared/src/services/auth';

export default function ProfileScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const styles = buildStyles(theme, colorScheme);

    const handleSignOut = () => {
        console.log("A terminar sessão...");
        doSignOut();
        navigation.navigate('Login');
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.headerBackground }]}>
            {/* --- HEADER SECTION --- */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Account</Text>

                <View style={styles.avatarContainer}>
                    <Image 
                        source={{ uri: 'https://via.placeholder.com/100' }} 
                        style={styles.avatarImage} 
                    />
                </View>

                <View style={styles.userInfo}>
                    <View style={styles.userNameContainer}>
                        <Text style={styles.userName}>BookWorm</Text>
                        <Iconify icon="material-symbols:verified" size={18} color="#F58B2E" />
                    </View>
                    <Text style={styles.userEmail}>bookworm@gmail.com</Text>
                </View>
            </View>

            {/* --- BODY SECTION --- */}
            <View style={[styles.body, { backgroundColor: theme.background }]}>

                {/* GROUP 1 */}
                <MenuGroup styles={styles}>
                    <MenuItem styles={styles} theme={theme} icon="lucide:book" label="My Books" />
                </MenuGroup>

                {/* GROUP 2 */}
                <MenuGroup styles={styles}>
                    <MenuItem styles={styles} theme={theme} icon="lucide:edit" label="Edit Profile" />
                    <MenuItem styles={styles} theme={theme} icon="lucide:user-x" label="View Blocked Users" />
                    <MenuItem styles={styles} theme={theme} icon="lucide:activity" label="Activities" />
                    <MenuItem styles={styles} theme={theme} icon="lucide:activity" label="Activities" />
                </MenuGroup>

                {/* GROUP 3 */}
                <MenuGroup styles={styles}>
                    <MenuItem styles={styles} theme={theme} icon="lucide:settings" label="Settings" />
                    <MenuItem styles={styles} theme={theme} icon={null} label="Level" />
                    <MenuItem styles={styles} theme={theme} icon="lucide:heart" label="Favorites" />
                </MenuGroup>

                {/* GROUP 4 (Sign Out) */}
                <MenuGroup styles={styles} >
                    <MenuItem 
                        styles={styles}
                        theme={theme}
                        icon="lucide:log-out" 
                        label="Sign Out" 
                        textColor={Colors.password.red} 
                        iconColor={Colors.password.red}
                        onPress={doSignOut}
                    />
                </MenuGroup>

            </View>
        </ScrollView>
    );
}

// --- SUB-COMPONENTES REUTILIZÁVEIS ---

const MenuGroup = ({ children, styles }) => (
    <View style={styles.menuGroup}>
        {children}
    </View>
);

const MenuItem = ({ icon, label, textColor, iconColor, theme, styles, onPress }) => {
    return (
        <TouchableOpacity 
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={onPress}
        >
            <View style={styles.menuItemLeft}>
                <View style={styles.iconWrapper}>
                    {icon ? (
                        <Iconify icon={icon} size={18} color={iconColor || '#4A4A4A'} />
                    ) : (
                        <View style={styles.emptyIconPlaceholder} />
                    )}
                </View>
                <Text style={[styles.menuItemLabel, { color: textColor || theme.text }]}>
                    {label}
                </Text>
            </View>
            <Iconify icon="lucide:chevron-right" size={20} color={theme.subtext} />
        </TouchableOpacity>
    );
};
