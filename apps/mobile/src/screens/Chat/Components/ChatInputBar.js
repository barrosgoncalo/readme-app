import React, { memo } from 'react';
import { TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Iconify } from 'react-native-iconify';

const ChatInputBar = memo(({ theme, inputText, setInputText, onSendPress }) => {
    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={8}>
            <SafeAreaView edges={['bottom']} style={[styles.inputContainer, { backgroundColor: theme.background, borderTopColor: theme.borderLight }]}>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.textItemTitle, borderColor: theme.borderLight }]}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="Type a message..."
                    placeholderTextColor={theme.subtext}
                    multiline
                />
                <TouchableOpacity 
                    style={[styles.sendButton, { backgroundColor: inputText.trim() ? (theme.primary || '#E58A1F') : theme.borderLight }]} 
                    onPress={onSendPress}
                    disabled={!inputText.trim()}
                >
                    <Iconify icon="lucide:send" size={18} color={inputText.trim() ? '#FFFFFF' : theme.subtext} />
                </TouchableOpacity>
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
});

const styles = StyleSheet.create({
    inputContainer: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1, alignItems: 'center', gap: 12 },
    input: { flex: 1, minHeight: 40, maxHeight: 100, borderRadius: 20, borderWidth: 1, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, fontSize: 15 },
    sendButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
});

export default ChatInputBar;
