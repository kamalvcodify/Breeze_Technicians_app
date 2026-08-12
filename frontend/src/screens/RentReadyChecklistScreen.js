import React, { useState } from 'react';

import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AppButton from '../components/AppButton';
import AppPopup from '../components/AppPopup';
import TechnicianLayout from '../components/TechnicianLayout';
import RentReadyChecklistFormSection, {
  CHECKLIST_SECTIONS,
} from '../components/RentReadyChecklistFormSection';

import usePropertyUnitLookups from '../hooks/usePropertyUnitLookups';

import { submitRentReadyChecklist } from '../api/rentReadyChecklist';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

import styles from '../styles/RentReadyChecklistScreen.styles';

/**
 * screens/RentReadyChecklistScreen.js
 * ----------------------------------------------------------------
 * Same header-bar / content-wrapper pattern as the other forms,
 * single-entry. Checklist items default to unchecked (false) and
 * are not required to be checked to submit - only the top fields
 * are validated.
 * ----------------------------------------------------------------
 */
function buildEmptyChecklist() {
  const checklist = {};

  CHECKLIST_SECTIONS.forEach((section) => {
    section.items.forEach((item) => {
      checklist[item.key] = false;
    });
  });

  return checklist;
}

function createEmptyEntry(technicianName = '', email = '') {
  return {
    property: '',
    unit: '',
    technicianName,
    rentReady: '',
    dateTime: new Date().toISOString(),
    notes: '',
    email,
    checklist: buildEmptyChecklist(),
  };
}

function validateEntry(entry) {
  const errors = {};

  if (!entry.property) errors.property = 'Property is required.';
  if (!entry.unit) errors.unit = 'Unit is required.';
  if (!entry.technicianName.trim()) errors.technicianName = 'Technician name is required.';
  if (!entry.rentReady) errors.rentReady = 'Rent Ready selection is required.';
  if (!entry.dateTime) errors.dateTime = 'Date/Time is required.';
  if (!entry.email.trim()) errors.email = 'Email is required.';

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

  return 'The Rent Ready Checklist could not be submitted. Please try again.';
}

export default function RentReadyChecklistScreen({ navigation }) {
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
      const payload = {
        ...entry,
        technicianName: entry.technicianName.trim(),
        email: entry.email.trim(),
        notes: entry.notes.trim(),
      };

      const response = await submitRentReadyChecklist(payload);

      setPopup({
        visible: true,
        title: 'Checklist submitted',
        message: response?.data?.detail || 'The Rent Ready Checklist was submitted successfully.',
        success: true,
      });
    } catch (error) {
      console.error('[Rent Ready Checklist] Submission failed:', error?.response?.data || error);

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
            <Text style={styles.headerTitle}>Rent Ready Checklist</Text>
            <Text style={styles.headerSubtitle}>Confirm the unit is ready to rent.</Text>
          </View>

          <View style={styles.headerIconBadge}>
            <Ionicons name="checkmark-done-outline" size={18} color={colors.blue} />
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

            <RentReadyChecklistFormSection
              entry={entry}
              errors={errors}
              onChange={setEntry}
              propertyOptions={properties}
              loadingProperties={loadingProperties}
              onPropertySearch={searchRemoteProperties}
              unitOptions={getUnitsForProperty(entry.property)}
              loadingUnits={isLoadingUnits(entry.property)}
              onUnitSearch={(propertyId, query) => searchRemoteUnits(propertyId, query)}
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