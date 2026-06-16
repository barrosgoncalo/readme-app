import React, { useState, useEffect, useRef } from 'react';
import { View, Animated, Image } from 'react-native';
import * as ExpoSplash from 'expo-splash-screen';
import { useColorScheme } from '@readme/shared/src/hooks/use-color-scheme';
import { buildStyles } from './splashStyles';
import { Colors } from '@readme/shared/src/constants/theme';

ExpoSplash.preventAutoHideAsync();

const MOTTO_WORDS = ["Connect.", "Trade.", "Read Together."];


export default function SplashScreen({ onFinish }) {
    const [index, setIndex] = useState(0);

    const slideAnim = useRef(new Animated.Value(30)).current; 
    const fadeAnim = useRef(new Animated.Value(0)).current;   

    const [isLogoLoaded, setIsLogoLoaded] = useState(false);

    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const styles = buildStyles(theme);

    useEffect(() => {
        let isMounted = true;
        let currentIndex = 0;

        const animateWord = () => {
            if (!isMounted) return;

            // 1. Reset positions
            slideAnim.setValue(30);
            fadeAnim.setValue(0);
            setIndex(currentIndex);

            // 2. Slide UP and Fade IN
            Animated.parallel([
                Animated.timing(slideAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
                Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true })
            ]).start(() => {

                    // 3. Keep visible
                    setTimeout(() => {
                        if (!isMounted) return;

                        // 4. Slide UP and Fade OUT
                        Animated.parallel([
                            Animated.timing(slideAnim, { toValue: -30, duration: 180, useNativeDriver: true }),
                            Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true })
                        ]).start(() => {
                                if (!isMounted) return;

                                currentIndex++;

                                if (currentIndex < MOTTO_WORDS.length) {
                                    animateWord();
                                } else {
                                    onFinish(); 
                                }
                            });
                    }, 1000); 
                });
        };

        if (isLogoLoaded) {
            const startSequence = async () => {
                if (!isMounted) return;

                await ExpoSplash.hideAsync();

                animateWord();
            };
            startSequence();
        }

        return () => { isMounted = false; };
    }, [isLogoLoaded, onFinish, slideAnim, fadeAnim]);

    return (
        <View style={styles.container}>
            <Image 
                source={ colorScheme === 'dark' 
                    ? require('../../../assets/images/splash-dark.png')
                    : require('../../../assets/images/splash-light.png')
                } 
                style={styles.logo}
                resizeMode="contain"
                onLoad={() => setIsLogoLoaded(true)}
            />

            <View style={styles.mottoContainer}>
                <Animated.Text
                    style={[
                        styles.mottoText,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    {MOTTO_WORDS[index]}
                </Animated.Text>
            </View>
        </View>
    );
}
