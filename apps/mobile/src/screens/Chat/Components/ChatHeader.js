import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
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
                    {otherUserAvatar ? (
                        <Image source={{ uri: otherUserAvatar }} style={styles.headerAvatar} />
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
