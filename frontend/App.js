import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Registers the background location task (TaskManager.defineTask).
// Must be imported here, at the top level, before anything else -
// the OS can invoke this task even when no screen is mounted, so it
// needs to be registered as early in the app's lifecycle as
// possible. See tasks/backgroundLocationTask.js for details.
import './src/tasks/backgroundLocationTask';

import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    // SafeAreaProvider makes real device safe-area insets (notch,
    // status bar, Dynamic Island, home indicator) available to every
    // screen via useSafeAreaInsets. Without this, the app header was
    // drawing under the phone's status bar/notch on real devices.
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
