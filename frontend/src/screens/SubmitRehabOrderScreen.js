import React, { useState } from 'react';

import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AppButton from '../components/AppButton';
import AppPopup from '../components/AppPopup';
import TechnicianLayout from '../components/TechnicianLayout';
import RehabFormSection from '../components/RehabFormSection';

import usePropertyUnitLookups from '../hooks/usePropertyUnitLookups';

import { submitRehabOrder } from '../api/rehabOrders';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

import styles from '../styles/SubmitRehabOrderScreen.styles';

import { submitWithOfflineFallback } from '../utils/submitWithOfflineFallback';

/**
 * screens/SubmitRehabOrderScreen.js
 * ----------------------------------------------------------------
 * Multi-entry, same pattern as SubmitWorkOrderScreen.js: up to 3
 * rehab entries, added via a dashed "+ Add Rehab2" / "+ Add Rehab3"
 * button (mirroring Work Order's "+ Add Ticket 2" / "+ Add Ticket
 * 3"). What looked like two checkboxes labeled "Rehab2"/"Rehab3" in
 * the screenshot was actually this add-another-entry pattern, not
 * real checkboxes - RehabFormSection's heading already reads
 * "Rehab2"/"Rehab3" for entries 2 and 3.
 *
 * BACKEND NOTE: submitRehabOrder() in api/rehabOrders.js points at
 * an endpoint that doesn't exist yet - expected to 404 until the
 * backend route/controller/Zoho service for Rehab Orders is built.
 * ----------------------------------------------------------------
 */
const MAX_ENTRIES = 3;

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function createEmptyOrder(technicianName = '', city = '') {
  return {
    localId: `${Date.now()}-${Math.random()}`,
    property: '',
    unit: '',
    unitName: '',
    technicianName,
    status: '',
    description: '',
    rentReady: '',
    city: city || 'Youngstown',
    clockIn: '',
    clockOut: '',
    date: getToday(),
    jobType: 'Rehab',
    attachments: [],
  };
}

function validateOrder(order) {
  const errors = {};

  if (!order.property) errors.property = 'Property is required.';
  if (!order.unit) errors.unit = 'Unit is required.';
  if (!order.technicianName.trim()) errors.technicianName = 'Technician name is required.';
  if (!order.status) errors.status = 'Status is required.';
  if (!order.description.trim()) errors.description = 'Description is required.';
  if (!order.rentReady) errors.rentReady = 'Rent Ready selection is required.';
  if (!order.city.trim()) errors.city = 'City is required.';
  if (!order.date) errors.date = 'Date is required.';
  if (!order.jobType) errors.jobType = 'Job type is required.';

  return errors;
}

function buildErrorMessage(error) {
  const responseData = error?.response?.data;

  if (Array.isArray(responseData?.errors) && responseData.errors.length > 0) {
    return responseData.errors.join('\n');
  }

  if (Array.isArray(responseData?.zoho?.error) && responseData.zoho.error.length > 0) {
    return responseData.zoho.error.join('\n');
  }

  if (responseData?.detail) {
    return responseData.detail;
  }

  if (error?.message) {
    return error.message;
  }

  return 'The rehab order could not be submitted. Please try again.';
}

