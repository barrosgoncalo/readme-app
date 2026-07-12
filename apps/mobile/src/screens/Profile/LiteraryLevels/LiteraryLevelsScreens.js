import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    Image, 
    TouchableOpacity, 
    ScrollView, 
    Modal, 
    Dimensions,
    StatusBar,
    useColorScheme,
    StyleSheet,
    Share
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Iconify } from 'react-native-iconify';

// Context, Theme & Constants Imports
import { useTheme } from '@readme/shared/src/hooks/use-theme';
import { useAuth } from '@readme/shared/src/contexts/AuthContext';
import { GAMIFICATION_RANKS } from '@readme/shared/src/constants/gamification';

const { width } = Dimensions.get('window');

export default function LiteraryLevelsPage({ navigation, route }) {
    // 1. Fetch live user data safely to avoid ReferenceErrors
    const { currentUser: user, refreshUser } = useAuth() || {}; 

    // Refresh user data from Firestore when this screen opens
    useEffect(() => {
        if (refreshUser) {
            refreshUser();
        }
    }, []);
    
    // Dynamic fallback cascading: Context State -> Route Params -> Default to 0
    const currentSwapsCompleted = user?.gamification?.completedSwapsCount ?? route?.params?.user?.gamification?.completedSwapsCount ?? 0;

    const colorScheme = useColorScheme();
    const theme = useTheme();
    const styles = buildLevelsStyles(theme);

    // 2. DYNAMIC MILESTONE CALCULATIONS
    // Safely find the highest badge achieved (returns null if user has 0 swaps)
    const highestUnlockedBadge = [...GAMIFICATION_RANKS].reverse().find(b => currentSwapsCompleted >= b.milestone) || null;

    // Target badge is the next upcoming milestone, or the absolute final badge if maxed out
    const targetBadge = GAMIFICATION_RANKS.find(b => b.milestone > currentSwapsCompleted) || GAMIFICATION_RANKS[GAMIFICATION_RANKS.length - 1];
    const targetSwaps = targetBadge.milestone;

    // Calculate progress bar percentages cleanly
    const progressPercentage = Math.min((currentSwapsCompleted / targetSwaps) * 100, 100);

    // Modal State
    const [selectedBadge, setSelectedBadge] = useState(null);
    const hasUnlockedSelectedBadge = selectedBadge ? currentSwapsCompleted >= selectedBadge.milestone : false;

    // 3. NATIVE SHARING INTERACTION
    const handleShareAchievement = async (badge) => {
        if (!badge) return;
        try {
            await Share.share({
                message: `📚 I just unlocked the "${badge.title}" badge on Bookworms after completing ${currentSwapsCompleted} book swaps! Join me, share your stories, and clear your shelves! ✨`,
            });
        } catch (error) {
            console.error("Error invocation failed during sharing action:", error);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle={colorScheme === 'dark' ? "light-content" : "dark-content"} />

            {/* --- TOP NAVIGATION HEADER --- */}
            <SafeAreaView edges={['top']} style={styles.navHeader}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Iconify icon="lucide:arrow-left" size={24} color={theme.textItemTitle} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Achievements</Text>
                <View style={{ width: 44 }} />
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* --- MAIN LEVEL DISPLAY (Next Swap Goal) --- */}
                <View style={styles.mainBadgeContainer}>
                    <View style={styles.largeBadgeWrapper}>
                        <Image 
                            source={targetBadge.image} 
                            style={styles.largeBadgeImage}
                            resizeMode="contain"
                        />
                    </View>

                    <Text style={styles.mainTitle}>
                        {currentSwapsCompleted >= GAMIFICATION_RANKS[GAMIFICATION_RANKS.length - 1].milestone 
                            ? "Ultimate Tier Achieved!" 
                            : `Complete ${targetSwaps} Swaps`
                        }
                    </Text>

                    {/* Progress Bar */}
                    <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
                    </View>
                    <Text style={styles.progressText}>{currentSwapsCompleted}/{targetSwaps}</Text>
                </View>

                {/* --- GAMIFICATION_RANKS GRID --- */}
                <View style={styles.gridContainer}>
                    {GAMIFICATION_RANKS.map((badge) => {
                        const isHighestAchieved = highestUnlockedBadge ? badge.id === highestUnlockedBadge.id : false;
                        const isUnlocked = currentSwapsCompleted >= badge.milestone;

                        return (
                            <TouchableOpacity 
                                key={badge.id} 
                                style={styles.gridItem}
                                onPress={() => setSelectedBadge(badge)}
                            >
                                <View style={[
                                    styles.smallBadgeWrapper, 
                                    isHighestAchieved ? styles.activeBadgeBorder : null,
                                    !isUnlocked ? styles.lockedBadge : null 
                                ]}>
                                    <Image 
                                        source={badge.image} 
                                        style={[
                                            styles.smallBadgeImage,
                                            !isUnlocked && styles.lockedBadgeImage 
                                        ]}
                                        resizeMode="contain"
                                    />
                                </View>
                                <Text style={[
                                    styles.gridMilestoneText,
                                    !isUnlocked && styles.lockedText
                                ]}>
                                    {badge.milestone}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

            </ScrollView>

            {/* --- SWAP ACHIEVEMENT MODAL --- */}
            <Modal
                visible={selectedBadge !== null}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setSelectedBadge(null)}
            >
                {selectedBadge && (
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>

                            {/* Close Button */}
                            <TouchableOpacity 
                                style={styles.closeModalButton} 
                                onPress={() => setSelectedBadge(null)}
                            >
                                <Iconify icon="lucide:x" size={20} color={theme.textItemTitle} />
                            </TouchableOpacity>

                            <View style={styles.largeBadgeWrapperModal}>
                                <Image 
                                    source={selectedBadge.image} 
                                    style={styles.largeBadgeImageModal}
                                    resizeMode="contain"
                                />
                            </View>

                            {/* Dynamic Copy tailored for Swaps */}
                            <Text style={styles.congratsTitle}>
                                {hasUnlockedSelectedBadge ? "Congratulations!" : "Keep Swapping!"}
                            </Text>
                            <Text style={styles.congratsSubtitle}>{`Complete ${selectedBadge.milestone} Swaps`}</Text>

                            <Text style={styles.congratsBody}>
                                {hasUnlockedSelectedBadge 
                                    ? `This is a significant step towards expanding your shared library space. By reaching the ${selectedBadge.title} milestone, you've helped build a vibrant community of literature sharing.`
                                    : `You are currently a ${highestUnlockedBadge?.title || "Reader"}. Complete more book swaps to unlock the ${selectedBadge.title} badge and keep sharing stories!`
                                }
                            </Text>

                            {/* Secure Check: Only show sharing interface if they've earned it */}
                            {hasUnlockedSelectedBadge && (
                                <>
                                    <Text style={styles.sharePrompt}>Share with a friend</Text>

                                    <TouchableOpacity 
                                        style={styles.shareButton}
                                        onPress={() => handleShareAchievement(selectedBadge)}
                                    >
                                        <Text style={styles.shareButtonText}>Share</Text>
                                    </TouchableOpacity>
                                </>
                            )}

                        </View>
                    </View>
                )}
            </Modal>

        </View>
    );
}

// Dynamic theme style factory
export const buildLevelsStyles = (theme) => {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.background,
        },
        navHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingBottom: 12,
            backgroundColor: theme.background,
        },
        backButton: {
            width: 44,
            height: 44,
            justifyContent: 'center',
            alignItems: 'flex-start',
        },
        headerTitle: {
            fontSize: 18,
            fontWeight: '700',
            color: theme.textItemTitle,
        },
        scrollContent: {
            padding: 24,
            alignItems: 'center',
            paddingTop: 20, 
            paddingBottom: 40,
        },
        mainBadgeContainer: {
            alignItems: 'center',
            backgroundColor: theme.backgroundElement,
            width: '100%',
            padding: 30,
            borderRadius: 24,
            shadowColor: theme.shadowBase,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.1,
            shadowRadius: 16,
            elevation: 5,
            marginBottom: 40,
        },
        largeBadgeWrapper: {
            width: 160,
            height: 160,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 24,
            borderRadius: 80,
            backgroundColor: theme.backgroundElement,
        },
        largeBadgeImage: {
            width: '100%',
            height: '100%',
        },
        mainTitle: {
            fontSize: 22,
            fontWeight: '800',
            color: theme.textDisplay,
            marginBottom: 16,
        },
        progressTrack: {
            width: '100%',
            height: 8,
            backgroundColor: theme.borderLight,
            borderRadius: 4,
            overflow: 'hidden',
            marginBottom: 8,
        },
        progressFill: {
            height: '100%',
            backgroundColor: theme.secondary,
            borderRadius: 4,
        },
        progressText: {
            fontSize: 14,
            color: theme.subtext,
            fontWeight: '600',
        },
        gridContainer: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            columnGap: 24,
            rowGap: 32,
            width: '100%',
        },
        gridItem: {
            alignItems: 'center',
            width: (width - 120) / 3,
        },
        smallBadgeWrapper: {
            width: 70,
            height: 70,
            borderRadius: 35,
            backgroundColor: theme.backgroundElement,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 12,
            shadowColor: theme.shadowBase,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 3,
        },
        smallBadgeImage: {
            width: '85%',
            height: '85%',
        },
        activeBadgeBorder: {
            borderWidth: 3,
            borderColor: theme.secondary,
        },
        lockedBadge: {
            opacity: 0.6,
            backgroundColor: theme.background, 
        },
        lockedBadgeImage: {
            opacity: 0.4, 
        },
        gridMilestoneText: {
            fontSize: 14,
            fontWeight: '700',
            color: theme.textItemTitle,
            textAlign: 'center',
        },
        lockedText: {
            color: theme.subtext,
        },
        modalOverlay: {
            flex: 1,
            backgroundColor: theme.shadowBase,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
        },
        modalContent: {
            backgroundColor: theme.backgroundElement,
            width: '100%',
            borderRadius: 24,
            padding: 30,
            alignItems: 'center',
            shadowColor: theme.shadowBase,
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.2,
            shadowRadius: 20,
            elevation: 10,
        },
        closeModalButton: {
            position: 'absolute',
            top: 20,
            right: 20,
            width: 32,
            height: 32,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme.background,
            borderRadius: 16,
        },
        largeBadgeWrapperModal: {
            width: 140,
            height: 140,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 20,
            marginTop: 10,
        },
        largeBadgeImageModal: {
            width: '100%',
            height: '100%',
        },
        congratsTitle: {
            fontSize: 24,
            fontWeight: '800',
            color: theme.textDisplay,
            marginBottom: 8,
        },
        congratsSubtitle: {
            fontSize: 18,
            fontWeight: '700',
            color: theme.textItemTitle,
            marginBottom: 16,
        },
        congratsBody: {
            fontSize: 14,
            color: theme.subtext,
            textAlign: 'center',
            lineHeight: 22,
            marginBottom: 30,
        },
        sharePrompt: {
            fontSize: 12,
            color: theme.subtext,
            marginBottom: 12,
            fontWeight: '600',
        },
        shareButton: {
            backgroundColor: theme.primary,
            paddingVertical: 14,
            paddingHorizontal: 40,
            borderRadius: 100,
            width: '100%',
            alignItems: 'center',
        },
        shareButtonText: {
            color: theme.primaryText,
            fontSize: 16,
            fontWeight: 'bold',
        },
    });
};
