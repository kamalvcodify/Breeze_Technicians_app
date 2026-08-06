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

import {
  colors,
} from '../theme/colors';

import styles from '../styles/SearchableSelect.styles';

const REMOTE_SEARCH_DELAY = 500;

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

    if (
      cleanQuery.length < 2 ||
      filteredOptions.length > 0
    ) {
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
    filteredOptions.length,
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
          <Text style={styles.chevron}>
            ⌄
          </Text>
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
              >
                <Text style={styles.closeText}>
                  ×
                </Text>
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
            />

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
                    <Text
                      style={
                        styles.selectedMark
                      }
                    >
                      ✓
                    </Text>
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