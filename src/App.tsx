/**
 * ═══════════════════════════════════════════════════════════════
 * App Entry Point — LiveStream Premium
 * Root component with providers, gesture handler, and splash screen.
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';

// Prevent yellow box warnings in development
LogBox.ignoreAllLogs(true);

// Keep splash screen visible while loading resources
SplashScreen.preventAutoHideAsync();

import AppNavigator from './navigation/AppNavigator';
import { Colors } from './theme';

/**
 * Load custom fonts and any other async resources.
 */
async function loadResourcesAsync() {
  try {
    // Load custom fonts (add your font files to assets/fonts/)
    await Font.loadAsync({
      'Inter-Regular': require('./assets/fonts/Inter-Regular.ttf'),
      'Inter-Medium': require('./assets/fonts/Inter-Medium.ttf'),
      'Inter-SemiBold': require('./assets/fonts/Inter-SemiBold.ttf'),
      'Inter-Bold': require('./assets/fonts/Inter-Bold.ttf'),
      'JetBrainsMono-Regular': require('./assets/fonts/JetBrainsMono-Regular.ttf'),
    });
  } catch (e) {
    console.warn('[App] Some fonts failed to load, using system defaults:', e.message);
  }
}

/**
 * Main App Component
 *
 * Provider hierarchy:
 * 1. GestureHandlerRootView — React Native Gesture Handler
 * 2. SafeAreaProvider — Safe area insets for notched devices
 * 3. AppNavigator — React Navigation with dark theme
 */
export default function App() {
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await loadResourcesAsync();
      } catch (e) {
        console.warn('[App] Resource loading error:', e);
      } finally {
        setIsAppReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (isAppReady) {
      await SplashScreen.hideAsync();
    }
  }, [isAppReady]);

  if (!isAppReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.neon.cyan} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor="transparent" translucent />
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// Register main entry point
AppRegistry.registerComponent('LiveStreamPremium', () => App);
