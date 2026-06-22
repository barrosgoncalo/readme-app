import React, { useState } from 'react';
import { Modal, View, Text, Image, TouchableOpacity, TouchableWithoutFeedback, Alert, useColorScheme } from 'react-native';
import { Iconify } from 'react-native-iconify';
import { useAuth } from '@readme/shared/src/contexts/AuthContext';
import { Colors } from '@readme/shared/src/constants/theme';
import { doBlockUser } from '@readme/shared/src/services/blockUser';
import { buildStyles } from '../../styles/userProfileModalStyles';

export default function UserProfileModal({ visible, user, onClose, onBlocked }) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const styles = buildStyles(theme);

    const { currentUser } = useAuth();
    const [blocking, setBlocking] = useState(false);

    if (!user) return null;

    const handleFollow = () => {
        // TODO: wire up real follow service once services/follow.js exists.
        // e.g. await doFollowUser(currentUser.uid, user.uid);
        console.log("Follow pressed (stub) for", user.uid);
    };

    const handleBlock = () => {
        Alert.alert(
            "Block User",
            `Are you sure you want to block @${user.username}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Block",
                    style: "destructive",
                    onPress: async () => {
                        setBlocking(true);
                        try {
                            await doBlockUser(currentUser.uid, user.uid);
                            onBlocked?.(user.uid);
                            onClose();
                        } catch (error) {
                            console.error("Erro ao bloquear utilizador:", error);
                            Alert.alert("Error", "Failed to block user. Please try again.");
                        } finally {
                            setBlocking(false);
                        }
                    },
                },
            ]
        );
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.card}>
                            <View style={styles.avatarWrapper}>
                                {user.photoURL ? (
                                    <Image source={{ uri: user.photoURL }} style={styles.avatarImage} />
                                ) : (
                                    <Iconify icon="lucide:user" size={42} color={theme.text} />
                                )}
                            </View>

                            <Text style={styles.username}>{user.fullName}</Text>
                            <Text style={styles.handle}>@{user.username}</Text>
                            <Text style={styles.email}>{user.userId}</Text>

                            <View style={styles.divider} />

                            <View style={styles.actionsContainer}>
                                <TouchableOpacity
                                    style={[styles.pillButton, styles.followButton]}
                                    onPress={handleFollow}
                                >
                                    <Text style={styles.pillButtonText}>Follow</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.pillButton, styles.blockButton]}
                                    onPress={handleBlock}
                                    disabled={blocking}
                                >
                                    <Text style={styles.pillButtonText}>
                                        {blocking ? "Blocking..." : "Block User"}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.pillButton, styles.cancelButton]}
                                    onPress={onClose}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}