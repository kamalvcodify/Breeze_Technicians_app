import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import TechnicianLayout from "../components/TechnicianLayout";
import { getReport } from "../api/reports";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme/colors";
import styles from "../styles/ReportListScreen.styles";

/**
 * screens/ReportListScreen.js
 * ----------------------------------------------------------------
 * ONE generic list screen for all reports - reportKey and title
 * come from navigation params. Column headers come straight from
 * the backend response, so this screen has no per-report logic for
 * MOST reports.
 *
 * NEW: refetch-on-focus - reloads the report every time this screen
 * becomes focused (not just on first mount), via useFocusEffect.
 * This is what makes AppFolio-sourced updates/deletions actually
 * show up in the UI - the backend's local store is kept current by
 * a background sync (every 5 min) and daily reconciliation, but a
 * screen that only fetched once on mount would never see that
 * unless the user manually pulled to refresh. Applied to every
 * report, not just the new AppFolio one, for consistency.
 *
 * NEW: status filter - ONLY shown for reportKey === "appFolioWorkOrders"
 * (the one report with a genuinely useful status to filter by).
 * Filters the already-fetched rows client-side, same "fetch once,
 * slice for display" approach already used for pagination - no new
 * backend query needed.
 * ----------------------------------------------------------------
 */
const PAGE_SIZE = 15;

// NEW - while the screen stays open (no navigation away/back at
// all), this guarantees fresh data shows up within a bounded time,
// regardless of navigation behavior - useFocusEffect alone only
// refires when this screen regains focus, which never happens if
// you simply leave it open and wait.
const AUTO_REFRESH_INTERVAL_MS = 10 * 1000; 

const APPFOLIO_STATUS_OPTIONS = [
  "Open",
  "New",
  "New by AppFolio",
  "Assigned",
  "Assigned by AppFolio",
  "Scheduled",
  "Waiting",
  "Estimate Requested",
  "Estimated",
  "Work Done",
  "Ready to Bill",
  "Completed",
  "Completed No Need to Bill",
  "Canceled",
];

export default function ReportListScreen({ navigation, route }) {
  const { reportKey, title } = route.params || {};
  const { isAdmin } = useAuth();

  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState(null);

  const showStatusFilter = reportKey === "appFolioWorkOrders";

  const loadReport = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }
    setErrorMessage("");

    try {
      const response = await getReport(reportKey);
      setColumns(response.data?.columns || []);
      setRows(response.data?.rows || []);
      if (!silent) {
        setPage(1);
      }
    } catch (error) {
      if (!silent) {
        setColumns([]);
        setRows([]);
        setErrorMessage(
          error?.response?.data?.detail ||
            "Could not load this report. Please try again.",
        );
      } else {
        console.warn("[ReportListScreen] Silent auto-refresh failed:", error?.message);
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [reportKey]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  // Refetch every time this screen regains focus - e.g. navigating
  // away and back - so AppFolio-sourced updates/deletions (synced
  // in the background) actually show up without a manual refresh.
  useFocusEffect(
    useCallback(() => {
      loadReport();
    }, [loadReport]),
  );

  // NEW - ALSO refetch periodically while the screen stays mounted,
  // so simply leaving it open (never navigating away/back at all)
  // still picks up backend changes within AUTO_REFRESH_INTERVAL_MS,
  // rather than only ever showing the very first load.
  useEffect(() => {
    const intervalId = setInterval(() => {
      loadReport({ silent: true });
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [loadReport]);

  const filteredRows = useMemo(() => {
    if (!showStatusFilter || !statusFilter) {
      return rows;
    }
    return rows.filter((row) => row.status === statusFilter);
  }, [rows, showStatusFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));

  const pagedRows = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return filteredRows.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredRows, page]);

  const goToPreviousPage = () => {
    setPage((current) => Math.max(1, current - 1));
  };

  const goToNextPage = () => {
    setPage((current) => Math.min(totalPages, current + 1));
  };

  const handleSelectStatus = (status) => {
    setStatusFilter((current) => (current === status ? null : status));
    setPage(1);
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
                : `${filteredRows.length} ${filteredRows.length === 1 ? "record" : "records"}`}
            </Text>
          </View>

          <View style={styles.headerIconBadge}>
            <Ionicons name="bar-chart-outline" size={18} color={colors.blue} />
          </View>
        </View>
      </View>

      {/* NEW - status filter + FlatList/pagination merged into ONE
          wrapping container (styles.bodyWrapper), so the ancestor
          layout can't distribute leftover space BETWEEN them - see
          the comment on bodyWrapper in ReportListScreen.styles.js
          for why this fixes the inconsistent gap. */}
      <View style={styles.bodyWrapper}>
        {showStatusFilter && !loading && (
          <View style={styles.statusFilterRow}>
            {APPFOLIO_STATUS_OPTIONS.map((status) => {
              const isActive = statusFilter === status;
              return (
                <TouchableOpacity
                  key={status}
                  style={[styles.statusPill, isActive && styles.statusPillActive]}
                  onPress={() => handleSelectStatus(status)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      isActive && styles.statusPillTextActive,
                    ]}
                  >
                    {status}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

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

            {filteredRows.length > PAGE_SIZE && (
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
      </View>
    </TechnicianLayout>
  );
}