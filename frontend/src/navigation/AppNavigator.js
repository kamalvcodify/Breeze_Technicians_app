import React from 'react';
import {
  ActivityIndicator,
  View,
} from 'react-native';

import {
  NavigationContainer,
} from '@react-navigation/native';

import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import AdminPanelScreen from '../screens/AdminPanelScreen';

import TechnicianNavigator from './TechnicianNavigator';

import { useAuth } from '../context/AuthContext';

import { colors } from '../theme/colors';
import styles from '../styles/appNavigatorStyles';

const Stack = createNativeStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
      />

      <Stack.Screen
        name="Signup"
        component={SignupScreen}
      />

      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
      />
    </Stack.Navigator>
  );
}

function MainStack({ isAdmin }) {
  return (
    <Stack.Navigator
      initialRouteName={
        isAdmin
          ? 'AdminPanel'
          : 'TechnicianApp'
      }
      screenOptions={{
        headerShown: false,
      }}
    >
      {isAdmin ? (
        <Stack.Screen
          name="AdminPanel"
          component={AdminPanelScreen}
        />
      ) : (
        <Stack.Screen
          name="TechnicianApp"
          component={TechnicianNavigator}
        />
      )}
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const {
    token,
    isAdmin,
    initializing,
  } = useAuth();

  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={colors.blue}
        />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {token ? (
        <MainStack isAdmin={isAdmin} />
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
}