import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, Animated, StyleSheet, View, useColorScheme, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@readme/shared/src/constants/theme';
import { Iconify } from 'react-native-iconify';

// Screens
import ReadingListScreen from '../screens/Shelf/ReadingListScreen'; 
import ExploreScreen from '../screens/Explore/ExploreScreen'; 
import ProfileScreen from '../screens/Profile/ProfileScreen';

import { TabBarVisibilityContext } from './ui/TabBarContext';

const Tab = createBottomTabNavigator();

type TabItemProps = {
    isFocused: boolean;
    onPress: () => void;
    label: string;
    iconName: string;
    themeColors: any;
};

const TabItem = ({ isFocused, onPress, label, iconName, themeColors }: TabItemProps) => {
    const animValue = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(animValue, {
            toValue: isFocused ? 1 : 0,
            duration: 250,
            useNativeDriver: false, 
        }).start();
    }, [isFocused]);

    const width = animValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['50', '110'], 
    });

    const activePillColor = themeColors?.tabBarPillActive;

    const bgColor = animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [`${activePillColor}00`, activePillColor], 
    });

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
            <Animated.View style={[styles.tabItem, { width, backgroundColor: bgColor }]}>
                <Iconify 
                    icon={iconName} 
                    size={24} 
                    color={isFocused ? themeColors.tabBarTextActive : themeColors.tabBarIconInactive} 
                />
                {isFocused && label !== '' && (
                    <Animated.Text style={[styles.tabText, { opacity: animValue, color: themeColors.tabBarTextActive }]}>
                        {label}
                    </Animated.Text>
                )}
            </Animated.View>
        </TouchableOpacity>
    );
};

function CustomTabBar({ state, navigation, translateY, themeColors }: any) {
    const insets = useSafeAreaInsets(); // <--- 1. Reads native safe area insets

    const getIconName = (routeName: string, isFocused: boolean) => {
        switch (routeName) {
            case 'Explore': return isFocused ? 'fluent:home-24-filled' : 'fluent:home-24-regular';
            case 'AddPlaceholder': return 'fluent:add-24-filled'; 
            case 'Shelf': return isFocused ? 'fluent:library-24-filled' : 'fluent:library-24-regular';
            case 'Profile': return isFocused ? 'fluent:person-24-filled' : 'fluent:person-24-regular';
            default: return 'fluent:circle-24-regular';
        }
    };

    return (
        <Animated.View 
            style={[
                styles.floatingBar, 
                { 
                    backgroundColor: themeColors.tabBarBackground, 
                    // 2. Dynamically pushes the floating bar above Android/iOS system bar.
                    // Only a fraction of the full inset is used — a floating pill
                    // doesn't need the same clearance as edge-to-edge content.
                    // Android gets a bit more base clearance since its gesture-nav
                    // inset tends to read smaller than iOS's home-indicator inset.
                    bottom: (Platform.OS === 'android' ? 16 : 8) + insets.bottom * 0.5, 
                    transform: [{ translateY }] 
                }
            ]}
        >
            {state.routes.map((route: any, index: number) => {
                const isFocused = state.index === index;

                const onPress = () => {
                    if (route.name === 'AddPlaceholder') {
                        navigation.navigate('Publication'); 
                        return;
                    }

                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name);
                    }
                };

                return (
                    <TabItem
                        key={route.key}
                        isFocused={isFocused}
                        onPress={onPress}
                        label={route.name === 'AddPlaceholder' ? '' : route.name}
                        iconName={getIconName(route.name, isFocused)}
                        themeColors={themeColors}
                    />
                );
            })}
        </Animated.View>
    );
}

const ViewPlaceholder = () => <View style={{ flex: 1, backgroundColor: 'transparent' }} />;

export default function AppTabs() {
    const translateY = useRef(new Animated.Value(0)).current;
    const isDark = useColorScheme() === 'dark';
    const themeColors = Colors[isDark ? 'dark' : 'light'];

    const showTabBar = () => { Animated.spring(translateY, { toValue: 0, stiffness: 200, damping: 20, useNativeDriver: true }).start(); };
    const hideTabBar = () => { Animated.spring(translateY, { toValue: 130, stiffness: 150, damping: 15, useNativeDriver: true }).start(); };

    return (
        <TabBarVisibilityContext.Provider value={{ showTabBar, hideTabBar }}>
            <Tab.Navigator
                tabBar={(props) => <CustomTabBar {...props} translateY={translateY} themeColors={themeColors} />}
                screenOptions={{ headerShown: false }} 
            >
                <Tab.Screen name="Explore" component={ExploreScreen} />
                <Tab.Screen name="AddPlaceholder" component={ViewPlaceholder} /> 
                <Tab.Screen name="Shelf" component={ReadingListScreen} />
                <Tab.Screen name="Profile" component={ProfileScreen} />
            </Tab.Navigator>
        </TabBarVisibilityContext.Provider>
    );
}

const styles = StyleSheet.create({
    floatingBar: {
        position: 'absolute',
        // 'bottom' is now calculated dynamically in CustomTabBar style
        left: 20,
        right: 20,
        height: 70,
        borderRadius: 40,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15, 
        shadowRadius: 15,
        elevation: 10,
    },
    tabItem: {
        height: 50,
        borderRadius: 25, 
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
});
