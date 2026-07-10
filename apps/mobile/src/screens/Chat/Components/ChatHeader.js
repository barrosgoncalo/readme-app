import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Iconify } from 'react-native-iconify';
import { ROUTES } from '@readme/shared/src/constants/routes';

const ChatHeader = memo(({ 
    theme, 
    navigation, 
    otherUserId, 
    otherUserAvatar, 
    otherUserName, 
    handleOpenOptions 
}) => {
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

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
    backButton: { padding: 4 },
    headerProfileInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    headerAvatar: { width: 36, height: 36, borderRadius: 18 },
    headerAvatarPlaceholder: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    headerTextGroup: { justifyContent: 'center' },
    headerName: { fontSize: 16, fontWeight: '700' },
    optionsButton: { padding: 4 },
});

export default ChatHeader;
