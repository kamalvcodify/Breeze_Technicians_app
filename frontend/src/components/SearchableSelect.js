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
 * Two real fixes here, not just styling:
 *
 * 1. The options FlatList had no sizing of its own, and modalCard
 *    had no overflow:'hidden'. With a long list (many properties/
 *    units), results past the modal's maxHeight would simply
 *    overflow the card and become untappable, with no scrolling -
 *    this was very likely THE "unresponsive" bug on Property/Unit
 *    specifically, since those are the two fields most likely to
 *    have long lists. Fixed by giving the FlatList explicit flex
 *    and modalCard overflow:'hidden'.
 *
 * 2. Remote search used to bail out entirely if there was ANY local
 *    match, even a loose/wrong one - meaning typing could get
 *    "stuck" showing an incomplete local result and never actually
 *    ask the server for the real match. Now it always fires the
 *    remote search on a debounce once the query is long enough,
 *    regardless of what's already loaded locally, so what's shown
 *    is never artificially capped to whatever happened to load
 *    first.
 *
 * Chevron/close/checkmark switched from plain text glyphs to
 * Ionicons for consistency with the rest of the app.
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
  onChange,
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

    // Always debounce-search remotely once the query is long
    // enough, regardless of how many (possibly incomplete or
    // loosely-matched) local options already exist - see the
    // comment block above for why this used to get stuck.
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
    setVisible(true);
  };

  const selectOption = (
    option
  ) => {
    onChange(option.value);
    setVisible(false);
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
          </View>
        </View>
      </Modal>
    </View>
  );
}