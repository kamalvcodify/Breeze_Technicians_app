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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AppInput from '../components/AppInput';
import AppButton from '../components/AppButton';
import TechnicianLayout from '../components/TechnicianLayout';

import { addUser, listUsers } from '../api/admin';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

import styles from '../styles/AdminPanelScreen.styles';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AdminPanelScreen({ navigation }) {
  const { email: adminEmail } = useAuth();

  const [email, setEmail] = useState('');
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

  const handleAddUser = async () => {
    setFormError('');
    setFormSuccess('');

    if (!isValidEmail(email)) {
      setFormError('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await addUser(email.trim().toLowerCase(), isAdminUser);
      setFormSuccess(response.data.detail || 'User added successfully.');
      setEmail('');
      setIsAdminUser(false);
      await fetchUsers();
    } catch (err) {
      const message = err?.response?.data?.detail || 'Could not add user. Please try again.';
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <TechnicianLayout navigation={navigation} isAdmin>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
          <View style={styles.pageHeader}>
            <View style={styles.pageHeaderInner}>
              <Text style={styles.headerEyebrow}>ADMINISTRATOR</Text>
              <Text style={styles.headerTitle}>Admin Panel</Text>
              <Text style={styles.headerSubtitle}>Signed in as {adminEmail}</Text>
            </View>
          </View>

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
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="technician@example.com"
                keyboardType="email-address"
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
                      <Text style={styles.userEmail}>{item.email}</Text>
                      <View style={[styles.badge, item.isAdmin ? styles.badgeAdmin : styles.badgeTech]}>
                        <Ionicons
                          name={item.isAdmin ? 'shield-checkmark' : 'construct-outline'}
                          size={11}
                          color={colors.primary}
                        />
                        <Text style={styles.badgeText}>{item.isAdmin ? 'Admin' : 'Technician'}</Text>
                      </View>
                    </View>
                  )}
                />
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TechnicianLayout>
  );
}