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
import TicketFormSection from '../components/TicketFormSection';

import usePropertyUnitLookups from '../hooks/usePropertyUnitLookups';

import { submitWorkOrder } from '../api/workOrders';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

import styles from '../styles/SubmitWorkOrderScreen.styles';

/**
 * screens/SubmitWorkOrderScreen.js
 * ----------------------------------------------------------------
 * Opened from the "Submit Work Order" card on the Home dashboard.
 * Reachable via the header's back button (navigation.canGoBack())
 * since it's not the root of the Technician stack.
 * ----------------------------------------------------------------
 */

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function createTicket(technicianName = '') {
  return {
    localId: `${Date.now()}-${Math.random()}`,
    ticketId: '',
    city: 'Youngstown',
    technicianName,
    property: '',
    unit: '',
    status: '',
    clockIn: '',
    clockOut: '',
    jobType: 'Maintenance',
    date: getToday(),
    workDetails: '',
    attachments: [],
  };
}

function validateTicket(ticket) {
  const errors = {};

  if (!ticket.ticketId.trim()) errors.ticketId = 'Ticket ID is required.';
  if (!ticket.city) errors.city = 'City is required.';
  if (!ticket.technicianName.trim()) errors.technicianName = 'Technician name is required.';
  if (!ticket.property) errors.property = 'Property is required.';
  if (!ticket.unit) errors.unit = 'Unit is required.';
  if (!ticket.status) errors.status = 'Status is required.';
  if (!ticket.jobType) errors.jobType = 'Job type is required.';
  if (!ticket.date) errors.date = 'Date is required.';
  if (!ticket.workDetails.trim()) errors.workDetails = 'Work details are required.';

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

  return 'The work order could not be submitted. Please try again.';
}

export default function SubmitWorkOrderScreen({ navigation }) {
  const { email } = useAuth();

  /*
   * Shared CRM Property and Unit lookup logic.
   *
   * Properties load when this screen opens.
   * Units load after a Property is selected.
   */
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

  const [tickets, setTickets] = useState([createTicket(email || '')]);
  const [ticketErrors, setTicketErrors] = useState([{}]);
  const [submitting, setSubmitting] = useState(false);
  const [popup, setPopup] = useState({
    visible: false,
    title: '',
    message: '',
    success: false,
  });

  const updateTicket = (ticketIndex, updatedTicket) => {
    setTickets((currentTickets) =>
      currentTickets.map((ticket, index) => (index === ticketIndex ? updatedTicket : ticket))
    );

    setTicketErrors((currentErrors) =>
      currentErrors.map((errors, index) => (index === ticketIndex ? {} : errors))
    );
  };

  const addTicket = () => {
    if (tickets.length >= 3) {
      return;
    }

    setTickets((currentTickets) => [...currentTickets, createTicket(email || '')]);
    setTicketErrors((currentErrors) => [...currentErrors, {}]);
  };

  const removeTicket = (ticketIndex) => {
    setTickets((currentTickets) => currentTickets.filter((_, index) => index !== ticketIndex));
    setTicketErrors((currentErrors) => currentErrors.filter((_, index) => index !== ticketIndex));
  };

  const resetForm = () => {
    setTickets([createTicket(email || '')]);
    setTicketErrors([{}]);
  };

  /*
   * Called when a Property is selected.
   *
   * TicketFormSection already clears the old Unit value.
   * This method loads the Units connected to the new Property.
   */
  const handlePropertySelected = async (propertyId) => {
    if (!propertyId) {
      return;
    }

    await loadUnits(propertyId);
  };

  const handleSubmit = async () => {
    const validationResults = tickets.map(validateTicket);
    setTicketErrors(validationResults);

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
      const payload = tickets.map(({ localId, ...ticket }) => ({
        ...ticket,
        ticketId: ticket.ticketId.trim(),
        technicianName: ticket.technicianName.trim(),
        workDetails: ticket.workDetails.trim(),
      }));

      const response = await submitWorkOrder(payload);

      /*
       * The backend should normally return an HTTP error
       * when Zoho rejects the record.
       *
       * This additional check prevents a false success
       * message if the backend accidentally returns HTTP 200/201
       * with a failed Zoho response.
       */
      if (response?.data?.zoho && Number(response.data.zoho.code) !== 3000) {
        const zohoError = new Error('Zoho Creator rejected the Work Order.');

        zohoError.response = {
          data: {
            detail: 'Zoho Creator rejected the Work Order.',
            zoho: response.data.zoho,
          },
        };

        throw zohoError;
      }

      setPopup({
        visible: true,
        title: 'Work order submitted',
        message: response.data.detail || 'The work order was submitted successfully.',
        success: true,
      });
    } catch (error) {
      console.error('[Work Order] Submission failed:', error?.response?.data || error);

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
            <Text style={styles.headerTitle}>Submit Work Order</Text>
            <Text style={styles.headerSubtitle}>
              Complete the required information for each ticket.
            </Text>
          </View>

          <View style={styles.headerIconBadge}>
            <Ionicons name="clipboard-outline" size={18} color={colors.blue} />
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

            {tickets.map((ticket, index) => (
              <TicketFormSection
                key={ticket.localId}
                ticket={ticket}
                ticketNumber={index + 1}
                errors={ticketErrors[index]}
                canRemove={index > 0}
                onChange={(updatedTicket) => updateTicket(index, updatedTicket)}
                onRemove={() => removeTicket(index)}
                /*
                 * CRM Property options.
                 */
                propertyOptions={properties}
                loadingProperties={loadingProperties}
                onPropertySearch={searchRemoteProperties}
                /*
                 * Units associated with the selected Property.
                 */
                unitOptions={getUnitsForProperty(ticket.property)}
                loadingUnits={isLoadingUnits(ticket.property)}
                onUnitSearch={(propertyId, query) => searchRemoteUnits(propertyId, query)}
                onPropertySelected={handlePropertySelected}
              />
            ))}

            {tickets.length < 3 && (
              <TouchableOpacity style={styles.addButton} onPress={addTicket}>
                <Text style={styles.addButtonText}>＋ Add Ticket {tickets.length + 1}</Text>
              </TouchableOpacity>
            )}

            <View style={styles.actions}>
              <AppButton
                title={tickets.length === 1 ? 'Submit Work Order' : `Submit ${tickets.length} Tickets`}
                onPress={handleSubmit}
                loading={submitting}
              />

              <AppButton
                title="Reset"
                variant="outline"
                onPress={resetForm}
                disabled={submitting}
              />
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

            setPopup((currentPopup) => ({ ...currentPopup, visible: false }));

            if (wasSuccessful) {
              resetForm();
            }
          }}
          onClose={() => setPopup((currentPopup) => ({ ...currentPopup, visible: false }))}
        />
      </KeyboardAvoidingView>
    </TechnicianLayout>
  );
}