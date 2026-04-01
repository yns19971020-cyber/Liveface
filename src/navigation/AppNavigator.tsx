/**
 * ═══════════════════════════════════════════════════════════════
 * Navigation Setup — LiveStream Premium
 * Native stack navigation with modal presentations for
 * live streaming and video calls.
 * ═══════════════════════════════════════════════════════════════
 */

import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import Theme from '../theme';
import LiveStreamScreen from '../screens/LiveStreamScreen';
import HomeScreen from '../screens/HomeScreen';
import DiscoveryScreen from '../screens/DiscoveryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import VideoCallScreen from '../screens/VideoCallScreen';

// ─── Stack Navigator ─────────────────────────────────────────
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ─── Custom Dark Theme for Navigation ────────────────────────
const DarkNavTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: Theme.Colors.neon.cyan,
    background: Theme.Colors.bg.primary,
    card: Theme.Colors.bg.secondary,
    text: Theme.Colors.text.primary,
    border: Theme.Colors.border.subtle,
    notification: Theme.Colors.semantic.live,
  },
};

/**
 * Bottom Tab Navigator for the main app sections.
 * Uses custom styled tab bar with glassmorphism effects.
 */
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 83,
          backgroundColor: 'rgba(10, 10, 15, 0.92)',
          borderTopColor: Theme.Colors.glass.border,
          borderTopWidth: 1,
          paddingBottom: 28,
          paddingTop: 8,
          elevation: 0,
        },
        tabBarActiveTintColor: Theme.Colors.neon.cyan,
        tabBarInactiveTintColor: Theme.Colors.text.tertiary,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Discovery"
        component={DiscoveryScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="compass" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="GoLive"
        component={LiveStreamScreen}
        options={{
          tabBarIcon: () => (
            <View style={styles.goLiveButton}>
              <Ionicons name="add" size={28} color={Theme.Colors.bg.primary} />
            </View>
          ),
          tabBarLabel: 'Go Live',
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={PlaceholderScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

/**
 * Root Stack Navigator — Manages the top-level navigation flow.
 * Live streaming and video calls are presented as modals.
 */
const RootNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_bottom',
        contentStyle: { backgroundColor: Theme.Colors.bg.primary },
      }}
    >
      {/* Main tab navigation */}
      <Stack.Screen name="MainTabs" component={TabNavigator} />

      {/* Modal screens */}
      <Stack.Group screenOptions={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}>
        <Stack.Screen name="LiveStream" component={LiveStreamScreen} />
        <Stack.Screen name="VideoCall" component={VideoCallScreen} />
      </Stack.Group>

      {/* Push screens */}
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
};

// ─── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  goLiveButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Theme.Colors.gradient.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -12,
    ...Theme.Shadows.neonGlow(Theme.Colors.neon.cyan, 0.3),
  },
});

/**
 * Placeholder screen for screens not yet implemented.
 */
function PlaceholderScreen() {
  return (
    <View style={placeholderStyles.container}>
      <Text style={placeholderStyles.text}>Coming Soon</Text>
    </View>
  );
}

const placeholderStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.Colors.bg.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: Theme.Colors.text.secondary,
    fontSize: Theme.Typography.sizes.lg,
  },
});

// ─── Export ───────────────────────────────────────────────────
export { DarkNavTheme, RootNavigator };
export default function AppNavigator() {
  return (
    <NavigationContainer theme={DarkNavTheme}>
      <RootNavigator />
    </NavigationContainer>
  );
}
