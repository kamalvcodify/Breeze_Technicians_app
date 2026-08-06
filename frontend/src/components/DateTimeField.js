import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import styles from '../styles/DateTimeField.styles';

function formatDate(date) {
  return date.toISOString().slice(0, 10);
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

        <Text style={styles.icon}>
          {mode === 'date' ? '▣' : '◷'}
        </Text>
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