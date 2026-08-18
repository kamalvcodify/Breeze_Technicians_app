import React from "react";
import { Text, View } from "react-native";

import AppCheckbox from "./AppCheckbox";
import AppInput from "./AppInput";
import AppSelect from "./AppSelect";
import DateTimeCombinedField from "./DateTimeCombinedField";
import SearchableSelect from "./SearchableSelect";

import styles from "../styles/RentReadyChecklistFormSection.styles";

/**
 * components/RentReadyChecklistFormSection.js
 * ----------------------------------------------------------------
 * NEW: each section now has a master "select all" checkbox next to
 * its title. Checking it ticks every item in that section at once;
 * unchecking it clears every item in that section at once.
 * Individual items underneath remain fully editable afterward
 * either way (the master checkbox is just a convenience toggle,
 * not a lock).
 *
 * The master checkbox's own checked state reflects whether ALL
 * items in that section are currently checked - if you manually
 * check all 5 items one by one, the master checkbox shows checked
 * too, and vice versa.
 *
 * This is deliberately an APP-ONLY convenience feature - per
 * instructions, Zoho/the CRM only ever receives the individual
 * item values, exactly as before. No backend change needed for
 * this at all.
 *
 * Checklist item KEYS below are used AS-IS as the Zoho field API
 * names (matching exactly what was given) - the backend sends
 * these straight through without any name-mapping layer, unlike
 * Property/Unit/etc which go through env.js config. Labels are
 * reconstructed from the screenshot for readability; the
 * underlying key is what actually gets submitted.
 *
 * NOTE: "CO_Detectors_New_batteries_installed_and_tested" is the
 * only item in the Safety & Final Touches section WITHOUT a
 * trailing "1" that all its siblings have - used exactly as given,
 * worth double-checking in Zoho that this isn't a typo.
 * ----------------------------------------------------------------
 */
const RENT_READY_OPTIONS = [
  { label: "Yes", value: "Yes" },
  { label: "No", value: "No" },
];

const CHECKLIST_SECTIONS = [
  {
    title: "Exterior & Entry",
    items: [
      {
        key: "EXTERIOR_DEBRIS",
        label: "Exterior: Free of debris, trash, and personal items",
      },
      {
        key: "ENTRYWAY",
        label:
          "Entryway: Porch/balcony swept, front door cleaned, doorbell working",
      },
      { key: "MAILBOX", label: "Mailbox: Clean, intact, and functional" },
      {
        key: "LANDSCAPING",
        label: "Landscaping: Grass cut, weeds removed, bushes trimmed",
      },
      {
        key: "LIGHTING_EXTERIOR",
        label:
          "Lighting: All exterior lights functional, bulbs replaced if needed",
      },
    ],
  },
  {
    title: "General Interior",
    items: [
      {
        key: "WALLS_CEILINGS",
        label: "Walls/Ceilings: Cleaned, patched, and painted/touched up",
      },
      {
        key: "WINDOWS",
        label:
          "Windows: Cleaned inside and out, blinds/curtains functional, screens intact",
      },
      {
        key: "LIGHTING_ELECTRICAL",
        label:
          "Lighting/Electrical: All light bulbs working, outlet covers in place",
      },
      {
        key: "FLOORING_GENERAL",
        label:
          "Flooring: Carpet professionally cleaned or replaced, hardwood/tile swept and mopped",
      },
      {
        key: "DOORS",
        label:
          "Doors: All doors open and close properly, locks functional, keys available",
      },
      { key: "HVAC", label: "HVAC: Filter replaced, air vents cleaned" },
    ],
  },
  {
    title: "Kitchen",
    items: [
      {
        key: "REFRIGERATOR",
        label:
          "Refrigerator: Cleaned inside/outside and top, coils vacuumed, ice maker functional",
      },
      {
        key: "STOVE_OVEN",
        label:
          "Stove/Oven: Range top cleaned, oven scrubbed, burners functional",
      },
      { key: "DISHWASHER", label: "Dishwasher: Cleaned and running properly" },
      { key: "MICROWAVE", label: "Microwave: Cleaned inside and outside" },
      {
        key: "CABINETS",
        label: "Cabinets/Drawers: Cleaned inside and outside",
      },
      {
        key: "SINK_FAUCET",
        label: "Sink/Faucet: No leaks, garbage disposal functional",
      },
    ],
  },
  {
    title: "Bathrooms",
    items: [
      {
        key: "TOILET",
        label: "Toilet: Thoroughly cleaned, flushes properly, no leaks",
      },
      {
        key: "SHOWER_TUB",
        label:
          "Shower/Tub: Caulking in good condition, shower head functional, no drain clogs",
      },
      { key: "VANITY_SINK", label: "Vanity/Sink: Cleaned, faucet functional" },
      {
        key: "MIRROR_LIGHTING",
        label: "Mirror/Lighting: Mirror cleaned, lights working",
      },
      { key: "VENTILATION", label: "Ventilation: Fan clean and working" },
    ],
  },
  {
    title: "Bedrooms & Closets",
    items: [
      {
        key: "CLOSETS",
        label: "Closets: Shelves cleaned, doors track properly",
      },
      {
        key: "FLOORING_BEDROOM",
        label: "Flooring: Cleaned, no stains or debris",
      },
    ],
  },
  {
    title: "Safety & Final Touches",
    items: [
      {
        key: "SMOKE_DETECTORS",
        label: "Smoke Detectors: New batteries installed and tested",
      },
      {
        key: "CO_DETECTORS",
        label: "CO Detectors: New batteries installed and tested",
      },
      {
        key: "FIRE_EXTINGUISHER",
        label: "Fire Extinguisher: Present and updated if required",
      },
      {
        key: "FINAL_CLEANING",
        label: "Final Cleaning: Unit is dust-free and ready for final review",
      },
      {
        key: "FINAL_WALKTHROUGH",
        label: "Final Walkthrough: Final walkthrough completed",
      },
    ],
  },
];

