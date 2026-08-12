import React from 'react';
import { View } from 'react-native';

import AppInput from './AppInput';
import AppSelect from './AppSelect';
import DateTimeCombinedField from './DateTimeCombinedField';
import QRScannerField from './QRScannerField';
import SearchableSelect from './SearchableSelect';

import { parseInventoryQrValue } from '../utils/qrPayload';

import styles from '../styles/CheckInCheckOutFormSection.styles';

/**
 * components/CheckInCheckOutFormSection.js
 * ----------------------------------------------------------------
 * Single-entry form - no "+Add" repeat pattern like Work Order /
 * Rehab Order, and no heading/kicker/Remove row, matching the
 * simpler single-form layout in the screenshot. Field order follows
 * the screenshot's own two-column split.
 *
 * Rehab Unit is built and shown normally (SearchableSelect, tied to
 * the selected Property, same as Unit on the other forms) but is
 * intentionally EXCLUDED from the submitted payload for now - see
 * the comment in the screen where the payload is built.
 *
 * ASSUMPTIONS (screenshot-only, no confirmed Zoho picklist values
 * for City/Job Type/Action beyond what was explicitly given):
 * - CITY_OPTIONS: same list as Work Order / Rehab Order.
 * - JOB_TYPE_OPTIONS: exactly Rehab / Work Order, as specified.
 * - ACTION_OPTIONS: exactly Check-in / Check-out, as specified.
 * ----------------------------------------------------------------
 */
const CITY_OPTIONS = [
  { label: 'Youngstown', value: 'Youngstown' },
  { label: 'Toledo', value: 'Toledo' },
  { label: 'Lima', value: 'Lima' },
];

const JOB_TYPE_OPTIONS = [
  { label: 'Rehab', value: 'Rehab' },
  { label: 'Work Order', value: 'Work Order' },
];

const ACTION_OPTIONS = [
  { label: 'Check-in', value: 'Check-in' },
  { label: 'Check-out', value: 'Check-out' },
];

export default function CheckInCheckOutFormSection({
  entry,
  errors,
  onChange,

  propertyOptions,
  rehabUnitOptions,

  loadingProperties,
  loadingRehabUnits,

  onPropertySearch,
  onRehabUnitSearch,
  onPropertySelected,
}) {
  const updateField = (field, value) => {
    onChange({ ...entry, [field]: value });
  };

  const handlePropertyChange = (propertyId) => {
    // Clear the existing Rehab Unit because it may belong to the
    // previously selected Property - same pattern as the other forms.
    onChange({ ...entry, property: propertyId, rehabUnit: '' });
    onPropertySelected(propertyId);
  };

  const handleQrScan = (scannedValue) => {
    const { partCode, partsInventory } = parseInventoryQrValue(scannedValue);

    onChange({
      ...entry,
      qrScanValue: scannedValue,
      partCode,
      partsInventory,
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.fields}>
        <View style={styles.column}>
          <QRScannerField
            label="Scan QR Code"
            value={entry.qrScanValue}
            onScan={handleQrScan}
          />

          <AppSelect
            label="Action"
            value={entry.action}
            options={ACTION_OPTIONS}
            onChange={(value) => updateField('action', value)}
            error={errors?.action}
          />

          {entry.action === 'Check-out' && (
            <AppInput
              label="Quantity Desired"
              value={entry.quantityDesired}
              onChangeText={(value) => updateField('quantityDesired', value)}
              placeholder="Enter quantity"
              keyboardType="numeric"
              error={errors?.quantityDesired}
            />
          )}

          {entry.action === 'Check-in' && (
            <AppInput
              label="Quantity Returned"
              value={entry.quantityReturned}
              onChangeText={(value) => updateField('quantityReturned', value)}
              placeholder="Enter quantity"
              keyboardType="numeric"
              error={errors?.quantityReturned}
            />
          )}

          <AppInput
            label="Part Code"
            value={entry.partCode}
            onChangeText={(value) => updateField('partCode', value)}
            placeholder="Auto-filled from QR scan"
            editable={false}
          />

          <AppInput
            label="Parts Inventory"
            value={entry.partsInventory}
            onChangeText={(value) => updateField('partsInventory', value)}
            placeholder="Auto-filled from QR scan"
            editable={false}
          />

          <AppSelect
            label="City"
            value={entry.city}
            options={CITY_OPTIONS}
            onChange={(value) => updateField('city', value)}
            error={errors?.city}
          />

          <AppSelect
            label="Job Type"
            value={entry.jobType}
            options={JOB_TYPE_OPTIONS}
            onChange={(value) => updateField('jobType', value)}
            error={errors?.jobType}
          />
        </View>

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
            label="Work Order"
            value={entry.workOrder}
            onChangeText={(value) => updateField('workOrder', value)}
            placeholder="Work order reference"
            error={errors?.workOrder}
          />

          <SearchableSelect
            label="Rehab Unit"
            value={entry.rehabUnit}
            options={rehabUnitOptions}
            placeholder={
              !entry.property
                ? 'Select a property first'
                : loadingRehabUnits
                  ? 'Loading units…'
                  : 'Select unit'
            }
            searchPlaceholder="Search units"
            loading={loadingRehabUnits}
            disabled={!entry.property}
            emptyMessage={
              entry.property ? 'No units found for this property.' : 'Select a property first.'
            }
            onChange={(value) => updateField('rehabUnit', value)}
            onRemoteSearch={(query) => onRehabUnitSearch(entry.property, query)}
          />

          <DateTimeCombinedField
            label="Date/Time"
            value={entry.dateTime}
            onChange={(value) => updateField('dateTime', value)}
            error={errors?.dateTime}
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

          <AppInput
            label="Email"
            value={entry.email}
            onChangeText={(value) => updateField('email', value)}
            placeholder="Email"
            keyboardType="email-address"
            error={errors?.email}
          />
        </View>
      </View>
    </View>
  );
}