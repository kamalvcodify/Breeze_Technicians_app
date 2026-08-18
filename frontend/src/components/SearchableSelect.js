import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  colors,
} from '../theme/colors';

import styles from '../styles/SearchableSelect.styles';

const REMOTE_SEARCH_DELAY = 500;
const REMOTE_SEARCH_MIN_LENGTH = 2;

/**
 * components/SearchableSelect.js
 * ----------------------------------------------------------------
 * NEW: allowManualEntry prop. When true, a "Can't find it? Enter
 * manually" row is always shown at the bottom of the picker modal -
 * this exists specifically for the Unit field when a technician is
 * offline and that property's units were never cached (background
 * prefetch in usePropertyUnitLookups.js covers most cases, but a
 * brand-new property or one added after the last prefetch pass
 * could still have nothing cached).
 *
 * Tapping it reveals an inline text input. Confirming calls
 * onChange(typedText) - the manually typed text becomes the value
 * directly (there is no fake ID involved) - AND, if provided,
 * onManualEntry(typedText) is also called so a parent form section
 * can do anything extra it specifically needs (e.g. Rehab Order
 * also sets a separate "unitName" field alongside "unit" - see
 * RehabFormSection.js).
 * ----------------------------------------------------------------
 */
export default function SearchableSelect({
  label,
  value,
  options = [],
  placeholder = 'Select',
  searchPlaceholder = 'Search',
  loading = false,
  disabled = false,
  error,
  emptyMessage = 'No records found.',
  allowManualEntry = false,
  onChange,
  onManualEntry,
  onRemoteSearch,
}) {
  const [
    visible,
    setVisible,
  ] = useState(false);

  const [
    query,
    setQuery,
  ] = useState('');

  const [
    remoteSearching,
    setRemoteSearching,
  ] = useState(false);

  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const [manualEntryText, setManualEntryText] = useState('');

  const selectedOption =
    options.find(
      (option) =>
        option.value === value
    );

  const filteredOptions =
    useMemo(() => {
      const cleanQuery =
        query.trim().toLowerCase();

      if (!cleanQuery) {
        return options;
      }

      return options.filter(
        (option) => {
          const searchableText =
            `${option.label || ''} ${option.subtitle || ''}`
              .toLowerCase();

          return searchableText.includes(
            cleanQuery
          );
        }
      );
    }, [options, query]);

  useEffect(() => {
    if (
      !visible ||
      !onRemoteSearch
    ) {
      return undefined;
    }

    const cleanQuery =
      query.trim();

    if (cleanQuery.length < REMOTE_SEARCH_MIN_LENGTH) {
      return undefined;
    }

    const timer =
      setTimeout(async () => {
        setRemoteSearching(true);

        try {
          await onRemoteSearch(
            cleanQuery
          );
        } finally {
          setRemoteSearching(false);
        }
      }, REMOTE_SEARCH_DELAY);

    return () =>
      clearTimeout(timer);
  }, [
    query,
    visible,
    onRemoteSearch,
  ]);

  const openSelect = () => {
    if (disabled) {
      return;
    }

    setQuery('');
    setManualEntryOpen(false);
    setManualEntryText('');
    setVisible(true);
  };

  const selectOption = (
    option
  ) => {
    onChange(option.value);
    setVisible(false);
    setQuery('');
  };

  const confirmManualEntry = () => {
    const cleanText = manualEntryText.trim();

    if (!cleanText) {
      return;
    }

    onChange(cleanText);
    onManualEntry?.(cleanText);

    setVisible(false);
    setManualEntryOpen(false);
    setManualEntryText('');
    setQuery('');
  };

  const showRemoteHint =
    !!onRemoteSearch &&
    query.trim().length > 0 &&
    query.trim().length < REMOTE_SEARCH_MIN_LENGTH;

  return (
    <View style={styles.wrapper}>
      {!!label && (
        <Text style={styles.label}>
          {label}
        </Text>
      )}

      <TouchableOpacity
        style={[
          styles.control,
          error &&
            styles.errorControl,
          disabled &&
            styles.disabledControl,
        ]}
        onPress={openSelect}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <View style={styles.selectedText}>
          <Text
            style={[
              styles.value,
              !selectedOption &&
                styles.placeholder,
            ]}
            numberOfLines={1}
          >
            {selectedOption?.label ||
              value ||
              placeholder}
          </Text>

          {!!selectedOption?.subtitle && (
            <Text
              style={
                styles.selectedSubtitle
              }
              numberOfLines={1}
            >
              {
                selectedOption.subtitle
              }
            </Text>
          )}
        </View>

        {loading ? (
          <ActivityIndicator
            size="small"
            color={colors.blue}
          />
        ) : (
          <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
        )}
      </TouchableOpacity>

      {!!error && (
        <Text style={styles.errorText}>
          {error}
        </Text>
      )}

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setVisible(false)
        }
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.backdrop}
            onPress={() =>
              setVisible(false)
            }
          />

          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {label || 'Select'}
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setVisible(false)
                }
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder={
                searchPlaceholder
              }
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />

            {showRemoteHint && (
              <Text style={styles.hintText}>
                Keep typing - type at least {REMOTE_SEARCH_MIN_LENGTH} characters to search.
              </Text>
            )}

            {(loading ||
              remoteSearching) && (
              <View
                style={
                  styles.loadingRow
                }
              >
                <ActivityIndicator
                  size="small"
                  color={colors.blue}
                />

                <Text
                  style={
                    styles.loadingText
                  }
                >
                  Loading records…
                </Text>
              </View>
            )}

            <FlatList
              data={filteredOptions}
              keyExtractor={(item) =>
                String(item.value)
              }
              style={styles.optionsList}
              contentContainerStyle={styles.optionsListContent}
              keyboardShouldPersistTaps="handled"
              ItemSeparatorComponent={() => (
                <View
                  style={
                    styles.separator
                  }
                />
              )}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() =>
                    selectOption(item)
                  }
                  activeOpacity={0.7}
                >
                  <View
                    style={
                      styles.optionContent
                    }
                  >
                    <Text
                      style={
                        styles.optionLabel
                      }
                    >
                      {item.label}
                    </Text>

                    {!!item.subtitle && (
                      <Text
                        style={
                          styles.optionSubtitle
                        }
                        numberOfLines={1}
                      >
                        {item.subtitle}
                      </Text>
                    )}
                  </View>

                  {item.value ===
                    value && (
                    <Ionicons name="checkmark" size={18} color={colors.blue} />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                !loading &&
                !remoteSearching ? (
                  <Text
                    style={
                      styles.emptyText
                    }
                  >
                    {emptyMessage}
                  </Text>
                ) : null
              }
            />

            {allowManualEntry && (
              <View style={styles.manualEntrySection}>
                {!manualEntryOpen ? (
                  <TouchableOpacity
                    style={styles.manualEntryToggle}
                    onPress={() => setManualEntryOpen(true)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="create-outline" size={15} color={colors.blue} />
                    <Text style={styles.manualEntryToggleText}>
                      Can't find it? Enter manually
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.manualEntryRow}>
                    <TextInput
                      style={styles.manualEntryInput}
                      value={manualEntryText}
                      onChangeText={setManualEntryText}
                      placeholder="Type the value"
                      autoCapitalize="words"
                    />
                    <TouchableOpacity
                      style={styles.manualEntryConfirm}
                      onPress={confirmManualEntry}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.manualEntryConfirmText}>Use this</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}