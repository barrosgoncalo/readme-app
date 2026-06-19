import { useRef } from 'react';
import { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useTabBarVisibility } from '../components/ui/TabBarContext'; // Adjust path if needed

export function useScrollTabBarControl() {
    const { showTabBar, hideTabBar } = useTabBarVisibility();
    
    // Explicitly type the ref as a number
    const lastOffsetY = useRef<number>(0);

    // Add the React Native scroll event types here
    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const currentOffset = event.nativeEvent.contentOffset.y;
        
        // Calculate exactly how many pixels the user scrolled since the last frame
        const diff = currentOffset - lastOffsetY.current;

        // SENSITIVITY CONTROL: 
        // How many pixels must the user scroll before the tab bar reacts?
        // Lower numbers (like 3-5) = hyper-sensitive, disappears instantly.
        // Higher numbers (like 15+) = requires a more deliberate, longer swipe.
        const sensitivityThreshold = 4; 

        if (diff > sensitivityThreshold && currentOffset > 10) {
            // User is explicitly scrolling down the page -> hide it instantly
            hideTabBar();
        } else if (diff < -sensitivityThreshold) {
            // User is explicitly scrolling up the page -> show it instantly
            showTabBar();
        }

        // Safety check: always force it open at the absolute top of the screen
        if (currentOffset <= 0) {
            showTabBar();
        }

        lastOffsetY.current = currentOffset;
    };

    return handleScroll;
}
