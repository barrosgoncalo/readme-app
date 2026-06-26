import { StyleSheet } from "react-native";

export const buildAddBookPopupStyles = (theme) => StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'flex-end',
        },
        sheet: {
            backgroundColor: theme.backgroundElement,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 24,
            paddingBottom: 40,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 10,
        },
        dragHandle: {
            width: 40,
            height: 5,
            borderRadius: 3,
            backgroundColor: theme.borderLight || '#E4DFDC',
            alignSelf: 'center',
            marginBottom: 20,
        },
        title: {
            fontFamily: 'Inter-SemiBold',
            fontSize: 20,
            color: theme.textItemTitle,
            marginBottom: 20,
            textAlign: 'center',
        },
        optionBtn: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.background,
            padding: 16,
            borderRadius: 12,
            marginBottom: 12,
        },
        optionText: {
            fontFamily: 'Inter-Regular',
            fontSize: 16,
            color: theme.textItemTitle,
            marginLeft: 12,
        }
    });
