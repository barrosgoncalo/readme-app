import React, { useState } from 'react';
import { useAuth } from '@readme/shared/src/contexts/AuthContext'
import { View, Text, Image, TouchableOpacity, ScrollView, Switch, useColorScheme } from 'react-native';
import { Iconify } from 'react-native-iconify';
import { Colors } from '@readme/shared/src/constants/theme';
import { ROUTES } from '@readme/shared/src/constants/routes';
import { doSignOut } from '@readme/shared/src/services/auth';
import { buildStyles } from '../../styles/profileStyles';
import { uploadProfilePicture } from '@readme/shared/src/services/user';

export default function ProfileScreen({ navigation }) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const styles = buildStyles(theme);

    const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');

    const { currentUser } = useAuth();
    const [uploading, setUploading] = useState(false);

    // Função para abrir a galeria
    const pickImage = async () => {
        // Pedir permissão e abrir a galeria
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true, // Permite ao utilizador cortar a foto num quadrado
            aspect: [1, 1],
            quality: 0.5, // 0.5 comprime a foto para não gastar muitos dados
        });

        if (!result.canceled) {
            const imageUri = result.assets[0].uri;
            handleUpload(imageUri);
        }
    };

    // Função que chama o nosso serviço partilhado
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
                        <View>
                            <Image 
                                source={{ uri: currentUser?.photoURL || 'https://via.placeholder.com/100' }} 
                                style={{ width: 100, height: 100, borderRadius: 50 }} 
                            />

                            {uploading && (
                                <ActivityIndicator size="large" color="#0000ff" style={{ position: 'absolute' }} />
                            )}
                        </View>
                    </TouchableOpacity>
                </View>                <View style={styles.userInfo}>
                    <View style={styles.userNameContainer}>
                        <Text
                            style={styles.userName}>
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
                            icon="fluent:presence-blocked-10-regular"
                            label="View Blocked Users"
                        />
                        <MenuItem
                            styles={styles}
                            theme={theme}
                            icon="material-symbols:password"
                            label="Privace & Security"
                        />
                        <MenuItem
                            styles={styles}
                            theme={theme}
                            icon="lucide:settings"
                            label="Settings"
                        />
                    </MenuGroup>

                    {/* GROUP 3 (Sign Out) */}
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
