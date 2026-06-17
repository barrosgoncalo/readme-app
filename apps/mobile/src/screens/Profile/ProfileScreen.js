import React, { useState } from 'react';
import { useAuth } from '@readme/shared/src/contexts/AuthContext'
import { View, Text, Image, TouchableOpacity, ScrollView, Switch, useColorScheme } from 'react-native';
import { Iconify } from 'react-native-iconify';
import { Colors } from '@readme/shared/src/constants/theme';
import { ROUTES } from '@readme/shared/src/constants/routes';
import { doSignOut } from '@readme/shared/src/services/auth';
import { buildStyles } from '../../styles/profileStyles';

export default function ProfileScreen({ navigation }) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const styles = buildStyles(theme);

    const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');

    const { currentUser } = useAuth();

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
                        <Text style={styles.userName}>
                            { currentUser?.username || 'Username' }
                        </Text>
                        <Iconify icon="material-symbols:verified" size={18} color="#F58B2E" />
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
                            icon="fluent:presence-blocked-10-regular"
                            label="View Blocked Users"
                        />
                        <MenuItem
                            styles={styles}
                            theme={theme}
                            icon="material-symbols:password"
                            label="Privace & Security"
                        />
                        <MenuSwitchItem 
                            styles={styles} 
                            theme={theme} 
                            icon="solar:moon-outline" 
                            label="Dark Mode" 
                            value={isDarkMode}
                            onValueChange={(newValue) => setIsDarkMode(newValue)}
                        />
                    </MenuGroup>

                    {/* GROUP 3 */}
                    <MenuGroup styles={styles} bgColor={theme.groupShadow}>
                        <MenuItem
                            styles={styles}
                            theme={theme}
                            icon="lucide:settings"
                            label="Settings"
                        />
                        <MenuItem
                            styles={styles}
                            theme={theme}
                            icon="solar:medal-star-circle-linear"
                            label="Level"
                        />
                        <MenuItem
                            styles={styles}
                            theme={theme}
                            icon="lucide:heart"
                            label="Favorites"
                        />
                    </MenuGroup>

                    {/* GROUP 4 (Sign Out) */}
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

// --- SUB-COMPONENTES REUTILIZÁVEIS ---

const MenuGroup = ({ children, styles, bgColor }) => (
    <View style={[styles.menuGroup, { backgroundColor: bgColor }]}>
        {children}
    </View>
);

const MenuItem = ({ icon, label, textColor, iconColor, iconBgColor = null, theme, styles, onPress }) =>
{
    
    const dynamicIconBgColor = iconBgColor ? { backgroundColor: iconBgColor } : {};
    const finalIconColor = iconColor || theme.icon;

    return (
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            <View style={styles.menuItemLeft}>
                <View style={[styles.iconWrapper, dynamicIconBgColor]}>
                    {icon ? (
                        <Iconify icon={icon} size={24} color={finalIconColor} />
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

const MenuSwitchItem = ({ icon, label, textColor, iconColor, iconBgColor,value, onValueChange, theme, styles }) =>
{
    return (
        <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
                <View style={[styles.iconWrapper, iconBgColor && { backgroundColor: iconBgColor }]}>
                    {icon ? (
                        <Iconify icon={icon} size={20} color={iconColor} />
                    ) : (
                            <View style={styles.emptyIconPlaceholder} />
                        )}
                </View>
                <Text style={[styles.menuItemLabel, { color: textColor || theme.text }]}>
                    {label}
                </Text>
            </View>

            {/* Aqui entra o Switch em vez do ícone de seta */}
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ true: theme.darkerSecondary, false: '#D1CCC9' }} 
                thumbColor={'#FFFFFF'}
            />
        </View>
    );
};
