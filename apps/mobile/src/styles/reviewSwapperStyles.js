import { StyleSheet } from 'react-native';

export const buildReviewSwapperStyles = (theme) => StyleSheet.create({
    container: { flex: 1 },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 16, 
        paddingVertical: 12, 
        borderBottomWidth: 1 
    },
    backButton: { padding: 4, width: 40 },
    headerTitle: { fontSize: 16, fontWeight: '700' },
    scrollContent: { padding: 24, alignItems: 'center' },
    loader: { marginVertical: 40 },

    profileSection: { alignItems: 'center', marginBottom: 32 },
    avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 16 },
    avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, marginBottom: 16, justifyContent: 'center', alignItems: 'center' },
    userName: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
    userSubtitle: { fontSize: 14, textAlign: 'center' },

    starsContainer: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16 },
    starButton: { padding: 4 },
    ratingLabel: { fontSize: 16, fontWeight: '600', height: 24, marginBottom: 32, textAlign: 'center' },

    inputContainer: { width: '100%', marginTop: 8 },
    inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
    textInput: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        fontSize: 15,
        minHeight: 120,
    },

    footer: { padding: 16, borderTopWidth: 1 },
    submitButton: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center'
    },
    submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' }
});
