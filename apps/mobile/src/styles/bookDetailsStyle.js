import { StyleSheet } from "react-native";

export const buildBookDetailsStyles = () => StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 20, 
        paddingBottom: 60,
    },
    backButton: {
        alignSelf: 'flex-start',
        marginBottom: 24,
        padding: 4, 
        marginLeft: -4, 
    },
    title: {
        fontFamily: 'Inter-Regular', 
        fontSize: 28,
        marginBottom: 4,
    },
    subtitle: {
        fontFamily: 'Inter-Regular',
        fontSize: 18,
        marginBottom: 40,
    },
    sectionTitle: {
        fontFamily: 'Inter-Regular',
        fontSize: 24,
        marginBottom: 16,
    },
    descriptionText: {
        fontFamily: 'Inter-Regular',
        fontSize: 15,
        lineHeight: 24,
    },
    imageContainer: {
        alignSelf: 'center',
        marginBottom: 48,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.25, 
        shadowRadius: 30,
        elevation: 15,
    },
    coverImage: {
        width: 300, 
        height: 450, 
        borderRadius: 4, 
    },
    placeholderCover: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    placeholderText: {
        fontFamily: 'Inter-Medium',
    }
});

