import React, { useState, useEffect, useCallback } from 'react';
import { View, TextInput, FlatList, Text, Image, TouchableOpacity, useColorScheme, ActivityIndicator } from 'react-native';
import { Iconify } from 'react-native-iconify';
import { useAuth } from '@readme/shared/src/contexts/AuthContext';
import { Colors } from '@readme/shared/src/constants/theme';
import { ROUTES } from '@readme/shared/src/constants/routes';
import { searchUsers } from '@readme/shared/src/services/search';
import { buildStyles } from '../../styles/searchStyles';
import UserProfileModal from '../../components/ui/UserProfileModal';


export default function SearchScreen({ navigation }) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const styles = buildStyles(theme);

    const { currentUser } = useAuth();
    const [searchText, setSearchText] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const [selectedUser, setSelectedUser] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    const handleUserPress = (user) => {
        setSelectedUser(user);
        setModalVisible(true);
    };

    const handleUserBlocked = (blockedUid) => {
        setResults((prev) => prev.filter((u) => u.uid !== blockedUid));
    };


    useEffect(() => {
        if (!searchText.trim()) {
            setResults([]);
            return;
        }

        setLoading(true);
        const debounce = setTimeout(async () => {
            try {
                const users = await searchUsers(searchText, currentUser.uid);
                setResults(users);
            } catch (error) {
                console.error("Erro na pesquisa de utilizadores:", error);
            } finally {
                setLoading(false);
            }
        }, 350);

        return () => clearTimeout(debounce);
    }, [searchText]);


    const renderItem = useCallback(({ item }) => (
        <TouchableOpacity
            style={styles.resultRow}
            onPress={() => handleUserPress(item)}
        >
            <View style={styles.avatar}>
                {item.photoURL ? (
                    <Image source={{ uri: item.photoURL }} style={styles.avatarImage} />
                ) : (
                    <Iconify icon="lucide:user" size={22} color={theme.text} />
                )}
            </View>
            <View style={styles.resultTextContainer}>
                <Text style={styles.resultUsername}>{item.username}</Text>
                <Text style={styles.resultFullName}>{item.fullName}</Text>
            </View>
        </TouchableOpacity>
    ),  [navigation, theme, styles]);

    return (
        <View style={styles.container}>
            <View style={styles.searchBar}>
                <Iconify icon="lucide:search" size={20} color={theme.subtext} />
                
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search users..."
                    placeholderTextColor={theme.subtext}
                    value={searchText}
                    onChangeText={setSearchText}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                
                {/* Trailing Elements Container */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {loading && <ActivityIndicator size="small" color={theme.secondary} />}

                    {/* Ultra-compact, thick circular Go-Back Button */}
                    <TouchableOpacity 
                        onPress={() => navigation.goBack()} 
                        style={{
                            width: 18,
                            height: 18,
                            borderRadius: 9,
                            backgroundColor: theme.backgroundSelected, 
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                        activeOpacity={0.7}
                    >
                        <Iconify 
                            icon="lucide:x" 
                            size={12}
                            color={theme.subtext} 
                            strokeWidth={3.5}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={results}
                keyExtractor={(item) => item.uid}
                renderItem={renderItem}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                    !loading && searchText.trim() ? (
                        <View style={styles.emptyState}>
                            <Iconify icon="lucide:user-x" size={36} color={theme.subtext} />
                            <Text style={styles.emptyStateText}>No users found</Text>
                        </View>
                    ) : null
                }
            />

            <UserProfileModal
                visible={modalVisible}
                user={selectedUser}
                onClose={() => setModalVisible(false)}
                onBlocked={handleUserBlocked}
                theme={theme}
            />

        </View>
    );
}
