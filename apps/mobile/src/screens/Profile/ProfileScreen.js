import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, Switch, useColorScheme } from 'react-native';
import { Iconify } from 'react-native-iconify';
import { Colors } from '@readme/shared/src/constants/theme';
import { buildStyles } from '../../styles/profileStyles';
import { doSignOut } from '@readme/shared/src/services/auth';

export default function ProfileScreen({ navigation }) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const styles = buildStyles(theme);

    const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');

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
                    <MenuGroup styles={styles} bgColor={theme.groupShadow}>
                        <MenuItem
                            styles={styles}
                            theme={theme}
                            icon="lucide:book"
                            label="My Books"
                            iconBgColor={theme.iconBg}
                            iconColor={theme.icon}
                        />
                    </MenuGroup>

                    {/* GROUP 2 */}
                    <MenuGroup styles={styles} bgColor={theme.groupShadow}>
                        <MenuItem
                            styles={styles}
                            theme={theme}
                            icon="lucide:edit"
                            label="Edit Profile"
                            iconBgColor={theme.iconBg}
                            iconColor={theme.icon}
                        />
                        <MenuItem
                            styles={styles}
                            theme={theme}
                            icon="fluent:presence-blocked-10-regular"
                            label="View Blocked Users"
                            iconBgColor={theme.iconBg}
                            iconColor={theme.icon}
                        />
                        <MenuItem
                            styles={styles}
                            theme={theme}
                            icon="material-symbols:password"
                            label="Privace & Security"
                            iconBgColor={theme.iconBg}
                            iconColor={theme.icon}
                        />
                        <MenuSwitchItem 
                            styles={styles} 
                            theme={theme} 
                            icon="solar:moon-outline" 
                            label="Dark Mode" 
                            value={isDarkMode}
                            onValueChange={(newValue) => setIsDarkMode(newValue)}
                            iconBgColor={theme.iconBg}
                            iconColor={theme.icon}
                        />
                    </MenuGroup>

                    {/* GROUP 3 */}
                    <MenuGroup styles={styles} bgColor={theme.groupShadow}>
                        <MenuItem
                            styles={styles}
                            theme={theme}
                            icon="lucide:settings"
                            label="Settings"
                            iconBgColor={theme.iconBg}
                            iconColor={theme.icon}
                        />
                        <MenuItem
                            styles={styles}
                            theme={theme}
                            icon="solar:medal-star-circle-linear"
                            label="Level"
                            iconBgColor={theme.iconBg}
                            iconColor={theme.icon}
                        />
                        <MenuItem
                            styles={styles}
                            theme={theme}
                            icon="lucide:heart"
                            label="Favorites"
                            iconBgColor={theme.iconBg}
                            iconColor={theme.icon}
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

const MenuItem = ({ icon, label, textColor, iconColor, iconBgColor, theme, styles, onPress }) => {
    return (
        <TouchableOpacity 
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={onPress}
        >
            <View style={styles.menuItemLeft}>
                {/* 3. APLICADA A LÓGICA DO ARRAY AQUI NO STYLE */}
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
            <Iconify icon="lucide:chevron-right" size={20} color={theme.subtext} />
        </TouchableOpacity>
    );
};

const MenuSwitchItem = ({ icon, label, textColor, iconColor, iconBgColor,value, onValueChange, theme, styles }) => {
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
                trackColor={{ true: theme.darkerSecondary }} 
                thumbColor={'#FFFFFF'}
            />
        </View>
    );
};
