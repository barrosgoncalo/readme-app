import React, { memo, useMemo, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Iconify } from 'react-native-iconify';
import { ROUTES } from '@readme/shared/src/constants/routes';
import { buildChatRoomStyles } from '../../../styles/chatRoomStyles';

const ChatHeader = memo(({ 
    theme, 
    navigation, 
    otherUserId, 
    otherUserAvatar, 
    otherUserName, 
    handleOpenOptions 
}) => {
        const styles = useMemo(() => buildChatRoomStyles(theme), [theme]);
        const [imageError, setImageError] = useState(false);

        // Reset error state if the avatar URL itself changes (e.g. user updates their photo)
        useEffect(() => {
            setImageError(false);
        }, [otherUserAvatar]);

        const showAvatar = otherUserAvatar && !imageError;

        return (
            <SafeAreaView edges={['top']} style={[styles.header, { borderBottomColor: theme.borderLight }]}>
                <TouchableOpacity onPress={() => navigation.popToTop()} style={styles.backButton}>
                    <Iconify icon="lucide:arrow-left" size={24} color={theme.textItemTitle} />
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.headerProfileInfo} 
                    activeOpacity={0.7}
                    disabled={!otherUserId}
                    onPress={() => {
                        if (otherUserId) {
                            navigation.navigate(ROUTES.PUBLIC_PROFILE_SCREEN, { ownerId: otherUserId });
                        }
                    }}
                >
                    {showAvatar ? (
                        <Image 
                            source={{ uri: otherUserAvatar }} 
                            style={styles.headerAvatar}
                            onError={() => setImageError(true)} // Intercept 404/403 errors
                        />
                    ) : (
                            <View style={[styles.headerAvatarPlaceholder, { backgroundColor: theme.backgroundElement }]}>
                                <Iconify icon="lucide:user" size={20} color={theme.subtext} />
                            </View>
                        )}
                    <View style={styles.headerTextGroup}>
                        <Text style={[styles.headerName, { color: theme.textItemTitle }]}>
                            {otherUserName}
                        </Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleOpenOptions} style={styles.optionsButton}>
                    <Iconify icon="lucide:more-vertical" size={24} color={theme.textItemTitle} />
                </TouchableOpacity>
            </SafeAreaView>
        );
    });
export default ChatHeader;
