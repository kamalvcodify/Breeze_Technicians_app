import React, { useState } from 'react';

import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from 'react-native';
import { Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AppButton from '../components/AppButton';
import AppPopup from '../components/AppPopup';
import TechnicianLayout from '../components/TechnicianLayout';
import CheckInCheckOutFormSection from '../components/CheckInCheckOutFormSection';

import usePropertyUnitLookups from '../hooks/usePropertyUnitLookups';

import { submitCheckInOut } from '../api/checkInOut';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

import styles from '../styles/CheckInCheckOutScreen.styles';

/**
 * screens/CheckInCheckOutScreen.js
 * ----------------------------------------------------------------
 * Same header-bar / content-wrapper pattern as Submit Work Order
 * and Submit Rehab Order, single-entry (no multi-add).
 *
 * IMPORTANT: no Zoho/CRM sync at all yet. submitCheckInOut() posts
 * to a backend route that only console.logs the payload and
 * responds with success - see api/checkInOut.js and the backend
 * files. Rehab Unit is collected in the UI but deliberately left
 * OUT of the submitted payload below, per instructions, since that
 * field's Zoho mapping isn't settled yet (same situation as Rehab
 * Order's Unit field bug).
 * ----------------------------------------------------------------
 */
function createEmptyEntry(technicianName = '', email = '') {
  return {
    qrScanValue: '',
    partCode: '',
    partsInventory: '',
    action: '',
    quantityDesired: '',
    quantityReturned: '',
    city: 'Youngstown',
    jobType: '',
    technicianName,
    property: '',
    workOrder: '',
    rehabUnit: '',
    dateTime: new Date().toISOString(),
    notes: '',
    email,
  };
}

function validateEntry(entry) {
  const errors = {};

  if (!entry.action) errors.action = 'Action is required.';
  if (entry.action === 'Check-out' && !entry.quantityDesired) {
    errors.quantityDesired = 'Quantity Desired is required.';
  }
  if (entry.action === 'Check-in' && !entry.quantityReturned) {
    errors.quantityReturned = 'Quantity Returned is required.';
  }
  if (!entry.city) errors.city = 'City is required.';
  if (!entry.jobType) errors.jobType = 'Job type is required.';
  if (!entry.technicianName.trim()) errors.technicianName = 'Technician name is required.';
  if (!entry.property) errors.property = 'Property is required.';
  if (!entry.dateTime) errors.dateTime = 'Date/Time is required.';
  if (!entry.email.trim()) errors.email = 'Email is required.';

  return errors;
}

function buildErrorMessage(error) {
  const responseData = error?.response?.data;

  if (Array.isArray(responseData?.errors) && responseData.errors.length > 0) {
    return responseData.errors.join('\n');
  }

  if (responseData?.detail) {
    return responseData.detail;
  }

  if (error?.message) {
    return error.message;
  }

  return 'The check-in/check-out entry could not be submitted. Please try again.';
}

export default function CheckInCheckOutScreen({ navigation }) {
  const { email } = useAuth();

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

  const [entry, setEntry] = useState(createEmptyEntry(email || '', email || ''));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [popup, setPopup] = useState({
    visible: false,
    title: '',
    message: '',
    success: false,
  });

  const handlePropertySelected = async (propertyId) => {
    if (!propertyId) {
      return;
    }

    await loadUnits(propertyId);
  };

  const resetForm = () => {
    setEntry(createEmptyEntry(email || '', email || ''));
    setErrors({});
  };

  const handleSubmit = async () => {
    const validationErrors = validateEntry(entry);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
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
      // Rehab Unit is intentionally NOT included here - see the
      // comment block at the top of this file.
      const { rehabUnit, ...payload } = entry;

      const response = await submitCheckInOut({
        ...payload,
        technicianName: entry.technicianName.trim(),
        email: entry.email.trim(),
      });

      setPopup({
        visible: true,
        title: 'Submitted',
        message: response?.data?.detail || 'The entry was submitted successfully.',
        success: true,
      });
    } catch (error) {
      console.error('[Check In/Out] Submission failed:', error?.response?.data || error);

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
            <Text style={styles.headerTitle}>Check In / Check Out</Text>
            <Text style={styles.headerSubtitle}>Attendance and job-site activity.</Text>
          </View>

          <View style={styles.headerIconBadge}>
            <Ionicons name="time-outline" size={18} color={colors.blue} />
          </View>
        </View>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            {!!propertyError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{propertyError}</Text>
              </View>
            )}

            <CheckInCheckOutFormSection
              entry={entry}
              errors={errors}
              onChange={setEntry}
              propertyOptions={properties}
              loadingProperties={loadingProperties}
              onPropertySearch={searchRemoteProperties}
              rehabUnitOptions={getUnitsForProperty(entry.property)}
              loadingRehabUnits={isLoadingUnits(entry.property)}
              onRehabUnitSearch={(propertyId, query) => searchRemoteUnits(propertyId, query)}
              onPropertySelected={handlePropertySelected}
            />

            <View style={styles.actions}>
              <AppButton title="Submit" onPress={handleSubmit} loading={submitting} />
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