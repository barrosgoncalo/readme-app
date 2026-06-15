/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1C1A19',
    background: '#F2F0EF',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#D6D3D1',
    textSecondary: '#60646C',
    primary: '#5C3D2E',
    primaryText: '#FFFFFF',
    secondary: '#F58B2E',
    tertiary: '#649fcb',
    tertiaryVivid: '#2689d1',
    tertiaryInactive: '#C8DFF0',
    quaternary: '#3B3561',
  },
  dark: {
    text: '#D8D6D4',
    background: '#181615',       
    backgroundElement: '#242120',
    backgroundSelected: '#363230',
    textSecondary: '#8A8D96',
    primary: '#7E5540',          
    primaryText: '#EFECE9',
    secondary: '#FF9B42',        
    tertiary: '#76AED9',         
    tertiaryVivid: '#409EE0',    
    tertiaryInactive: '#2C4459', 
    quaternary: '#5E5496',       
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
    inter_regular: 'Inter-Regular',
    inter_semi: 'Inter-SemiBold',
    inter_bold: 'Inter-Bold',
    playfair_bold: 'Playfair-Bold',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
    inter_regular: 'Inter-Regular',
    inter_semi: 'Inter-SemiBold',
    inter_bold: 'Inter-Bold',
    playfair_bold: 'Playfair-Bold',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    inter: 'Inter_400Regular',
    playfair: 'PlayfairDisplay_700Bold',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
