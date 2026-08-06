import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AuthCard from '../components/AuthCard';
import AppInput from '../components/AppInput';
import AppButton from '../components/AppButton';

import { signupUser } from '../api/auth';
import { colors } from '../theme/colors';
import { normalizeEmail, getAuthErrorMessage, MIN_PASSWORD_LENGTH } from '../utils/validation';

import styles from '../styles/AuthCard.styles';

// NOTE: In the primary business flow, users are created by an Admin via the
// Admin Panel (which auto-generates a temp password and emails it). This
// screen exists to satisfy the "email not found -> signup" flow already
// built into the Login screen, and always creates a non-admin account.
export default function SignupScreen({ route, navigation }) {
  const [email, setEmail] = useState(route?.params?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSignup = async () => {
    setError('');

    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await signupUser(normalizeEmail(email), password);
      navigation.navigate('Login');
    } catch (err) {
      setError(getAuthErrorMessage(err, 'Could not create account. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard title="Create account" subtitle="Sign up with your work email.">
      <AppInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
      />

      <AppInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="At least 8 characters"
        secureTextEntry
      />
      <Text style={styles.hintText}>Use at least {MIN_PASSWORD_LENGTH} characters.</Text>

      <AppInput
        label="Confirm password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Re-enter your password"
        secureTextEntry
      />

      {!!error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={16} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <AppButton title="Sign up" onPress={handleSignup} loading={submitting} />
      <AppButton
        title="Back to login"
        variant="text"
        onPress={() => navigation.navigate('Login')}
      />
    </AuthCard>
  );
}
