import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import TechnicianLayout from '../components/TechnicianLayout';
import { getReport } from '../api/reports';
import { colors } from '../theme/colors';
import styles from '../styles/ReportListScreen.styles';

/**
 * screens/ReportListScreen.js
 * ----------------------------------------------------------------
 * ONE generic list screen for all 5 reports - reportKey and title
 * come from navigation params. Column headers come straight from
 * the backend response (zohoReportService.js's per-report
 * `columns` array), so this screen has no per-report logic at all.
 *
 * Each row already carries its full detail data (groups/checklist)
 * from the single list fetch - tapping a row navigates to
 * ReportDetailScreen with that data already in hand, no second
 * network call needed.
 * ----------------------------------------------------------------
 */
export default function ReportListScreen({ navigation, route }) {
  const { reportKey, title } = route.params || {};

  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadReport = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const response = await getReport(reportKey);
      setColumns(response.data?.columns || []);
      setRows(response.data?.rows || []);
    } catch (error) {
      setColumns([]);
      setRows([]);
      setErrorMessage(
        error?.response?.data?.detail || 'Could not load this report. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [reportKey]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const renderHeaderRow = () => (
    <View style={[styles.row, styles.headerRow]}>
      {columns.map((column) => (
        <Text key={column} style={[styles.cell, styles.headerCell]} numberOfLines={1}>
          {column}
        </Text>
      ))}
    </View>
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={0.7}
      onPress={() =>
        navigation.navigate('ReportDetail', {
          title,
          row: item,
        })
      }
    >
      <Text style={styles.cell} numberOfLines={1}>
        {item.summary.col1 || '—'}
      </Text>
      <Text style={styles.cell} numberOfLines={1}>
        {item.summary.col2 || '—'}
      </Text>
      <Text style={styles.cell} numberOfLines={1}>
        {item.summary.col3 || '—'}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
    </TouchableOpacity>
  );

  return (
    <TechnicianLayout navigation={navigation} activeRoute="Reports">
      <View style={styles.headerBar}>
        <View style={styles.headerBarInner}>
          <View style={styles.headerTextGroup}>
            <Text style={styles.headerTitle}>{title || 'Report'}</Text>
            <Text style={styles.headerSubtitle}>
              {loading ? 'Loading…' : `${rows.length} ${rows.length === 1 ? 'record' : 'records'}`}
            </Text>
          </View>

          <View style={styles.headerIconBadge}>
            <Ionicons name="bar-chart-outline" size={18} color={colors.blue} />
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.blue} />
          <Text style={styles.loadingText}>Loading report…</Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item, index) => String(item.id || index)}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={rows.length > 0 ? renderHeaderRow : null}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              {!!errorMessage && (
                <>
                  <Text style={styles.errorTitle}>Unable to load report</Text>
                  <Text style={styles.emptyMessage}>{errorMessage}</Text>
                  <TouchableOpacity style={styles.retryButton} onPress={loadReport}>
                    <Text style={styles.retryButtonText}>Try Again</Text>
                  </TouchableOpacity>
                </>
              )}
              {!errorMessage && (
                <Text style={styles.emptyMessage}>No records found.</Text>
              )}
            </View>
          }
        />
      )}
    </TechnicianLayout>
  );
}