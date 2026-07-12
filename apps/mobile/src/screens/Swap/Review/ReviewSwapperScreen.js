import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Image,
    Alert,
    ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Iconify } from 'react-native-iconify';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@readme/shared/src/services/firebase';
import { useAuth } from '@readme/shared/src/contexts/AuthContext';
import { useTheme } from '@readme/shared/src/hooks/use-theme';
import { createReviewModel } from '@readme/shared/src/models/review';

export default function ReviewSwapperScreen({ route, navigation }) {
    const theme = useTheme)=;
    
    // Parameters passed from previous screen
    const { targetUserId, chatId, swapId } = route.params;
    const { currentUser } = useAuth();

    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingUser, setIsLoadingUser] = useState(true);
    
    // Target user state details
    const [targetUser, setTargetUser] = useState(null);

    // Fetch the target user's picture and name
    useEffect(() => {
        const fetchTargetUser = async () => {
            if (!targetUserId) {
                setIsLoadingUser(false);
                return;
            }
            try {
                const userRef = doc(db, 'users', targetUserId);
                const userSnap = await getDoc(userRef);
                
                if (userSnap.exists()) {
                    setTargetUser(userSnap.data());
                }
            } catch (error) {
                console.error("Error loading user profile:", error);
            } finally {
                setIsLoadingUser(false);
            }
        };

        fetchTargetUser();
    }, [targetUserId]);

    const handleSubmitReview = async () => {
        if (rating === 0) {
            Alert.alert("Incomplete rating", "Please select between 1 and 5 stars to evaluate this swap.");
            return;
        }

        setIsSubmitting(true);

        try {
            const reviewPayload = createReviewModel(swapId, chatId, currentUser?.uid, targetUserId, rating, comment.trim());
            await setDoc(doc(db, 'reviews', `${swapId}_${currentUser?.uid}`), reviewPayload);
            Alert.alert(
                "Thank you!", 
                "Your review has been successfully submitted.",
                [{ text: "OK", onPress: () => navigation.goBack() }]
            );
        } catch (error) {
            console.error("Error submitting review:", error);
            Alert.alert("Error", "We couldn't submit your review. Please try again later.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
            
            {/* --- HEADER --- */}
            <View style={[styles.header, { borderBottomColor: theme.borderLight }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Iconify icon="lucide:x" size={24} color={theme.textItemTitle} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.textItemTitle }]}>Rate Swapper</Text>
                <View style={styles.backButton} /> 
            </View>

            <KeyboardAvoidingView 
                style={{ flex: 1 }} 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    
                    {/* --- USER PROFILE INFO --- */}
                    {isLoadingUser ? (
                        <ActivityIndicator size="large" color={theme.primary} style={styles.loader} />
                    ) : (
                        <View style={styles.profileSection}>
                            {targetUser?.photoURL || targetUser?.avatarUrl ? (
                                <Image 
                                    source={{ uri: targetUser.photoURL || targetUser.avatarUrl }} 
                                    style={styles.avatar} 
                                />
                            ) : (
                                <View style={[styles.avatarPlaceholder, { backgroundColor: theme.backgroundElement }]}>
                                    <Iconify icon="lucide:user" size={40} color={theme.subtext} />
                                </View>
                            )}
                            <Text style={[styles.userName, { color: theme.textItemTitle }]}>
                                {targetUser?.username || targetUser?.fullName || "Anonymous Swapper"}
                            </Text>
                            <Text style={[styles.userSubtitle, { color: theme.subtext }]}>
                                How did your swap with this person go?
                            </Text>
                        </View>
                    )}

                    {/* --- RATING STARS --- */}
                    <View style={styles.starsContainer}>
                        {[1, 2, 3, 4, 5].map((starPosition) => (
                            <TouchableOpacity 
                                key={starPosition} 
                                onPress={() => setRating(starPosition)}
                                style={styles.starButton}
                                activeOpacity={0.7}
                            >
                                <Iconify 
                                    icon={starPosition <= rating ? "ph:star-fill" : "ph:star"} 
                                    size={48} 
                                    color={starPosition <= rating ? '#F59E0B' : theme.borderLight}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                    
                    <Text style={[styles.ratingLabel, { color: theme.primary }]}>
                        {rating === 1 && "Very Poor 😞"}
                        {rating === 2 && "Below Expectations 😕"}
                        {rating === 3 && "Fair 😐"}
                        {rating === 4 && "Very Good 🙂"}
                        {rating === 5 && "Excellent! 🤩"}
                    </Text>

                    {/* --- COMMENT INPUT BOX --- */}
                    <View style={styles.inputContainer}>
                        <Text style={[styles.inputLabel, { color: theme.textItemTitle }]}>
                            Leave a comment (optional)
                        </Text>
                        <TextInput
                            style={[
                                styles.textInput, 
                                { 
                                    backgroundColor: theme.backgroundElement, 
                                    borderColor: theme.borderLight,
                                    color: theme.textItemTitle 
                                }
                            ]}
                            placeholder="Was the person punctual and easy to communicate with?"
                            placeholderTextColor={theme.subtext}
                            value={comment}
                            onChangeText={setComment}
                            multiline
                            numberOfLines={5}
                            textAlignVertical="top"
                        />
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>

            {/* --- SUBMIT FOOTER BUTTON --- */}
            <View style={[styles.footer, { borderTopColor: theme.borderLight, backgroundColor: theme.background }]}>
                <TouchableOpacity 
                    style={[
                        styles.submitButton, 
                        { backgroundColor: rating > 0 ? theme.primary : theme.borderLight }
                    ]}
                    onPress={handleSubmitReview}
                    disabled={rating === 0 || isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.submitButtonText}>Submit Review</Text>
                    )}
                </TouchableOpacity>
            </View>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
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
