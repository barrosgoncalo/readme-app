import React, { useState, useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Image } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

const MOTTO_WORDS = ["Connect.", "Trade.", "Read Together."];

export default function WelcomeScreen({ navigation }) {
    const [index, setIndex] = useState(0);

    const slideAnim = useRef(new Animated.Value(30)).current; 
    const fadeAnim = useRef(new Animated.Value(0)).current;   

    const [isLogoLoaded, setIsLogoLoaded] = useState(false);

    useEffect(() => {
        let isMounted = true;
        let currentIndex = 0; // Keep track of which word we are on locally

        const animateWord = () => {
            if (!isMounted) return;

            // 1. Reset positions
            slideAnim.setValue(30);
            fadeAnim.setValue(0);
            setIndex(currentIndex);

            // 2. Slide UP and Fade IN (Sped up to 400ms)
            Animated.parallel([
                Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
                Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true })
            ]).start(() => {

                    // 3. Keep visible for 1 second (Sped up from 1.5s)
                    setTimeout(() => {
                        if (!isMounted) return;

                        // 4. Slide UP and Fade OUT (Sped up to 400ms)
                        Animated.parallel([
                            Animated.timing(slideAnim, { toValue: -30, duration: 200, useNativeDriver: true }),
                            Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true })
                        ]).start(() => {
                                if (!isMounted) return;

                                currentIndex++; // Move to the next word

                                // 5. Check if we have more words, or if we are done!
                                if (currentIndex < MOTTO_WORDS.length) {
                                    animateWord(); // Loop to the next word
                                } else {
                                    // The animation is completely finished. Auto-navigate!
                                    // We use .replace() instead of .navigate() so the user cannot 
                                    // swipe "back" to this loading screen by accident.
                                    navigation.replace('Register'); 
                                }
                            });
                    }, 1000); 
                });
        };

        if (isLogoLoaded) {
            const startSequence = async () => {
                if (!isMounted) return;

                // Hide the native splash screen precisely when the React screen is perfectly ready
                await SplashScreen.hideAsync();

                // Start the text animation
                animateWord();
            };
            startSequence();
        }

        return () => { isMounted = false; };
    }, [isLogoLoaded, navigation, slideAnim, fadeAnim]);

    return (
        <View style={styles.container}>
            <Image 
                source={require('../../../assets/images/splash.png')} 
                style={styles.logo}
                resizeMode="contain"
                // NEW: Tell our state exactly when the image is fully painted!
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff', 
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 250,
    height: 250,
  },
  mottoContainer: {
    position: 'absolute',
    top: '65%',
    height: 40, 
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  mottoText: {
    fontSize: 22, 
    fontWeight: '700',
    color: '#1A1A1A', 
    letterSpacing: 0.5,
  }
});
