/**
 * ═══════════════════════════════════════════════════════════════
 * Theme Configuration — LiveStream Premium
 * Dark glassmorphism palette, neon accents, typography & spacing.
 * ═══════════════════════════════════════════════════════════════
 */

import { Dimensions, Platform, StatusBar } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Design Tokens ────────────────────────────────────────────
export const Colors = {
  // Core background
  bg: {
    primary: '#0A0A0F',
    secondary: '#111118',
    tertiary: '#1A1A24',
    card: '#16161F',
    elevated: '#1E1E2A',
    overlay: 'rgba(10, 10, 15, 0.85)',
    overlayLight: 'rgba(10, 10, 15, 0.55)',
  },

  // Neon accent palette
  neon: {
    cyan: '#00F0FF',
    cyanDim: '#00A3AD',
    purple: '#A855F7',
    purpleDim: '#7C3AED',
    pink: '#FF2D78',
    pinkDim: '#CC1F5E',
    green: '#00FF88',
    greenDim: '#00CC6E',
    orange: '#FF6B35',
    blue: '#3B82F6',
  },

  // Semantic colors
  semantic: {
    live: '#FF3B30',
    liveGlow: 'rgba(255, 59, 48, 0.4)',
    online: '#00FF88',
    offline: '#8E8E93',
    warning: '#FFCC00',
    error: '#FF453A',
    success: '#30D158',
    info: '#64D2FF',
  },

  // Text
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255, 255, 255, 0.72)',
    tertiary: 'rgba(255, 255, 255, 0.45)',
    disabled: 'rgba(255, 255, 255, 0.25)',
    inverse: '#0A0A0F',
  },

  // Glass
  glass: {
    light: 'rgba(255, 255, 255, 0.08)',
    medium: 'rgba(255, 255, 255, 0.12)',
    heavy: 'rgba(255, 255, 255, 0.18)',
    border: 'rgba(255, 255, 255, 0.12)',
    borderLight: 'rgba(255, 255, 255, 0.06)',
  },

  // Gradients
  gradient: {
    primary: ['#00F0FF', '#A855F7'],
    secondary: ['#FF2D78', '#FF6B35'],
    live: ['#FF3B30', '#FF6B35'],
    chatBubble: ['rgba(168, 85, 247, 0.25)', 'rgba(0, 240, 255, 0.12)'],
  },

  // Borders
  border: {
    subtle: 'rgba(255, 255, 255, 0.08)',
    medium: 'rgba(255, 255, 255, 0.15)',
    focus: '#00F0FF',
  },
};

// ─── Typography ───────────────────────────────────────────────
export const Typography = {
  families: {
    display: Platform.OS === 'ios' ? 'SF Pro Display' : 'Inter',
    body: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter',
    mono: 'JetBrains Mono',
  },

  sizes: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    display: 34,
    hero: 42,
  },

  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
  },

  lineHeights: {
    tight: 1.15,
    normal: 1.35,
    relaxed: 1.55,
  },
};

// ─── Spacing ──────────────────────────────────────────────────
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  huge: 48,
  massive: 64,
};

// ─── Border Radius ───────────────────────────────────────────
export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 100,
  circle: SCREEN_WIDTH / 2,
};

// ─── Shadows ──────────────────────────────────────────────────
export const Shadows = {
  neon: (color: string = Colors.neon.cyan) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  }),

  neonGlow: (color: string = Colors.neon.cyan, intensity: number = 0.35) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: intensity,
    shadowRadius: 20,
    elevation: 12,
  }),

  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },

  elevated: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 10,
  },

  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
};

// ─── Animation Timings ───────────────────────────────────────
export const Animations = {
  duration: {
    instant: 100,
    fast: 200,
    normal: 350,
    slow: 500,
    sluggish: 800,
  },

  spring: {
    bouncy: { damping: 12, stiffness: 180 },
    gentle: { damping: 20, stiffness: 120 },
    stiff: { damping: 8, stiffness: 300 },
  },

  easing: {
    standard: [0.4, 0, 0.2, 1] as const,
    decelerate: [0, 0, 0.2, 1] as const,
    accelerate: [0.4, 0, 1, 1] as const,
    easeInOut: [0.42, 0, 0.58, 1] as const,
  },
};

// ─── Glassmorphism Styles ────────────────────────────────────
export const GlassStyles = {
  card: {
    backgroundColor: Colors.glass.light,
    borderWidth: 1,
    borderColor: Colors.glass.border,
    backdropFilter: 'blur(20px)',
  },

  surface: {
    backgroundColor: Colors.glass.medium,
    borderWidth: 1,
    borderColor: Colors.glass.borderLight,
    backdropFilter: 'blur(40px)',
  },

  floating: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(24px)',
  },
};

// ─── Screen Metrics ──────────────────────────────────────────
export const Metrics = {
  screenWidth: SCREEN_WIDTH,
  screenHeight: SCREEN_HEIGHT,
  statusBarHeight: StatusBar.currentHeight || (Platform.OS === 'ios' ? 47 : 24),
  navBarHeight: 44,
  bottomTabHeight: 83,
  safeAreaTop: Platform.OS === 'ios' ? 47 : 0,
  safeAreaBottom: Platform.OS === 'ios' ? 34 : 0,
  isIphoneX: Platform.OS === 'ios' && (SCREEN_HEIGHT === 812 || SCREEN_HEIGHT === 896 || SCREEN_HEIGHT >= 844),
};

// ─── Default Theme Export ────────────────────────────────────
const Theme = {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  Animations,
  GlassStyles,
  Metrics,
};

export default Theme;