export { CHECKLIST_SECTIONS };

function ChecklistSection({ title, items, checklist, onToggle, onToggleSection }) {
  const allChecked = items.every((item) => !!checklist[item.key]);

  return (
    <View style={styles.section}>
      <AppCheckbox
        label={title}
        labelStyle={styles.sectionTitle}
        checked={allChecked}
        onChange={(checked) => onToggleSection(items, checked)}
      />
      <View style={styles.sectionDivider} />

      <View style={styles.checklistGrid}>
        {items.map((item) => (
          <View key={item.key} style={styles.checklistItem}>
            <AppCheckbox
              label={item.label}
              checked={!!checklist[item.key]}
              onChange={(checked) => onToggle(item.key, checked)}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

export default function RentReadyChecklistFormSection({
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
    onChange({ ...entry, property: propertyId, unit: "" });
    onPropertySelected(propertyId);
  };

  const toggleChecklistItem = (key, checked) => {
    onChange({
      ...entry,
      checklist: { ...entry.checklist, [key]: checked },
    });
  };

  /**
   * Sets every item in one section to the same checked value at
   * once, in a single state update (rather than calling
   * toggleChecklistItem once per item, which would cause 5+
   * separate re-renders from stale closures over the same
   * entry.checklist snapshot).
   */
  const toggleSection = (items, checked) => {
    const updatedChecklist = { ...entry.checklist };

    items.forEach((item) => {
      updatedChecklist[item.key] = checked;
    });

    onChange({
      ...entry,
      checklist: updatedChecklist,
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.fields}>
        <View style={styles.column}>
          <SearchableSelect
            label="Property"
            value={entry.property}
            options={propertyOptions}
            placeholder={
              loadingProperties ? "Loading properties…" : "Select property"
            }
            searchPlaceholder="Search by property name or address"
            loading={loadingProperties}
            error={errors?.property}
            emptyMessage="No properties found."
            onChange={handlePropertyChange}
            onRemoteSearch={onPropertySearch}
          />

          <SearchableSelect
            label="Unit"
            value={entry.unit}
            options={unitOptions}
            placeholder={
              !entry.property
                ? "Select a property first"
                : loadingUnits
                  ? "Loading units…"
                  : "Select unit"
            }
            searchPlaceholder="Search units"
            loading={loadingUnits}
            disabled={!entry.property}
            error={errors?.unit}
            emptyMessage={
              entry.property
                ? "No units found for this property."
                : "Select a property first."
            }
            onChange={(value) => updateField("unit", value)}
            onRemoteSearch={(query) => onUnitSearch(entry.property, query)}
          />

          <AppInput
            label="Technician Name"
            value={entry.technicianName}
            onChangeText={(value) => updateField("technicianName", value)}
            placeholder="Technician name"
            error={errors?.technicianName}
          />
        </View>

        <View style={styles.column}>
          <AppSelect
            label="Rent Ready"
            value={entry.rentReady}
            options={RENT_READY_OPTIONS}
            onChange={(value) => updateField("rentReady", value)}
            error={errors?.rentReady}
          />

          <DateTimeCombinedField
            label="Date/Time"
            value={entry.dateTime}
            onChange={(value) => updateField("dateTime", value)}
            error={errors?.dateTime}
          />

          <AppInput
            label="Notes"
            value={entry.notes}
            onChangeText={(value) => updateField("notes", value)}
            placeholder="Add any notes"
            multiline
            numberOfLines={4}
            autoCapitalize="sentences"
          />

          <AppInput
            label="Email"
            value={entry.email}
            onChangeText={(value) => updateField("email", value)}
            placeholder="Email"
            keyboardType="email-address"
            error={errors?.email}
          />
        </View>
      </View>

      {CHECKLIST_SECTIONS.map((section) => (
        <ChecklistSection
          key={section.title}
          title={section.title}
          items={section.items}
          checklist={entry.checklist}
          onToggle={toggleChecklistItem}
          onToggleSection={toggleSection}
        />
      ))}
    </View>
  );
}