import React, { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import styles from '../styles/DateTimeCombinedField.styles';

/**
 * components/DateTimeCombinedField.js
 * ----------------------------------------------------------------
 * New component - the existing DateTimeField.js only handles ONE
 * of date or time per field. The Check-In/Check-Out screenshot
 * shows a single combined "Date/Time" field (e.g.
 * "08/11/2026 00:36:15") that's still editable, so this wraps both
 * pickers behind one control: tapping it opens the date picker,
 * then (on Android) immediately chains into the time picker after
 * a date is picked. On iOS, a small "Next: Time" / "Done" button
 * advances between the two steps since iOS pickers are inline
 * rather than dialogs.
 *
 * Value is stored/passed as a full ISO datetime string.
 * ----------------------------------------------------------------
 */
function formatDisplay(date) {
  const datePart = date.toLocaleDateString();
  const timePart = date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  return `${datePart} ${timePart}`;
}

export default function DateTimeCombinedField({ label, value, onChange, error }) {
  const [stage, setStage] = useState(null); // null | 'date' | 'time'

  const currentDate = value ? new Date(value) : new Date();

  if (Platform.OS === 'web') {
    return (
      <View style={styles.wrapper}>
        {!!label && <Text style={styles.label}>{label}</Text>}

        {React.createElement('input', {
          type: 'datetime-local',
          value: value ? new Date(value).toISOString().slice(0, 19) : '',
          onChange: (event) => {
            if (!event.target.value) return;
            onChange(new Date(event.target.value).toISOString());
          },
          style: {
            width: '100%',
            minHeight: 46,
            boxSizing: 'border-box',
            border: `1px solid ${error ? '#C43D3D' : '#DDE3E9'}`,
            borderRadius: 6,
            backgroundColor: '#FFFFFF',
            padding: '0 16px',
            fontSize: 15,
            color: '#182230',
            outline: 'none',
            fontFamily: 'inherit',
          },
        })}

        {!!error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }

  const openPicker = () => setStage('date');

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setStage(null);
    }

    if (event.type === 'dismissed' || !selectedDate) {
      setStage(null);
      return;
    }

    const combined = new Date(currentDate);
    combined.setFullYear(selectedDate.getFullYear());
    combined.setMonth(selectedDate.getMonth());
    combined.setDate(selectedDate.getDate());

    onChange(combined.toISOString());

    if (Platform.OS === 'android') {
      // Chain straight into the time picker after a date is chosen.
      setTimeout(() => setStage('time'), 200);
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    if (Platform.OS === 'android') {
      setStage(null);
    }

    if (event.type === 'dismissed' || !selectedTime) {
      setStage(null);
      return;
    }

    const combined = new Date(currentDate);
    combined.setHours(selectedTime.getHours());
    combined.setMinutes(selectedTime.getMinutes());
    combined.setSeconds(selectedTime.getSeconds());

    onChange(combined.toISOString());
    setStage(null);
  };

  return (
    <View style={styles.wrapper}>
      {!!label && <Text style={styles.label}>{label}</Text>}

      <Pressable style={[styles.control, error && styles.errorControl]} onPress={openPicker}>
        <Text style={styles.value}>{formatDisplay(currentDate)}</Text>
        <Ionicons name="calendar-outline" size={17} color={colors.blue} />
      </Pressable>

      {!!error && <Text style={styles.errorText}>{error}</Text>}

      {stage === 'date' && (
        <DateTimePicker
          value={currentDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}

      {stage === 'time' && (
        <DateTimePicker
          value={currentDate}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}

      {Platform.OS === 'ios' && !!stage && (
        <Pressable
          style={styles.doneButton}
          onPress={() => setStage(stage === 'date' ? 'time' : null)}
        >
          <Text style={styles.doneText}>{stage === 'date' ? 'Next: Time' : 'Done'}</Text>
        </Pressable>
      )}
    </View>
  );
}