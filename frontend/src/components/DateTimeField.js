import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import styles from '../styles/DateTimeField.styles';

/**
 * components/DateTimeField.js
 * ----------------------------------------------------------------
 * Icons switched from plain text glyphs ("▣" / "◷") to Ionicons,
 * matching every other icon in the app.
 *
 * FIX: formatDate() previously used date.toISOString().slice(0,10)
 * - toISOString() converts to UTC first, so picking a date late in
 * the evening in a US timezone (behind UTC) could roll over to the
 * NEXT UTC day, silently saving the wrong date (e.g. picking
 * "Aug 25, 11:30 PM" became "2026-08-26"). This only showed up
 * depending on the time of day, matching the "sometimes" symptom
 * reported. Now builds the date string from the LOCAL year/month/
 * day directly - no UTC conversion at all for a pure calendar date,
 * since a calendar date isn't really a "moment in time" the way a
 * full timestamp is.
 * ----------------------------------------------------------------
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTime(date) {
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function parseValue(value, mode) {
  if (!value) {
    return new Date();
  }

  if (mode === 'date') {
    const parsedDate = new Date(`${value}T00:00:00`);

    return Number.isNaN(parsedDate.getTime())
      ? new Date()
      : parsedDate;
  }

  const timeMatch = String(value).match(/^(\d{1,2}):(\d{2})/);

  if (!timeMatch) {
    return new Date();
  }

  const parsedTime = new Date();

  parsedTime.setHours(
    Number(timeMatch[1]),
    Number(timeMatch[2]),
    0,
    0
  );

  return parsedTime;
}

export default function DateTimeField({
  label,
  value,
  onChange,
  mode = 'date',
  error,
}) {
  const [pickerVisible, setPickerVisible] = useState(false);

  /*
   * On Expo web, a native HTML date/time input provides
   * the cleanest and most reliable browser experience.
   */
  if (Platform.OS === 'web') {
    return (
      <View style={styles.wrapper}>
        {!!label && (
          <Text style={styles.label}>
            {label}
          </Text>
        )}

        {React.createElement('input', {
          type: mode,
          value: value || '',
          onChange: (event) => {
            onChange(event.target.value);
          },
          style: {
            width: '100%',
            minHeight: 46,
            boxSizing: 'border-box',
            border: `1px solid ${
              error ? '#C43D3D' : '#DDE3E9'
            }`,
            borderRadius: 6,
            backgroundColor: '#FFFFFF',
            padding: '0 16px',
            fontSize: 15,
            color: '#182230',
            outline: 'none',
            fontFamily: 'inherit',
          },
        })}

        {!!error && (
          <Text style={styles.errorText}>
            {error}
          </Text>
        )}
      </View>
    );
  }

  const selectedValue = parseValue(value, mode);

  const handlePickerChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setPickerVisible(false);
    }

    if (
      event.type === 'dismissed' ||
      !selectedDate
    ) {
      return;
    }

    const formattedValue =
      mode === 'date'
        ? formatDate(selectedDate)
        : formatTime(selectedDate);

    onChange(formattedValue);
  };

  return (
    <View style={styles.wrapper}>
      {!!label && (
        <Text style={styles.label}>
          {label}
        </Text>
      )}

      <Pressable
        style={[
          styles.control,
          error && styles.errorControl,
        ]}
        onPress={() => setPickerVisible(true)}
      >
        <Text
          style={[
            styles.value,
            !value && styles.placeholder,
          ]}
        >
          {value ||
            (mode === 'date'
              ? 'Select date'
              : 'Select time')}
        </Text>

        <Ionicons
          name={mode === 'date' ? 'calendar-outline' : 'time-outline'}
          size={17}
          color={colors.blue}
        />
      </Pressable>

      {!!error && (
        <Text style={styles.errorText}>
          {error}
        </Text>
      )}

      {pickerVisible && (
        <DateTimePicker
          value={selectedValue}
          mode={mode}
          display={
            Platform.OS === 'ios'
              ? 'spinner'
              : 'default'
          }
          onChange={handlePickerChange}
        />
      )}

      {Platform.OS === 'ios' &&
        pickerVisible && (
          <Pressable
            style={styles.doneButton}
            onPress={() =>
              setPickerVisible(false)
            }
          >
            <Text style={styles.doneText}>
              Done
            </Text>
          </Pressable>
        )}
    </View>
  );
}