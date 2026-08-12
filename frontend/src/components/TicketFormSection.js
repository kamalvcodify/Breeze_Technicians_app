import React from 'react';

import {
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import AppInput from './AppInput';
import AppSelect from './AppSelect';
import AttachmentPicker from './AttachmentPicker';
import DateTimeField from './DateTimeField';
import SearchableSelect from './SearchableSelect';

import styles from '../styles/TicketFormSection.styles';

const CITY_OPTIONS = [
  {
    label: 'Youngstown',
    value: 'Youngstown',
  },
  {
    label: 'Toledo',
    value: 'Toledo',
  },
  {
    label: 'Lima',
    value: 'Lima',
  },
];

const JOB_TYPE_OPTIONS = [
  {
    label: 'Maintenance',
    value: 'Maintenance',
  },
  {
    label: 'Inspection',
    value: 'Inspection',
  },
  {
    label: 'Rehab',
    value: 'Rehab',
  },
  {
    label: 'Store Run',
    value: 'Store Run',
  },
    {
    label: 'Section 8',
    value: 'Section 8',
  },
  {
    label: 'Other',
    value: 'Other',
  }
];

const STATUS_OPTIONS = [
  {
    label: 'Follow up needed',
    value: 'Follow up needed',
  },
  {
    label: 'Working on it',
    value: 'Working on it',
  },
  {
    label: 'Closed - Ticket Resolved',
    value: 'Completed',
  },
  {
    label: 'On Hold',
    value: 'On Hold',
  },
];

/**
 * components/TicketFormSection.js
 * ----------------------------------------------------------------
 * Field layout for one Work Order ticket. This screen/component is
 * the reference pattern for other order-submission forms in the
 * app (e.g. Rehab Order) - it should not be changed to match those
 * other forms; they should be changed to match this one.
 * ----------------------------------------------------------------
 */
export default function TicketFormSection({
  ticket,
  ticketNumber,
  errors,
  canRemove,
  onChange,
  onRemove,

  propertyOptions,
  unitOptions,

  loadingProperties,
  loadingUnits,

  onPropertySearch,
  onUnitSearch,
  onPropertySelected,
}) {
  const updateField = (
    field,
    value
  ) => {
    onChange({
      ...ticket,
      [field]: value,
    });
  };

  const handlePropertyChange = (
    propertyId
  ) => {
    /*
     * Clear the existing Unit because
     * it may belong to the previously
     * selected Property.
     */
    onChange({
      ...ticket,
      property: propertyId,
      unit: '',
    });

    onPropertySelected(
      propertyId
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.headingRow}>
        <View>
          <Text style={styles.kicker}>
            WORK ORDER
          </Text>

          <Text style={styles.heading}>
            {ticketNumber === 1
              ? 'First Ticket'
              : `Ticket ${ticketNumber}`}
          </Text>
        </View>

        {canRemove && (
          <TouchableOpacity
            onPress={onRemove}
          >
            <Text
              style={styles.removeText}
            >
              Remove
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.fields}>
        <View style={styles.column}>
          <AppInput
            label="Ticket ID"
            value={ticket.ticketId}
            onChangeText={(value) =>
              updateField(
                'ticketId',
                value
              )
            }
            placeholder="Enter Ticket ID"
            error={errors?.ticketId}
          />

          <AppSelect
            label="City"
            value={ticket.city}
            options={CITY_OPTIONS}
            onChange={(value) =>
              updateField(
                'city',
                value
              )
            }
            error={errors?.city}
          />

          <AppInput
            label="Technician Name"
            value={
              ticket.technicianName
            }
            onChangeText={(value) =>
              updateField(
                'technicianName',
                value
              )
            }
            placeholder="Technician name"
            error={
              errors?.technicianName
            }
          />

          <SearchableSelect
            label="Property"
            value={ticket.property}
            options={
              propertyOptions
            }
            placeholder={
              loadingProperties
                ? 'Loading properties…'
                : 'Select property'
            }
            searchPlaceholder="Search by property name or address"
            loading={
              loadingProperties
            }
            error={errors?.property}
            emptyMessage="No properties found."
            onChange={
              handlePropertyChange
            }
            onRemoteSearch={
              onPropertySearch
            }
          />

          <SearchableSelect
            label="Unit"
            value={ticket.unit}
            options={unitOptions}
            placeholder={
              !ticket.property
                ? 'Select a property first'
                : loadingUnits
                  ? 'Loading units…'
                  : 'Select unit'
            }
            searchPlaceholder="Search units"
            loading={loadingUnits}
            disabled={
              !ticket.property
            }
            error={errors?.unit}
            emptyMessage={
              ticket.property
                ? 'No units found for this property.'
                : 'Select a property first.'
            }
            onChange={(value) =>
              updateField(
                'unit',
                value
              )
            }
            onRemoteSearch={(
              query
            ) =>
              onUnitSearch(
                ticket.property,
                query
              )
            }
          />

          <AppSelect
            label="Status"
            value={ticket.status}
            options={STATUS_OPTIONS}
            onChange={(value) =>
              updateField(
                'status',
                value
              )
            }
            error={errors?.status}
          />
        </View>

        <View style={styles.column}>
          <DateTimeField
            label="Clock In"
            mode="time"
            value={ticket.clockIn}
            onChange={(value) =>
              updateField(
                'clockIn',
                value
              )
            }
          />

          <DateTimeField
            label="Clock Out"
            mode="time"
            value={ticket.clockOut}
            onChange={(value) =>
              updateField(
                'clockOut',
                value
              )
            }
          />

          <AppSelect
            label="Job Type"
            value={ticket.jobType}
            options={
              JOB_TYPE_OPTIONS
            }
            onChange={(value) =>
              updateField(
                'jobType',
                value
              )
            }
            error={errors?.jobType}
          />

          <DateTimeField
            label="Date"
            mode="date"
            value={ticket.date}
            onChange={(value) =>
              updateField(
                'date',
                value
              )
            }
            error={errors?.date}
          />

          <AppInput
            label="Work Details"
            value={ticket.workDetails}
            onChangeText={(value) =>
              updateField(
                'workDetails',
                value
              )
            }
            placeholder="Describe the work completed"
            multiline
            numberOfLines={5}
            autoCapitalize="sentences"
            error={
              errors?.workDetails
            }
          />
        </View>
      </View>

      <AttachmentPicker
        attachments={
          ticket.attachments || []
        }
        onChange={(
          attachments
        ) =>
          updateField(
            'attachments',
            attachments
          )
        }
      />
    </View>
  );
}