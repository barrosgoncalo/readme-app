/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

/**
 * Core system color palette for Light and Dark themes.
 */
export const Colors = {
  light: {
    /** (Almost Black) - Main body copy, headings, and core readable text. */
    text: '#1C1A19',
    /** (Dark Gray) - Captions, placeholders, descriptions, and less prominent text. */
    subtext: '#4A4A4A',
    /** (Off-White) - The foundational app canvas for screens and views. */
    background: '#F2F0EF',
    /** (Pure White) - Cards, modals, bottom sheets, and elevated UI containers. */
    backgroundElement: '#FFFFFF',
    /** (Light Gray) - Highlighted rows, pressed button states, or selected tabs. */
    backgroundSelected: '#D6D3D1',
    /** (Dark Brown) - Prominent calls-to-action, primary buttons, and major UI accents. */
    primary: '#5C3D2E',
    /** (Pure White) - Text specifically designed to sit on top of primary color elements. */
    primaryText: '#FFFFFF',
    /** (Bright Orange) - Secondary buttons, notification badges, and distinct interactive elements. */
    secondary: '#F58B2E',
    /** (Bright Orange) - Alternative text used for inline accents. */
    textSecondary: '#F58B2E',
    /** (Soft Blue) - Soft accent for informational alerts and standard links. */
    tertiary: '#649fcb',
    /** (Vivid Blue) - Strong accent for active links and vibrant informational badges. */
    tertiaryVivid: '#2689d1',
    /** (Pale Blue) - Disabled states for blue buttons, or subtle blue background fills. */
    tertiaryInactive: '#C8DFF0',
    /** (Dark Purple) - Final accent for distinct tags or alternative categorization. */
    quaternary: '#3B3561',
    cardBackground: '#E8E5E3',
    headerBackground: '#241B15',
  },
  dark: {
    /** (Light Gray) - Main body copy, headings, and core readable text. */
    text: '#D8D6D4',
    /** (Medium Gray) - Captions, placeholders, descriptions, and less prominent text. */
    subtext: '#CCCCCC',
    /** (Very Dark Charcoal) - The foundational app canvas for screens and views. */
    background: '#181615',      
    /** (Dark Grayish-Brown) - Cards, modals, bottom sheets, and elevated UI containers. */
    backgroundElement: '#242120',
    /** (Medium Dark Gray) - Highlighted rows, pressed button states, or selected tabs. */
    backgroundSelected: '#363230',
    /** (Warm Medium Brown) - Prominent calls-to-action, primary buttons, and major UI accents. */
    primary: '#7E5540',          
    /** (Off-White) - Text specifically designed to sit on top of primary color elements. */
    primaryText: '#EFECE9',
    /** (Light Bright Orange) - Secondary buttons, notification badges, and distinct interactive elements. */
    secondary: '#FF9B42',        
    /** (Slate Gray) - Alternative text used for muted/disabled text. */
    textSecondary: '#60646C',
    /** (Soft Muted Blue) - Soft accent for informational alerts and standard links. */
    tertiary: '#76AED9',         
    /** (Bright Vivid Blue) - Strong accent for active links and vibrant informational badges. */
    tertiaryVivid: '#409EE0',    
    /** (Dark Slate Blue) - Disabled states for blue buttons, or subtle blue background fills. */
    tertiaryInactive: '#2C4459', 
    /** (Muted Purple) - Final accent for distinct tags or alternative categorization. */
    quaternary: '#5E5496',       
    cardBackground: '#E8E5E3',
    headerBackground: '#241B15',
  },
    password: {
        gray: '#ccc',
        red: '#D32F2F',
        orange: '#F57C00',
        green: '#388E3C',
    }
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
