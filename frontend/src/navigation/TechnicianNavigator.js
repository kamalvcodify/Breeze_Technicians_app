import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import SubmitWorkOrderScreen from '../screens/SubmitWorkOrderScreen';
import MyAssignedWorkOrdersScreen from '../screens/MyAssignedWorkOrdersScreen';
import TechnicianShiftScreen from '../screens/TechnicianShiftScreen';

const Stack = createNativeStackNavigator();

// "TechnicianHome" is the Services dashboard (2-up card grid).
// "SubmitWorkOrder" is opened from the "Submit Work Order" card.
// "MyAssignedWorkOrders" is its own top-level section, reached from
// the header nav (not nested under Home) — see TechnicianHeader.js.
export default function TechnicianNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="TechnicianHome"
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Stack.Screen
        name="TechnicianHome"
        component={HomeScreen}
      />

      <Stack.Screen
        name="SubmitWorkOrder"
        component={SubmitWorkOrderScreen}
      />

      <Stack.Screen
        name="MyAssignedWorkOrders"
        component={MyAssignedWorkOrdersScreen}
      />

      <Stack.Screen
        name="TechnicianShift"
        component={TechnicianShiftScreen}
      />

      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
      />
    </Stack.Navigator>
  );
}