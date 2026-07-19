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
                             isChatDisabled,
                             handleOpenOptions
                         }) => {
    const styles = useMemo(() => buildChatRoomStyles(theme), [theme]);
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        setImageError(false);
    }, [otherUserAvatar]);

    const showAvatar = otherUserAvatar && !imageError;
    const canOpenProfile = !!otherUserId && !isChatDisabled;

    return (
        <SafeAreaView edges={['top']} style={[styles.header, { borderBottomColor: theme.borderLight }]}>
            <TouchableOpacity onPress={() => navigation.popToTop()} style={styles.backButton}>
                <Iconify icon="lucide:arrow-left" size={24} color={theme.textItemTitle} />
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.headerProfileInfo}
                activeOpacity={canOpenProfile ? 0.7 : 1}
                disabled={!canOpenProfile}
                onPress={() => {
                    if (canOpenProfile) {
                        navigation.navigate(ROUTES.PUBLIC_PROFILE, { ownerId: otherUserId });
                    }
                }}
            >
                {showAvatar ? (
                    <Image
                        source={{ uri: otherUserAvatar }}
                        style={styles.headerAvatar}
                        onError={() => setImageError(true)}
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