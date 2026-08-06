import React, { useState } from 'react';
import { Text } from 'react-native';

import AuthCard from '../components/AuthCard';
import AppInput from '../components/AppInput';
import AppButton from '../components/AppButton';

import { resetPassword } from '../api/auth';
import { normalizeEmail, getAuthErrorMessage } from '../utils/validation';

import styles from '../styles/AuthCard.styles';

export default function ForgotPasswordScreen({ route, navigation }) {
  const [email, setEmail] = useState(route?.params?.email || '');
  const [tempPassword, setTempPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleReset = async () => {
    setError('');

    if (!email || !tempPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(normalizeEmail(email), tempPassword, newPassword);
      setSuccess(true);
    } catch (err) {
      setError(
        getAuthErrorMessage(
          err,
          'Could not reset password. Check the temporary password and try again.'
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Set your password"
      subtitle="Use the temporary password sent to your email by your admin."
    >
      {success ? (
        <>
          <Text style={styles.successText}>
            Your password has been updated. You can now log in.
          </Text>
          <AppButton title="Back to login" onPress={() => navigation.navigate('Login')} />
        </>
      ) : (
        <>
          <AppInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
          />
          <AppInput
            label="Temporary / current password"
            value={tempPassword}
            onChangeText={setTempPassword}
            placeholder="From your admin email"
            secureTextEntry
          />
          <AppInput
            label="New password"
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="At least 8 characters"
            secureTextEntry
          />
          <AppInput
            label="Confirm new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter new password"
            secureTextEntry
          />

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <AppButton title="Update password" onPress={handleReset} loading={submitting} />
          <AppButton
            title="Back to login"
            variant="text"
            onPress={() => navigation.navigate('Login')}
          />
        </>
      )}
    </AuthCard>
  );
}
