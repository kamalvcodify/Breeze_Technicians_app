import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AppInput from '../components/AppInput';
import AppSelect from '../components/AppSelect';
import AppButton from '../components/AppButton';
import TechnicianLayout from '../components/TechnicianLayout';

import {
  addUser,
  listUsers,
  deleteUser,
} from '../api/admin';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { CITY_OPTIONS } from '../constants/cityOptions';

import styles from '../styles/AdminPanelScreen.styles';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * screens/AdminPanelScreen.js
 * ----------------------------------------------------------------
 * Header now uses the same headerBar/headerBarInner/headerTextGroup
 * /headerIconBadge structure as every other screen (Home, Reports,
 * all 5 forms), replacing the old bespoke "ADMINISTRATOR eyebrow +
 * big title" layout. No other structural change.
 * ----------------------------------------------------------------
 */
export default function AdminPanelScreen({ navigation }) {
  const { email: adminEmail } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isValidEmail = (value) => EMAIL_PATTERN.test(value);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await listUsers();
      setUsers(response.data.users || []);
    } catch (err) {
      // Silently ignore here - the add-user flow surfaces errors where it matters more.
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoadingUsers(true);
      await fetchUsers();
      setLoadingUsers(false);
    })();
  }, [fetchUsers]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setCity('');
    setIsAdminUser(false);
  };

  const handleAddUser = async () => {
    setFormError('');
    setFormSuccess('');

    if (!name.trim()) {
      setFormError('Please enter the technician\u2019s name.');
      return;
    }

    if (!isValidEmail(email)) {
      setFormError('Please enter a valid email address.');
      return;
    }

    if (!city) {
      setFormError('Please select a city.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await addUser({
        email: email.trim().toLowerCase(),
        isAdmin: isAdminUser,
        name: name.trim(),
        city,
      });

      setFormSuccess(response.data.detail || 'User added successfully.');
      resetForm();
      await fetchUsers();
    } catch (err) {
      const message = err?.response?.data?.detail || 'Could not add user. Please try again.';
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const [actionError, setActionError] = useState('');

  /**
   * Delete confirmation - FIX: Alert.alert does not reliably show a
   * working confirm dialog on React Native Web (no real native
   * dialog to fall back to on some setups), which is why Delete
   * previously appeared to do nothing at all. Replaced with a real
   * custom Modal, matching the pattern already used elsewhere in
   * this app.
   */
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleRequestDelete = (user) => {
    setActionError('');
    setDeleteTarget(user);
  };

  const handleCancelDelete = () => {
    setDeleteTarget(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);

    try {
      await deleteUser(deleteTarget.id);

      // Optimistic update - remove immediately on success rather
      // than waiting on a fresh fetchUsers() re-fetch, which could
      // still show stale data due to Zoho's own eventual-consistency
      // lag after a write.
      setUsers((current) => current.filter((existing) => existing.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      const message = err?.response?.data?.detail || 'Could not delete this user. Please try again.';
      setActionError(message);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <TechnicianLayout navigation={navigation} isAdmin>
      <View style={styles.headerBar}>
        <View style={styles.headerBarInner}>
          <View style={styles.headerTextGroup}>
            <Text style={styles.headerTitle}>Admin Panel</Text>
            <Text style={styles.headerSubtitle}>Signed in as {adminEmail}</Text>
          </View>

          <View style={styles.headerIconBadge}>
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.blue} />
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
          <View style={styles.content}>
            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <View style={styles.cardIconBadge}>
                  <Ionicons name="person-add-outline" size={16} color={colors.blue} />
                </View>
                <Text style={styles.cardTitle}>Add a technician or admin</Text>
              </View>
              <Text style={styles.cardSubtitle}>
                A temporary password is generated automatically and emailed to them.
              </Text>

              <AppInput
                label="Name"
                value={name}
                onChangeText={setName}
                placeholder="Full name"
              />

              <AppInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="technician@example.com"
                keyboardType="email-address"
              />

              <AppSelect
                label="City"
                value={city}
                options={CITY_OPTIONS}
                onChange={setCity}
                placeholder="Select city"
              />

              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.switchLabel}>Make this user an admin</Text>
                  <Text style={styles.switchHint}>
                    Admins can log in and add other users. Leave off for technicians.
                  </Text>
                </View>
                <Switch
                  value={isAdminUser}
                  onValueChange={setIsAdminUser}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.white}
                />
              </View>

              {!!formError && (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={16} color={colors.error} />
                  <Text style={styles.errorText}>{formError}</Text>
                </View>
              )}
              {!!formSuccess && (
                <View style={styles.successBanner}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <Text style={styles.successText}>{formSuccess}</Text>
                </View>
              )}

              <AppButton title="Add user" onPress={handleAddUser} loading={submitting} />
            </View>

            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <View style={styles.cardIconBadge}>
                  <Ionicons name="people-outline" size={16} color={colors.blue} />
                </View>
                <Text style={styles.cardTitle}>Existing users</Text>
              </View>

              {!!actionError && (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={16} color={colors.error} />
                  <Text style={styles.errorText}>{actionError}</Text>
                </View>
              )}

              {loadingUsers ? (
                <Text style={styles.emptyStateText}>Loading users…</Text>
              ) : users.length === 0 ? (
                <Text style={styles.emptyStateText}>No users yet.</Text>
              ) : (
                <FlatList
                  data={users}
                  keyExtractor={(item) => String(item.id)}
                  scrollEnabled={false}
                  ItemSeparatorComponent={() => <View style={styles.separator} />}
                  renderItem={({ item }) => (
                    <View style={styles.userRow}>
                      <View style={styles.userInfo}>
                        <Text style={styles.userName} numberOfLines={1}>
                          {item.name || item.email}
                        </Text>
                        <Text style={styles.userMeta} numberOfLines={1}>
                          {item.email}
                          {item.city ? `  \u00b7  ${item.city}` : ''}
                        </Text>
                      </View>

                      <View style={[styles.badge, item.isAdmin ? styles.badgeAdmin : styles.badgeTech]}>
                        <Ionicons
                          name={item.isAdmin ? 'shield-checkmark' : 'construct-outline'}
                          size={11}
                          color={colors.primary}
                        />
                        <Text style={styles.badgeText}>{item.isAdmin ? 'Admin' : 'Technician'}</Text>
                      </View>

                      <View style={styles.userActionsRow}>
                        <TouchableOpacity
                          style={styles.userActionButton}
                          onPress={() => handleRequestDelete(item)}
                          activeOpacity={0.75}
                        >
                          <Ionicons name="trash-outline" size={16} color={colors.error} />
                          <Text style={[styles.userActionButtonText, styles.userActionButtonTextDanger]}>
                            Delete
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                />
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* NEW - real confirm modal, replacing Alert.alert (which
          does not reliably work on React Native Web). */}
      <Modal
        visible={!!deleteTarget}
        transparent
        animationType="fade"
        onRequestClose={handleCancelDelete}
      >
        <View style={styles.confirmBackdrop}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Delete user?</Text>
            <Text style={styles.confirmMessage}>
              This will permanently remove{' '}
              {deleteTarget?.name || deleteTarget?.email} from Zoho. This cannot be undone.
            </Text>

            <View style={styles.confirmButtonRow}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmButtonCancel]}
                onPress={handleCancelDelete}
                disabled={deleting}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmButtonCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmButtonDelete]}
                onPress={handleConfirmDelete}
                disabled={deleting}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmButtonDeleteText}>
                  {deleting ? 'Deleting…' : 'Delete'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </TechnicianLayout>
  );
}