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
import MoveOutFormSection from '../components/MoveOutFormSection';

import usePropertyUnitLookups from '../hooks/usePropertyUnitLookups';

import { submitMoveOut } from '../api/moveOut';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

import styles from '../styles/ProcessMoveOutScreen.styles';

/**
 * screens/ProcessMoveOutScreen.js
 * ----------------------------------------------------------------
 * Same header-bar / content-wrapper pattern as the other three
 * forms, single-entry.
 *
 * Photo/attachments are deliberately EXCLUDED from the payload sent
 * to the backend, per instructions - same treatment as the other
 * forms' not-yet-wired attachment/QR/Unit fields.
 * ----------------------------------------------------------------
 */
function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function createEmptyEntry(technicianName = '', email = '') {
  return {
    technicianName,
    property: '',
    email,
    notes: '',
    finalStatus: '',
    unit: '',
    dateOfInspection: getToday(),
    attachments: [],
  };
}

function validateEntry(entry) {
  const errors = {};

  if (!entry.technicianName.trim()) errors.technicianName = 'Technician name is required.';
  if (!entry.property) errors.property = 'Property is required.';
  if (!entry.email.trim()) errors.email = 'Email is required.';
  if (!entry.finalStatus) errors.finalStatus = 'Final Status is required.';
  if (!entry.unit) errors.unit = 'Unit is required.';
  if (!entry.dateOfInspection) errors.dateOfInspection = 'Date of Inspection is required.';

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

  return 'The move-out checklist could not be submitted. Please try again.';
}

export default function ProcessMoveOutScreen({ navigation }) {
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
      // Photo/attachments are intentionally NOT included here - see
      // the comment block at the top of this file.
      const { attachments, ...payload } = entry;

      const response = await submitMoveOut({
        ...payload,
        technicianName: entry.technicianName.trim(),
        email: entry.email.trim(),
        notes: entry.notes.trim(),
      });

      setPopup({
        visible: true,
        title: 'Move-out checklist submitted',
        message: response?.data?.detail || 'The move-out checklist was submitted successfully.',
        success: true,
      });
    } catch (error) {
      console.error('[Process Move Out] Submission failed:', error?.response?.data || error);

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
            <Text style={styles.headerTitle}>Process a Move Out</Text>
            <Text style={styles.headerSubtitle}>Property move-out information.</Text>
          </View>

          <View style={styles.headerIconBadge}>
            <Ionicons name="exit-outline" size={18} color={colors.blue} />
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

            <MoveOutFormSection
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