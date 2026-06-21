import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    ScrollView,
    useColorScheme,
    Alert,
} from 'react-native';
import { Iconify } from 'react-native-iconify';

import { Colors } from '@readme/shared/src/constants/theme';
import { buildStyles } from '../../../styles/blockedUsersStyles';
import { doGetBlockedUsers, doUnblockUser } from '@readme/shared/src/services/blockUser';
import { useAuth } from '@readme/shared/src/contexts/AuthContext'; // adjust path/hook name to match your AuthContext

export default function BlockedUsersScreen({ navigation }) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const styles = buildStyles(theme, colorScheme);

    const { user } = useAuth(); // assumes AuthContext exposes { user } once onAuthStateChanged resolves
    const currentUid = user?.uid;

    const [blockedUsers, setBlockedUsers] = useState([]);

    useEffect(() => {
        // Guard: don't fetch until we actually have an authenticated uid.
        // (auth.currentUser is unreliable on first render in RN — it can
        // still be null while Firebase rehydrates from AsyncStorage.)
        if (!currentUid) return;

        const fetchBlockedUsers = async () => {
            try {
                console.log(currentUid);
                const users = await doGetBlockedUsers(currentUid);
                console.log(users);
                setBlockedUsers(users);
            } catch (error) {
                console.error("Failed to fetch blocked users:", error);
            }
        };

        fetchBlockedUsers();
    }, [currentUid]);

    const handleUnblock = (blockedUser) => {
        Alert.alert(
            'Unblock User',
            `Are you sure you want to unblock @${blockedUser.username}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Unblock',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            if (!currentUid) return;
                            await doUnblockUser(currentUid, blockedUser.id);

                            // Optimistically remove from UI
                            setBlockedUsers((prev) => prev.filter((u) => u.id !== blockedUser.id));
                        } catch (error) {
                            Alert.alert('Error', 'Failed to unblock user.');
                            console.error(error);
                        }
                    },
                },
            ]
        );
    };

    const peopleLabel = `${blockedUsers.length} ${blockedUsers.length === 1 ? 'PERSON' : 'PEOPLE'}`;

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <Iconify icon="lucide:arrow-left" size={24} color={theme.text} />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Blocked Users</Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.countLabel}>{peopleLabel}</Text>
                <Text style={styles.description}>
                    Blocked users cannot see your profile, posts, or contact you. They are not
                    notified when you block them.
                </Text>

                <View style={[styles.listCard, { backgroundColor: theme.cardBackground }]}>
                    {blockedUsers.map((blockedUser, index) => (
                        <BlockedUserRow
                            key={blockedUser.id}
                            user={blockedUser}
                            theme={theme}
                            styles={styles}
                            isLast={index === blockedUsers.length - 1}
                            onPress={() => handleUnblock(blockedUser)}
                        />
                    ))}

                    {blockedUsers.length === 0 && (
                        <Text style={styles.emptyText}>You haven't blocked anyone.</Text>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const BlockedUserRow = ({ user, theme, styles, isLast, onPress }) => (
    <TouchableOpacity
        style={[styles.userRow, !isLast && styles.userRowBorder]}
        activeOpacity={0.7}
        onPress={onPress}
    >
        <View style={styles.userRowLeft}>
            <View style={styles.avatarPlaceholder}>
                {user.avatarUrl && (
                    <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
                )}
            </View>

            <View>
                {user.fullName && <Text style={styles.fullName}>{user.fullName}</Text>}
                <Text style={styles.username}>@{user.username}</Text>
            </View>
        </View>
    </TouchableOpacity>
);