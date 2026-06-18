import React, { useState } from 'react';
import { useAuth } from '@readme/shared/src/contexts/AuthContext';
import { 
    View, 
    Text, 
    Image, 
    TouchableOpacity, 
    ScrollView, 
    useColorScheme,
    ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Iconify } from 'react-native-iconify';
import { Colors } from '@readme/shared/src/constants/theme';
import { ROUTES } from '@readme/shared/src/constants/routes';
import { doSignOut } from '@readme/shared/src/services/auth';
import { buildStyles } from '../../styles/profileStyles';
import { uploadProfilePicture } from '@readme/shared/src/services/user';
import { MenuGroup, MenuItem } from '../../components/ui/MenuComponents';

export default function ProfileScreen({ navigation }) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const styles = buildStyles(theme);

    // 1. Destructure refreshUser here
    const { currentUser, refreshUser } = useAuth();
    const [uploading, setUploading] = useState(false);

    // Função para abrir a galeria
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

    // Função que chama o nosso serviço partilhado
    const handleUpload = async (imageUri) => {
        setUploading(true);
        try {
            await uploadProfilePicture(currentUser.uid, imageUri);
            
            // 2. Refresh the user context so the app pulls down the new photoURL from Firestore
            if (refreshUser) {
                await refreshUser();
            }

            alert("Foto atualizada com sucesso!");
        } catch (error) {
            console.error(error);
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
                        <View style={styles.avatarContainer}>
                            
                            {/* 3. Safe Conditional Rendering for the image */}
                            {currentUser?.photoURL ? (
                                <Image 
                                    source={{ uri: `${currentUser.photoURL}?t=${new Date().getTime()}` }} 
                                    style={styles.profilePicture} 
                                />
                            ) : (
                                // While there is no picture, show a clean user icon centered inside your avatar container
                                <View style={[styles.profilePicture, { justifyContent: 'center', alignItems: 'center', backgroundColor: theme.iconBg || '#EAEAEA' }]}>
                                    <Iconify icon="lucide:user" size={40} color={theme.text} />
                                </View>
                            )}

                            {uploading && (
                                <ActivityIndicator size="large" color="#F58B2E" style={{ position: 'absolute' }} />
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
            >
                <View style={styles.body}>

                    {/* GROUP 1 */}
                    <MenuGroup styles={styles} bgColor={theme.groupShadow}>
                        <MenuItem styles={styles} theme={theme} icon="lucide:book" label="My Books" />
                        <MenuItem styles={styles} theme={theme} icon="lucide:heart" label="Favorites" />
                        <MenuItem styles={styles} theme={theme} icon="solar:medal-star-circle-linear" label="Level" />
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
                        <MenuItem styles={styles} theme={theme} icon="fluent:presence-blocked-10-regular" label="View Blocked Users" />
                        <MenuItem
                            styles={styles}
                            theme={theme}
                            icon="material-symbols:password"
                            label="Privacy & Security"
                            onPress={() => navigation.navigate(ROUTES.PRIVACY_SECURITY)}
                        />
                        <MenuItem styles={styles} theme={theme} icon="lucide:settings" label="Settings" />
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
