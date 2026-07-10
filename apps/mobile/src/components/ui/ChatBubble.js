import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Iconify } from 'react-native-iconify';

export default function ChatBubble({ item, isMe, isLastInGroup, theme, colorScheme }) {
    return (
        <View style={[
            styles.messageRow,
            { justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: isLastInGroup ? 8 : 2 }
        ]}>
            <View style={[
                styles.bubble,
                isMe
                    ? {
                        backgroundColor: theme.primary,
                        paddingRight: 36,
                        paddingBottom: 14,
                        // Dynamic radius: Apply tail ONLY if it's the last message in the block
                        borderBottomRightRadius: isLastInGroup ? 4 : 16,
                    }
                    : {
                        backgroundColor: theme.backgroundElement,
                        borderColor: theme.borderLight,
                        borderWidth: 1,
                        // Dynamic radius: Apply tail ONLY if it's the last message in the block
                        borderBottomLeftRadius: isLastInGroup ? 4 : 16,
                    }
            ]}>
                <Text style={[styles.messageText, { color: isMe ? theme.primaryText : theme.textItemTitle }]}>
                    {item.text}
                </Text>

                {/* READ RECEIPT */}
                {isMe && (
                    <View style={{ position: 'absolute', bottom: 4, right: 8 }}>
                        <Iconify
                            icon={item.read ? "lucide:check-check" : "lucide:check"}
                            size={16}
                            color={
                                item.read
                                    ? (colorScheme === 'dark' ? theme.primaryText : theme.avatarBgTonal)
                                    : 'rgba(255, 255, 255, 0.35)'
                            }
                        />
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    messageRow: { flexDirection: 'row', marginVertical: 4, width: '100%' },
    bubble: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 16,
        maxWidth: '75%'
    },
    messageText: {
        fontSize: 15,
    },
});
