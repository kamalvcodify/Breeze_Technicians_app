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

import ReportsScreen from '../screens/ReportsScreen';
import ReportListScreen from '../screens/ReportListScreen';
import ReportDetailScreen from '../screens/ReportDetailScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';

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

/**
 * MainStack
 * ----------------------------------------------------------------
 * Admin's stack now registers Reports/ReportList/ReportDetail and
 * PrivacyPolicy, alongside AdminPanel - previously AdminPanel was
 * the ONLY screen registered for admins, meaning there was no way
 * to navigate anywhere else at all. TechnicianHeader.js's admin
 * branch now has nav links for Admin Panel, Reports, and Privacy
 * Policy - no Home/My Assigned Work Orders (technician-only) and
 * no Start Shift button (also technician-only).
 *
 * Reports/ReportList/ReportDetail are the EXACT SAME screen
 * components the technician stack uses (TechnicianNavigator.js) -
 * the backend's isAdmin flag (from the JWT) is what actually
 * controls whether the data returned is filtered to one technician
 * or shows everyone's records - see reportsController.js /
 * zohoReportService.js.
 * ----------------------------------------------------------------
 */
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
        <>
          <Stack.Screen
            name="AdminPanel"
            component={AdminPanelScreen}
          />

          <Stack.Screen
            name="Reports"
            component={ReportsScreen}
          />

          <Stack.Screen
            name="ReportList"
            component={ReportListScreen}
          />

          <Stack.Screen
            name="ReportDetail"
            component={ReportDetailScreen}
          />

          <Stack.Screen
            name="PrivacyPolicy"
            component={PrivacyPolicyScreen}
          />
        </>
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