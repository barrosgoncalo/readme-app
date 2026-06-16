import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, useColorScheme } from 'react-native';
import { Iconify } from 'react-native-iconify';
import { Colors } from '@readme/shared/src/constants/theme';
import { buildStyles } from '../../styles/profileStyles';
import { doSignOut } from '@readme/shared/src/services/auth';

export default function ProfileScreen({ navigation }) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const styles = buildStyles(theme);

    const handleSignOut = async () => {
        console.log("A terminar sessão...");
        await doSignOut();
    };

    return (
        <View style={styles.container}>

            {/* --- HEADER SECTION(estático) --- */}
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

            {/* --- BODY SECTION(móvel) --- */}
            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
                overScrollMode="never"
            >
                {/* O "Papel" que desliza por cima */}
                <View style={styles.body}>

                    {/* GROUP 1 */}
                    <MenuGroup styles={styles} bgColor={theme.surface || '#FFFFFF'}>
                        <MenuItem styles={styles} theme={theme} icon="lucide:book" label="My Books" />
                    </MenuGroup>

                    {/* GROUP 2 */}
                    <MenuGroup styles={styles} bgColor={theme.surface || '#FFFFFF'}>
                        <MenuItem styles={styles} theme={theme} icon="lucide:edit" label="Edit Profile" />
                        <MenuItem styles={styles} theme={theme} icon="lucide:user-x" label="View Blocked Users" />
                        <MenuItem styles={styles} theme={theme} icon="lucide:activity" label="Activities" />
                        <MenuItem styles={styles} theme={theme} icon="lucide:activity" label="Activities" />
                    </MenuGroup>

                    {/* GROUP 3 */}
                    <MenuGroup styles={styles} bgColor={theme.surface || '#FFFFFF'}>
                        <MenuItem styles={styles} theme={theme} icon="lucide:settings" label="Settings" />
                        <MenuItem styles={styles} theme={theme} icon="solar:medal-star-circle-linear" label="Level" />
                        <MenuItem styles={styles} theme={theme} icon="lucide:heart" label="Favorites" />
                    </MenuGroup>

                    {/* GROUP 4 (Sign Out) */}
                    <MenuGroup styles={styles} bgColor={theme.surface || '#FFFFFF'}>
                        <MenuItem 
                            styles={styles}
                            theme={theme}
                            icon="lucide:log-out" 
                            label="Sign Out" 
                            textColor={Colors.password.red} 
                            iconColor={Colors.password.red}
                            onPress={handleSignOut}
                        />
                    </MenuGroup>

                </View>
            </ScrollView>
        </View>
    );
}

// --- SUB-COMPONENTES REUTILIZÁVEIS ---

const MenuGroup = ({ children, styles, bgColor }) => (
    <View style={[styles.menuGroup, { backgroundColor: bgColor }]}>
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
