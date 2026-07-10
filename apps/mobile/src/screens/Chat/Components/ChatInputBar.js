import React, { memo, useMemo } from 'react';
import { TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Iconify } from 'react-native-iconify';
import { buildChatRoomStyles } from '../../../styles/chatRoomStyles';

const ChatInputBar = memo(({ theme, inputText, setInputText, onSendPress }) => {
    const styles = useMemo(() => buildChatRoomStyles(theme), [theme]);
    
    const hasText = !!inputText.trim();

    return (
        <SafeAreaView edges={['bottom']} style={styles.inputContainer}>
            <TextInput
                style={styles.input}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Type a message..."
                placeholderTextColor={theme.subtext}
                multiline
            />
            <TouchableOpacity 
                style={[styles.sendButton, hasText ? styles.sendButtonActive : styles.sendButtonInactive]} 
                onPress={onSendPress}
                disabled={!hasText}
            >
                <Iconify icon="lucide:send" size={18} color={hasText ? '#FFFFFF' : theme.subtext} />
            </TouchableOpacity>
        </SafeAreaView>
    );
});

export default ChatInputBar;
