import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AssignedWorkOrderCard from '../components/AssignedWorkOrderCard';
import TechnicianLayout from '../components/TechnicianLayout';

import { getMyAssignedWorkOrders } from '../api/trackingApi';
import { colors } from '../theme/colors';

import styles from '../styles/myAssignedWorkOrdersStyles';

/**
 * screens/MyAssignedWorkOrdersScreen.js
 * ----------------------------------------------------------------
 * The title/count used to be rendered as the FlatList's
 * ListHeaderComponent, sized much larger than anything on Home
 * (xl-size title, two-line subtitle, separate count line below) —
 * that's what made it look oversized. It's now a compact header
 * bar OUTSIDE the scrolling list, built the same way as Home's
 * greeting bar (light surface, border-bottom, one small title line
 * + one small subtitle line, small icon badge on the right). The
 * FlatList itself now only contains the cards.
 * ----------------------------------------------------------------
 */
const MyAssignedWorkOrdersScreen = ({ navigation }) => {
  const [workOrders, setWorkOrders] = useState([]);
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadWorkOrders = useCallback(async ({ showLoading = true } = {}) => {
    if (showLoading) {
      setLoading(true);
    }

    setErrorMessage('');

    const result = await getMyAssignedWorkOrders();

    if (result.success) {
      setWorkOrders(result.data);
    } else {
      setWorkOrders([]);
      setErrorMessage(result.message);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadWorkOrders();
  }, [loadWorkOrders]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadWorkOrders({ showLoading: false });
  }, [loadWorkOrders]);

  const handleSelectWorkOrder = useCallback(
    (workOrder) => {
      if (!workOrder?.id) {
        return;
      }

      setSelectedWorkOrderId(String(workOrder.id));

      if (navigation?.navigate) {
        navigation.navigate('TechnicianShift', { workOrder });
      }
    },
    [navigation]
  );

  const renderWorkOrder = useCallback(
    ({ item }) => (
      <AssignedWorkOrderCard
        workOrder={item}
        isSelected={String(item.id) === String(selectedWorkOrderId)}
        onSelect={handleSelectWorkOrder}
      />
    ),
    [handleSelectWorkOrder, selectedWorkOrderId]
  );

  const renderEmptyComponent = useCallback(() => {
    if (loading) {
      return null;
    }

    if (errorMessage) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.errorTitle}>Unable to load Work Orders</Text>
          <Text style={styles.emptyMessage}>{errorMessage}</Text>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadWorkOrders()}
            activeOpacity={0.8}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No assigned Work Orders</Text>
        <Text style={styles.emptyMessage}>
          You currently do not have any Work Orders assigned to your account.
        </Text>
      </View>
    );
  }, [errorMessage, loadWorkOrders, loading]);

  const countLabel = `${workOrders.length} ${workOrders.length === 1 ? 'Work Order' : 'Work Orders'} assigned to you`;

  const headerBar = (
    <View style={styles.headerBar}>
      <View style={styles.headerBarInner}>
        <View style={styles.headerTextGroup}>
          <Text style={styles.headerTitle}>My Assigned Work Orders</Text>
          <Text style={styles.headerSubtitle}>{loading ? 'Loading…' : countLabel}</Text>
        </View>

        <View style={styles.headerIconBadge}>
          <Ionicons name="briefcase-outline" size={18} color={colors.blue} />
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <TechnicianLayout navigation={navigation} activeRoute="MyAssignedWorkOrders">
        {headerBar}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.blue} />
          <Text style={styles.loadingText}>Loading assigned Work Orders...</Text>
        </View>
      </TechnicianLayout>
    );
  }

  return (
    <TechnicianLayout navigation={navigation} activeRoute="MyAssignedWorkOrders">
      {headerBar}

      <FlatList
        data={workOrders}
        renderItem={renderWorkOrder}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={[
          styles.listContent,
          workOrders.length === 0 && styles.emptyListContent,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.blue]}
            tintColor={colors.blue}
          />
        }
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews={false}
      />
    </TechnicianLayout>
  );
};

export default MyAssignedWorkOrdersScreen;