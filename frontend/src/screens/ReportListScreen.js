import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import TechnicianLayout from "../components/TechnicianLayout";
import { getReport } from "../api/reports";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme/colors";
import styles from "../styles/ReportListScreen.styles";

/**
 * screens/ReportListScreen.js
 * ----------------------------------------------------------------
 * ONE generic list screen for all 5 reports - reportKey and title
 * come from navigation params. Column headers come straight from
 * the backend response (zohoReportService.js's per-report
 * `columns` array), so this screen has no per-report logic at all.
 *
 * NEW: client-side pagination (PAGE_SIZE records at a time, with
 * Previous/Next controls) - the full report is still fetched in
 * one request as before, this just slices it for display. Chosen
 * over backend pagination since report sizes seen so far are small
 * (tens of records), making this simpler to build and fast enough
 * in practice, without needing to teach the backend to walk Zoho's
 * own pagination cursor.
 *
 * NEW: each row's bare trailing chevron icon is replaced with a
 * small labeled "View" pill - the whole row is still tappable (a
 * larger, easier touch target, especially on mobile), but the pill
 * makes the action visually obvious instead of relying on a small
 * icon alone.
 *
 * isAdmin still read from useAuth() and passed to TechnicianLayout
 * (fix from earlier).
 * ----------------------------------------------------------------
 */
const PAGE_SIZE = 15;

export default function ReportListScreen({ navigation, route }) {
  const { reportKey, title } = route.params || {};
  const { isAdmin } = useAuth();

  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [page, setPage] = useState(1);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await getReport(reportKey);
      setColumns(response.data?.columns || []);
      setRows(response.data?.rows || []);
      setPage(1);
    } catch (error) {
      setColumns([]);
      setRows([]);
      setErrorMessage(
        error?.response?.data?.detail ||
          "Could not load this report. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [reportKey]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));

  const pagedRows = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return rows.slice(startIndex, startIndex + PAGE_SIZE);
  }, [rows, page]);

  const goToPreviousPage = () => {
    setPage((current) => Math.max(1, current - 1));
  };

  const goToNextPage = () => {
    setPage((current) => Math.min(totalPages, current + 1));
  };

  const renderHeaderRow = () => (
    <View style={[styles.row, styles.headerRow]}>
      {columns.map((column) => (
        <Text
          key={column}
          style={[styles.cell, styles.headerCell]}
          numberOfLines={1}
        >
          {column}
        </Text>
      ))}
      <View style={styles.viewButtonSpacer} />
    </View>
  );

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <Text style={styles.cell} numberOfLines={1}>
        {item.summary.col1 || "—"}
      </Text>
      <Text style={styles.cell} numberOfLines={1}>
        {item.summary.col2 || "—"}
      </Text>
      <Text style={styles.cell} numberOfLines={1}>
        {item.summary.col3 || "—"}
      </Text>

      <TouchableOpacity
        style={styles.viewButton}
        activeOpacity={0.75}
        onPress={() =>
          navigation.navigate("ReportDetail", {
            title,
            row: item,
          })
        }
      >
        <Text style={styles.viewButtonText}>View</Text>
        <Ionicons name="arrow-forward" size={12} color={colors.textOnDark} />
      </TouchableOpacity>
    </View>
  );

  return (
    <TechnicianLayout
      navigation={navigation}
      activeRoute="Reports"
      isAdmin={isAdmin}
    >
      <View style={styles.headerBar}>
        <View style={styles.headerBarInner}>
          <View style={styles.headerTextGroup}>
            <Text style={styles.headerTitle}>{title || "Report"}</Text>
            <Text style={styles.headerSubtitle}>
              {loading
                ? "Loading…"
                : `${rows.length} ${rows.length === 1 ? "record" : "records"}`}
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
        <>
          <FlatList
            data={pagedRows}
            keyExtractor={(item, index) => String(item.id || index)}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={pagedRows.length > 0 ? renderHeaderRow : null}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                {!!errorMessage && (
                  <>
                    <Text style={styles.errorTitle}>Unable to load report</Text>
                    <Text style={styles.emptyMessage}>{errorMessage}</Text>
                    <TouchableOpacity
                      style={styles.retryButton}
                      onPress={loadReport}
                    >
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

          {rows.length > PAGE_SIZE && (
            <View style={styles.paginationBar}>
              <TouchableOpacity
                style={[
                  styles.pageButton,
                  page === 1 && styles.pageButtonDisabled,
                ]}
                onPress={goToPreviousPage}
                disabled={page === 1}
              >
                <Ionicons
                  name="chevron-back"
                  size={16}
                  color={page === 1 ? colors.textFaint : colors.blue}
                />
                <Text
                  style={[
                    styles.pageButtonText,
                    page === 1 && styles.pageButtonTextDisabled,
                  ]}
                >
                  Previous
                </Text>
              </TouchableOpacity>

              <Text style={styles.pageIndicator}>
                Page {page} of {totalPages}
              </Text>

              <TouchableOpacity
                style={[
                  styles.pageButton,
                  page === totalPages && styles.pageButtonDisabled,
                ]}
                onPress={goToNextPage}
                disabled={page === totalPages}
              >
                <Text
                  style={[
                    styles.pageButtonText,
                    page === totalPages && styles.pageButtonTextDisabled,
                  ]}
                >
                  Next
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={page === totalPages ? colors.textFaint : colors.blue}
                />
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </TechnicianLayout>
  );
}
