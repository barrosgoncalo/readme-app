import { StyleSheet } from 'react-native';

export const buildChatRoomStyles = (theme) => {
    return StyleSheet.create({
        // --- ChatRoomScreen Styles ---
        container: { 
            flex: 1, 
            backgroundColor: theme.background 
        },
        centerLoading: { 
            flex: 1, 
            justifyContent: 'center', 
            alignItems: 'center' 
        },
        listContainer: { 
            paddingHorizontal: 16, 
            paddingTop: 16, 
            paddingBottom: 16, 
        },

        // --- ChatHeader Styles ---
        header: { 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            paddingHorizontal: 16, 
            paddingBottom: 12, 
            borderBottomWidth: 1,
            borderBottomColor: theme.borderLight
        },
        backButton: { 
            padding: 4 
        },
        headerProfileInfo: { 
            flexDirection: 'row', 
            alignItems: 'center', 
            gap: 12 
        },
        headerAvatar: { 
            width: 36, 
            height: 36, 
            borderRadius: 18 
        },
        headerAvatarPlaceholder: { 
            width: 36, 
            height: 36, 
            borderRadius: 18, 
            justifyContent: 'center', 
            alignItems: 'center',
            backgroundColor: theme.backgroundElement
        },
        headerTextGroup: { 
            justifyContent: 'center' 
        },
        headerName: { 
            fontSize: 16, 
            fontWeight: '700',
            color: theme.textItemTitle
        },
        optionsButton: { 
            padding: 4 
        },

        // --- ChatInputBar Styles ---
        inputContainer: { 
            flexDirection: 'row', 
            paddingHorizontal: 16, 
            paddingVertical: 8, 
            borderTopWidth: 1, 
            alignItems: 'center', 
            gap: 12,
            backgroundColor: theme.background,
            borderTopColor: theme.borderLight
        },
        input: { 
            flex: 1, 
            minHeight: 40, 
            maxHeight: 100, 
            borderRadius: 20, 
            borderWidth: 1, 
            paddingHorizontal: 16, 
            paddingTop: 10, 
            paddingBottom: 10, 
            fontSize: 15,
            backgroundColor: theme.backgroundElement,
            color: theme.textItemTitle,
            borderColor: theme.borderLight
        },
        sendButton: { 
            width: 40, 
            height: 40, 
            borderRadius: 20, 
            justifyContent: 'center', 
            alignItems: 'center' 
        },
        sendButtonActive: {
            backgroundColor: theme.primary || '#E58A1F'
        },
        sendButtonInactive: {
            backgroundColor: theme.borderLight
        },

        // --- MessageListItem Styles ---
        offerCardContainer: { 
            width: '100%', 
            alignItems: 'center', 
            marginVertical: 12 
        },
    });
};
