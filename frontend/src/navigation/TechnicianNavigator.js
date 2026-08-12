import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "../screens/HomeScreen";
import PrivacyPolicyScreen from "../screens/PrivacyPolicyScreen";
import SubmitWorkOrderScreen from "../screens/SubmitWorkOrderScreen";
import MyAssignedWorkOrdersScreen from "../screens/MyAssignedWorkOrdersScreen";
import TechnicianShiftScreen from "../screens/TechnicianShiftScreen";

import SubmitRehabOrderScreen from "../screens/SubmitRehabOrderScreen";
import CheckInCheckOutScreen from "../screens/CheckInCheckOutScreen";

import ProcessMoveOutScreen from '../screens/ProcessMoveOutScreen';
import RentReadyChecklistScreen from '../screens/RentReadyChecklistScreen';

import ReportsScreen from '../screens/ReportsScreen';
import ReportListScreen from '../screens/ReportListScreen';
import ReportDetailScreen from '../screens/ReportDetailScreen';

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
        animation: "fade",
      }}
    >
      <Stack.Screen name="TechnicianHome" component={HomeScreen} />
      <Stack.Screen name="SubmitWorkOrder" component={SubmitWorkOrderScreen} />
      <Stack.Screen name="SubmitRehabOrder" component={SubmitRehabOrderScreen}/>
      <Stack.Screen name="CheckInCheckOut" component={CheckInCheckOutScreen} />
      <Stack.Screen name="ProcessMoveOut" component={ProcessMoveOutScreen} />
      <Stack.Screen name="MyAssignedWorkOrders" component={MyAssignedWorkOrdersScreen}/>
      <Stack.Screen name="TechnicianShift" component={TechnicianShiftScreen} />
      <Stack.Screen name="RentReadyChecklist" component={RentReadyChecklistScreen} />
      
      <Stack.Screen name="Reports" component={ReportsScreen} />
      <Stack.Screen name="ReportList" component={ReportListScreen} />
      <Stack.Screen name="ReportDetail" component={ReportDetailScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />

    </Stack.Navigator>
  );
}
