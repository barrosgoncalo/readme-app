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
    pureWhite: '#FFFFFF',
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
    /** (Bright Orange) - Secondary buttons, notification badges, and distinct interactive elements. */
    darkerSecondary: '#ff8a24',
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
    /** (Pill button Muted). */
    pillButtonMuted: '#555468',
    /** (Pill button Active) */
    pillButtonActive: '#433975',

    cardBackground: '#E8E5E3',
    headerBackground: '#26170D',
    groupShadow: '#E4DFDC',
    iconBg: '#C4BDB8',
    icon: '#342F2C',
    verifiedColor: '#1C0E05',
    /** Pill Colors */
    followPillButton: 'rgba(50,150,243,0.84)',
    blockPillButton: 'rgba(230,55,55,0.83)',
    cancelPillButton: 'rgba(202,197,195,0.85)',
    /** The pitch-black main bar */
    tabBarBackground: '#000000',
    /** The dark gray expanding pill */
    tabBarPillActive: '#2C2C2E',
    /** Pure white for active text and icons */
    tabBarTextActive: '#FFFFFF',
    /** A nice, legible neutral gray for unselected tabs */
    tabBarIconInactive: '#A1A1AA',

    /** (Castanho Acinzentado) - Títulos de destaque na página (ex: mainTitle) */
    textDisplay: '#363230',
    
    /** (Castanho Muito Escuro) - Títulos de itens e livros (ex: currentBookTitle) */
    textItemTitle: '#1C0E05',
    
    /** (Preto Puro) - Texto de botões secundários ou ícones (ex: addButtonText) */
    textBlack: '#000000',
    
    /** (Cinza Quente Claro) - Cabeçalhos de secção e datas (ex: sectionHeaderTitle, historyDayText) */
    textMuted: '#1C0E0540',
    
    /** (Castanho Transparente a 40%) - Nomes de autores ou subtítulos de itens */
    textAuthor: 'rgba(28, 14, 5, 0.4)',
    
    /** (Castanho Transparente a 20%) - Textos muito discretos, como a percentagem de leitura */
    textProgress: 'rgba(28, 14, 5, 0.2)',
    
    /** (Preto com 15% de opacidade) - Cor base para sombras dos cartões flutuantes */
    shadowBase: '#00000025',
    
    /** (Cinza Claro) - Fundo de capas de livros quando a imagem ainda não carregou */
    coverPlaceholder: '#E8E5E3',
    
    /** (Cinza Quente Muito Claro) - Bordas subtis, como a do avatar */
    borderLight: '#E4DFDC',

    borderDark: '#d9d3ce',
    
    /** (Pêssego Claro) - Fundo colorido específico para o container do avatar */
    avatarBgTonal: '#F7D0A3',

    caret: '#1C0E0530',

    heart:'#D32F2F'
  },
  dark: {
    pureWhite: '#FFFFFF',
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
    /** (Bright Orange) - Secondary buttons, notification badges, and distinct interactive elements. */
    darkerSecondary: '#F58B2E',
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
    /** (Pill button Muted). */
    pillButtonMuted: '#8174b3',
    /** (Pill button Active) */
    pillButtonActive: '#433975',
    cardBackground: '#242120',
    headerBackground: '#2a1c11',
    groupShadow: '#242120',
    iconBg: '#342F2C',
    icon: '#C4BDB8',
    verifiedColor: '#F58B2E',
    /** Pill Colors */
    blockPillButton: '#C9484D',
    followPillButton: '#3A8FD0',
    cancelPillButton: '#363230',
    /** Pitch black to anchor the floating bar and provide OLED-friendly contrast*/
    tabBarBackground: '#000000',
    /** Warm Medium-Dark Gray (matches your 'backgroundSelected' color) */
    tabBarPillActive: '#363230',
    /** Off-White (matches your 'primaryText' for perfect harmony) */
    tabBarTextActive: '#EFECE9',
    /** Slate Gray (matches your 'textSecondary' to keep unselected tabs muted but legible) */
    tabBarIconInactive: '#60646C',

    /** (Castanho Acinzentado) - Títulos de destaque na página (ex: mainTitle) */
    textDisplay: '#F2F0EF',

    /** (Branco Quente/Creme) - Títulos de itens e livros. */
    textItemTitle: '#EAE6E3',
    
    /** (Branco Puro) - Texto de botões secundários ou ícones para máximo contraste */
    textBlack: '#F2F0EF',
    
    /** (Cinza Quente Médio) - Cabeçalhos de secção e datas. Legível mas secundário */
    textMuted: '#C4BDB8',
    
    /** (Branco Quente Transparente a 50%) - Nomes de autores ou subtítulos. Usamos branco como base em vez de castanho */
    textAuthor: '#F2F0EF90',
    
    /** (Branco Quente Transparente a 30%) - Textos muito discretos, como a percentagem de leitura */
    textProgress: '#F2F0EF70',
    
    /** (Preto com 40% de opacidade) - As sombras em dark mode precisam de ser mais escuras/opacas para criar profundidade */
    shadowBase: '#00000060',
    
    /** (Cinza Escuro Quente) - Fundo de capas de livros. Combina com o teu backgroundSelected */
    coverPlaceholder: '#363230',
    
    /** (Cinza Escuro) - Bordas subtis, um pouco mais claras que o fundo dos cartões (#242120) */
    borderLight: '#3A3532',

    borderDark: '#292424',
    
    /** (Pêssego Queimado/Terracota) - Fundo colorido do avatar, adaptado para não brilhar demasiado no escuro */
    avatarBgTonal: '#A06C4B',

    caret: '#F2F0EF60',

    heart:'#D32F2F'
  },
    password: {
        gray: '#ccc',
        red: '#D32F2F',
        orange: '#F57C00',
        green: '#388E3C',
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
