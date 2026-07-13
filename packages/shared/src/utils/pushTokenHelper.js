import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Handles incoming alerts while the app is actively open
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export async function registerForPushNotificationsAsync() {
    let token;

    // Push tokens require a physical device (Simulators usually fail or return null)
    if (!Device.isDevice) {
        console.log('[PushHelper] Must use a physical device for Push Notifications');
        return null;
    }

    // 1. Check current native permission status
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // 2. If permission hasn't been granted yet, prompt the user
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    // 3. User denied permission, exit cleanly
    if (finalStatus !== 'granted') {
        console.log('[PushHelper] Failed to get push token: Permission denied.');
        return null;
    }

    // 4. Fetch the Expo Push Token
    try {
        token = (await Notifications.getExpoPushTokenAsync()).data;
        console.log("[PushHelper] Token generated successfully:", token);
    } catch (error) {
        console.error("[PushHelper] Error fetching Expo Push Token:", error);
        return null;
    }

    // 5. Android specific configuration for channels (Required for Android 8.0+)
    if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F71',
        });
    }

    return token;
}