export default function SubmitRehabOrderScreen({ navigation }) {
  const { email, name, city } = useAuth();

  const {
    properties,
    loadingProperties,
    propertyError,

    loadProperties,
    searchRemoteProperties,

    loadUnits,
    getUnitsForProperty,
    searchRemoteUnits,
    isLoadingUnits,
  } = usePropertyUnitLookups();

  const [orders, setOrders] = useState([createEmptyOrder(name || '', city || '')]);
  const [orderErrors, setOrderErrors] = useState([{}]);
  const [submitting, setSubmitting] = useState(false);
  const [popup, setPopup] = useState({
    visible: false,
    title: '',
    message: '',
    success: false,
  });

  const updateOrder = (orderIndex, updatedOrder) => {
    setOrders((currentOrders) =>
      currentOrders.map((order, index) => (index === orderIndex ? updatedOrder : order))
    );

    setOrderErrors((currentErrors) =>
      currentErrors.map((errors, index) => (index === orderIndex ? {} : errors))
    );
  };

  const addOrder = () => {
    if (orders.length >= MAX_ENTRIES) {
      return;
    }

    setOrders((currentOrders) => [...currentOrders, createEmptyOrder(name || '', city || '')]);
    setOrderErrors((currentErrors) => [...currentErrors, {}]);
  };

  const removeOrder = (orderIndex) => {
    setOrders((currentOrders) => currentOrders.filter((_, index) => index !== orderIndex));
    setOrderErrors((currentErrors) => currentErrors.filter((_, index) => index !== orderIndex));
  };

  const resetForm = () => {
    setOrders([createEmptyOrder(name || '', city || '')]);
    setOrderErrors([{}]);
  };

  const handlePropertySelected = async (propertyId) => {
    if (!propertyId) {
      return;
    }

    await loadUnits(propertyId);
  };

  const handleSubmit = async () => {
    const validationResults = orders.map(validateOrder);
    setOrderErrors(validationResults);

    const hasErrors = validationResults.some((errors) => Object.keys(errors).length > 0);

    if (hasErrors) {
      setPopup({
        visible: true,
        title: 'Check the form',
        message: 'Please complete all required fields.',
        success: false,
      });
      return;
    }

    setSubmitting(true);

    try {
      const payload = orders.map(({ localId, ...order }) => ({
        ...order,
        technicianName: order.technicianName.trim(),
        description: order.description.trim(),
        city: order.city.trim(),
      }));

      const result = await submitWithOfflineFallback({
        formType: 'rehabOrder',
        payload,
        submitFn: submitRehabOrder,
      });

      if (result.offline) {
        setPopup({
          visible: true,
          title: 'Saved offline',
          message:
            "No connection right now — this will sync automatically once you're back online.",
          success: true,
        });

        setSubmitting(false);
        return;
      }

      setPopup({
        visible: true,
        title: 'Rehab order submitted',
        message: result.response?.data?.detail || 'The rehab order was submitted successfully.',
        success: true,
      });
    } catch (error) {
      console.error('[Rehab Order] Submission failed:', error?.response?.data || error);

      setPopup({
        visible: true,
        title: 'Submission failed',
        message: buildErrorMessage(error),
        success: false,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <TechnicianLayout navigation={navigation} activeRoute="Home">
      <View style={styles.headerBar}>
        <View style={styles.headerBarInner}>
          <View style={styles.headerTextGroup}>
            <Text style={styles.headerTitle}>Submit a Rehab Order</Text>
            <Text style={styles.headerSubtitle}>Property rehabilitation work details.</Text>
          </View>

          <View style={styles.headerIconBadge}>
            <Ionicons name="hammer-outline" size={18} color={colors.blue} />
          </View>
        </View>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            {!!propertyError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{propertyError}</Text>

                <TouchableOpacity onPress={() => loadProperties({ forceRefresh: true })}>
                  <Text style={styles.errorBannerRetry}>Retry loading properties</Text>
                </TouchableOpacity>
              </View>
            )}

            {orders.map((order, index) => (
              <RehabFormSection
                key={order.localId}
                order={order}
                rehabNumber={index + 1}
                errors={orderErrors[index]}
                canRemove={index > 0}
                onChange={(updatedOrder) => updateOrder(index, updatedOrder)}
                onRemove={() => removeOrder(index)}
                propertyOptions={properties}
                loadingProperties={loadingProperties}
                onPropertySearch={searchRemoteProperties}
                unitOptions={getUnitsForProperty(order.property)}
                loadingUnits={isLoadingUnits(order.property)}
                onUnitSearch={(propertyId, query) => searchRemoteUnits(propertyId, query)}
                onPropertySelected={handlePropertySelected}
              />
            ))}

            {orders.length < MAX_ENTRIES && (
              <TouchableOpacity style={styles.addButton} onPress={addOrder}>
                <Text style={styles.addButtonText}>＋ Add Rehab{orders.length + 1}</Text>
              </TouchableOpacity>
            )}

            <View style={styles.actions}>
              <AppButton
                title={orders.length === 1 ? 'Submit' : `Submit ${orders.length} Rehab Orders`}
                onPress={handleSubmit}
                loading={submitting}
              />

              <AppButton title="Reset" variant="outline" onPress={resetForm} disabled={submitting} />
            </View>
          </View>
        </ScrollView>

        <AppPopup
          visible={popup.visible}
          title={popup.title}
          message={popup.message}
          primaryLabel={popup.success ? 'Done' : 'Close'}
          onPrimaryPress={() => {
            const wasSuccessful = popup.success;
            setPopup((current) => ({ ...current, visible: false }));
            if (wasSuccessful) {
              resetForm();
            }
          }}
          onClose={() => setPopup((current) => ({ ...current, visible: false }))}
        />
      </KeyboardAvoidingView>
    </TechnicianLayout>
  );
}