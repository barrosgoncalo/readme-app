import React, { useRef, useEffect, createContext, useContext } from 'react';
import { TouchableOpacity, Animated, StyleSheet, View, useColorScheme } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Colors } from '@readme/shared/src/constants/theme';
import { Iconify } from 'react-native-iconify';

// Screens
import BookList from '../screens/Shelf/BookList'; 
import MapScreen from '../screens/Events/MapScreen'; 
import ProfileScreen from '../screens/Profile/ProfileScreen';

// Components
import { TabBarVisibilityContext } from './ui/TabBarContext';

const Tab = createBottomTabNavigator();

// --- 2. Define Props ---
type TabItemProps = {
    isFocused: boolean;
    onPress: () => void;
    label: string;
    iconName: string;
    themeColors: typeof Colors.light;
};

// --- 3. Individual Animated Tab Item ---
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
        // We use a hex transparent color format matching the target color format
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
        {isFocused && (
            <Animated.Text style={[styles.tabText, { opacity: animValue, color: themeColors.tabBarTextActive }]}>
            {label}
            </Animated.Text>
        )}
        </Animated.View>
        </TouchableOpacity>
    );
};

// --- 4. Custom Tab Bar Container ---
type CustomTabBarProps = BottomTabBarProps & {
    translateY: Animated.Value;
    themeColors: typeof Colors.light;
};

function CustomTabBar({ state, navigation, translateY, themeColors }: CustomTabBarProps) {
    const getIconName = (routeName: string, isFocused: boolean) => {
        switch (routeName) {
            case 'Explore': return isFocused ? 'fluent:home-24-filled' : 'fluent:home-24-regular';
            case 'Add': return 'fluent:add-24-filled'; 
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
                transform: [{ translateY: translateY }]
            }
        ]}
        >
        {state.routes.map((route, index) => {
            const isFocused = state.index === index;

            const onPress = () => {
                if (route.name === 'Add') {
                    alert('This will trigger the Add Book Popup!');
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
                label={route.name}
                iconName={getIconName(route.name, isFocused)}
                themeColors={themeColors} // Passing theme down
                />
            );
        })}
        </Animated.View>
    );
}

// --- 5. Main Navigator ---
const DummyAddScreen = () => null; 

export default function AppTabs() {
    const translateY = useRef(new Animated.Value(0)).current;

    const isDark = useColorScheme() === 'dark';
    const themeColors = Colors[isDark ? 'dark' : 'light'];

    const showTabBar = () => {
        Animated.spring(translateY, {
            toValue: 0,
            stiffness: 200, 
            damping: 25,    
            mass: 1.2,      
            useNativeDriver: true,
        }).start();
    };

    const hideTabBar = () => {
        Animated.spring(translateY, {
            toValue: 130, 
            stiffness: 150,
            damping: 15,
            mass: 1.5,
            useNativeDriver: true,
        }).start();
    };

    return (
        <TabBarVisibilityContext.Provider value={{ showTabBar, hideTabBar }}>
        <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} translateY={translateY} themeColors={themeColors} />}
        screenOptions={{ headerShown: false }} 
        >
        <Tab.Screen name="Explore" component={MapScreen} />
        <Tab.Screen name="Add" component={DummyAddScreen} />
        <Tab.Screen name="Shelf" component={BookList} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
        </TabBarVisibilityContext.Provider>
    );
}

// --- 6. Static Styles ---
const styles = StyleSheet.create({
    floatingBar: {
        position: 'absolute',
        bottom: 30,
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
