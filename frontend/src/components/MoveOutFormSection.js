import React from 'react';
import { View } from 'react-native';

import AppInput from './AppInput';
import AppSelect from './AppSelect';
import AttachmentPicker from './AttachmentPicker';
import DateTimeField from './DateTimeField';
import SearchableSelect from './SearchableSelect';

import styles from '../styles/MoveOutFormSection.styles';

/**
 * components/MoveOutFormSection.js
 * ----------------------------------------------------------------
 * Single-entry form (no "+Add" repeat pattern, no heading/kicker
 * row), same as Check In/Check Out - matches the screenshot's
 * simple layout. Field order and two-column split follow the
 * screenshot exactly: Technician Name/Property/Email/Notes on the
 * left, Final Status/Unit/Date of Inspection on the right, Photo
 * (AttachmentPicker) full-width below.
 *
 * Photo/attachments are collected in the UI but are NOT sent to
 * Zoho yet - same treatment as Work Order/Rehab Order attachments
 * and Check In/Check Out's QR field. See the screen for where the
 * payload is built.
 * ----------------------------------------------------------------
 */
const FINAL_STATUS_OPTIONS = [
  { label: 'Pass', value: 'Pass' },
  { label: 'Needs Repair', value: 'Needs Repair' },
];

export default function MoveOutFormSection({
  entry,
  errors,
  onChange,

  propertyOptions,
  unitOptions,

  loadingProperties,
  loadingUnits,

  onPropertySearch,
  onUnitSearch,
  onPropertySelected,
}) {
  const updateField = (field, value) => {
    onChange({ ...entry, [field]: value });
  };

  const handlePropertyChange = (propertyId) => {
    // Clear the existing Unit because it may belong to the
    // previously selected Property - same pattern as the other forms.
    onChange({ ...entry, property: propertyId, unit: '' });
    onPropertySelected(propertyId);
  };

  return (
    <View style={styles.card}>
      <View style={styles.fields}>
        <View style={styles.column}>
          <AppInput
            label="Technician Name"
            value={entry.technicianName}
            onChangeText={(value) => updateField('technicianName', value)}
            placeholder="Technician name"
            error={errors?.technicianName}
          />

          <SearchableSelect
            label="Property"
            value={entry.property}
            options={propertyOptions}
            placeholder={loadingProperties ? 'Loading properties…' : 'Select property'}
            searchPlaceholder="Search by property name or address"
            loading={loadingProperties}
            error={errors?.property}
            emptyMessage="No properties found."
            onChange={handlePropertyChange}
            onRemoteSearch={onPropertySearch}
          />

          <AppInput
            label="Email"
            value={entry.email}
            onChangeText={(value) => updateField('email', value)}
            placeholder="Email"
            keyboardType="email-address"
            error={errors?.email}
          />

          <AppInput
            label="Notes"
            value={entry.notes}
            onChangeText={(value) => updateField('notes', value)}
            placeholder="Add any notes"
            multiline
            numberOfLines={4}
            autoCapitalize="sentences"
          />
        </View>

        <View style={styles.column}>
          <AppSelect
            label="Final Status"
            value={entry.finalStatus}
            options={FINAL_STATUS_OPTIONS}
            onChange={(value) => updateField('finalStatus', value)}
            error={errors?.finalStatus}
          />

          <SearchableSelect
            label="Unit"
            value={entry.unit}
            options={unitOptions}
            placeholder={
              !entry.property
                ? 'Select a property first'
                : loadingUnits
                  ? 'Loading units…'
                  : 'Select unit'
            }
            searchPlaceholder="Search units"
            loading={loadingUnits}
            disabled={!entry.property}
            error={errors?.unit}
            emptyMessage={
              entry.property ? 'No units found for this property.' : 'Select a property first.'
            }
            onChange={(value) => updateField('unit', value)}
            onRemoteSearch={(query) => onUnitSearch(entry.property, query)}
          />

          <DateTimeField
            label="Date of Inspection"
            mode="date"
            value={entry.dateOfInspection}
            onChange={(value) => updateField('dateOfInspection', value)}
            error={errors?.dateOfInspection}
          />
        </View>
      </View>

      <AttachmentPicker
        attachments={entry.attachments || []}
        onChange={(attachments) => updateField('attachments', attachments)}
      />
    </View>
  );
}