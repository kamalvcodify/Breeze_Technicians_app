import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import AppInput from './AppInput';
import AppSelect from './AppSelect';
import AttachmentPicker from './AttachmentPicker';
import DateTimeField from './DateTimeField';
import SearchableSelect from './SearchableSelect';

import { CITY_OPTIONS } from '../constants/cityOptions';

import styles from '../styles/RehabFormSection.styles';

/**
 * components/RehabFormSection.js
 * ----------------------------------------------------------------
 * Field layout for one Rehab Order entry - sibling to
 * TicketFormSection.js (Work Order). TicketFormSection.js is the
 * reference: field order, labels, and component choices here are
 * matched to it wherever the same concept exists on both forms
 * ("Technician Name", "Clock In"/"Clock Out", City dropdown, etc),
 * rather than the other way around.
 *
 * City now imports the shared CITY_OPTIONS from
 * constants/cityOptions.js (same list every form uses) instead of
 * defining its own local copy.
 *
 * ASSUMPTIONS still open (screenshot-only, no real Zoho picklist
 * values yet) - replace once available:
 * - RENT_READY_OPTIONS: assumed Yes/No.
 * ----------------------------------------------------------------
 */

const STATUS_OPTIONS = [
  {
    label: 'Parts needed',
    value: 'Parts needed',
  },
  {
    label: 'Working on it',
    value: 'Working on it',
  },
  {
    label: 'Completed',
    value: 'Completed',
  },
  {
    label: 'Rented',
    value: 'Rented',
  },
];

const RENT_READY_OPTIONS = [
  { label: 'Yes', value: 'Yes' },
  { label: 'No', value: 'No' },
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

export default function RehabFormSection({
  order,
  rehabNumber,
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
  const updateField = (field, value) => {
    onChange({ ...order, [field]: value });
  };

  const handlePropertyChange = (propertyId) => {
    // Clear the existing Unit because it may belong to the
    // previously selected Property - same pattern as Work Order.
    onChange({ ...order, property: propertyId, unit: '', unitName: '' });
    onPropertySelected(propertyId);
  };

  const handleUnitChange = (unitId) => {
    // Zoho's UnitNew field expects the Unit's display NAME, not its
    // lookup ID (confirmed by testing - Property is a real Lookup
    // field and accepts the ID fine, but UnitNew rejected the ID
    // with "Invalid column value"). unitOptions already carries the
    // label for whichever unit was selected, so capture it here
    // alongside the ID.
    const selectedUnit = unitOptions.find((option) => option.value === unitId);

    onChange({
      ...order,
      unit: unitId,
      unitName: selectedUnit?.label || '',
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.headingRow}>
        <View>
          <Text style={styles.kicker}>REHAB ORDER</Text>
          <Text style={styles.heading}>
            {rehabNumber === 1 ? 'Rehab Order' : `Rehab${rehabNumber}`}
          </Text>
        </View>

        {canRemove && (
          <TouchableOpacity onPress={onRemove}>
            <Text style={styles.removeText}>Remove</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.fields}>
        <View style={styles.column}>
          <AppSelect
            label="Rent Ready?"
            value={order.rentReady}
            options={RENT_READY_OPTIONS}
            onChange={(value) => updateField('rentReady', value)}
            error={errors?.rentReady}
          />

          <AppSelect
            label="City"
            value={order.city}
            options={CITY_OPTIONS}
            onChange={(value) => updateField('city', value)}
            error={errors?.city}
          />

          <AppInput
            label="Technician Name"
            value={order.technicianName}
            onChangeText={(value) => updateField('technicianName', value)}
            placeholder="Technician name"
            error={errors?.technicianName}
          />

          <SearchableSelect
            label="Property"
            value={order.property}
            options={propertyOptions}
            placeholder={loadingProperties ? 'Loading properties…' : 'Select property'}
            searchPlaceholder="Search by property name or address"
            loading={loadingProperties}
            error={errors?.property}
            emptyMessage="No properties found."
            onChange={handlePropertyChange}
            onRemoteSearch={onPropertySearch}
          />

          <SearchableSelect
            label="Unit"
            value={order.unit}
            options={unitOptions}
            placeholder={
              !order.property
                ? 'Select a property first'
                : loadingUnits
                  ? 'Loading units…'
                  : 'Select unit'
            }
            searchPlaceholder="Search units"
            loading={loadingUnits}
            disabled={!order.property}
            error={errors?.unit}
            emptyMessage={
              order.property ? 'No units found for this property.' : 'Select a property first.'
            }
            onChange={handleUnitChange}
            onRemoteSearch={(query) => onUnitSearch(order.property, query)}
          />

          <AppSelect
            label="Status"
            value={order.status}
            options={STATUS_OPTIONS}
            onChange={(value) => updateField('status', value)}
            error={errors?.status}
          />
        </View>

        <View style={styles.column}>
          <DateTimeField
            label="Clock In"
            mode="time"
            value={order.clockIn}
            onChange={(value) => updateField('clockIn', value)}
          />

          <DateTimeField
            label="Clock Out"
            mode="time"
            value={order.clockOut}
            onChange={(value) => updateField('clockOut', value)}
          />

          <AppSelect
            label="Job Type"
            value={order.jobType}
            options={JOB_TYPE_OPTIONS}
            onChange={(value) => updateField('jobType', value)}
            error={errors?.jobType}
          />

          <DateTimeField
            label="Date"
            mode="date"
            value={order.date}
            onChange={(value) => updateField('date', value)}
            error={errors?.date}
          />

          <AppInput
            label="Description"
            value={order.description}
            onChangeText={(value) => updateField('description', value)}
            placeholder="Describe the rehab work"
            multiline
            numberOfLines={5}
            autoCapitalize="sentences"
            error={errors?.description}
          />
        </View>
      </View>

      <AttachmentPicker
        attachments={order.attachments || []}
        onChange={(attachments) => updateField('attachments', attachments)}
      />
    </View>
  );
}