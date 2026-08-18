import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AuthCard from '../components/AuthCard';
import AppInput from '../components/AppInput';
import AppButton from '../components/AppButton';
import AppPopup from '../components/AppPopup';
import TermsAcceptanceCard from '../components/TermsAcceptanceCard';

import { checkEmailExists, loginUser, acceptTerms } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { isValidEmail, normalizeEmail, getAuthErrorMessage } from '../utils/validation';

import styles from '../styles/AuthCard.styles';

/**
 * screens/LoginScreen.js
 * ----------------------------------------------------------------
 * NEW: Terms & Conditions gate, added between the email-check step
 * and the password step. /auth/check-email now also returns
 * termsAccepted - if false, TermsAcceptanceCard renders IN PLACE OF
 * the password field, blocking progress until "I Accept" is
 * tapped. If termsAccepted is already true, this is skipped
 * entirely and the flow is unchanged from before.
 * ----------------------------------------------------------------
 */
export default function LoginScreen({ navigation }) {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailChecked, setEmailChecked] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [termsRequired, setTermsRequired] = useState(false);
  const [checking, setChecking] = useState(false);
  const [acceptingTerms, setAcceptingTerms] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [error, setError] = useState('');
  const [showNotFoundPopup, setShowNotFoundPopup] = useState(false);

  const handleContinue = async () => {
    setError('');

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setChecking(true);
    try {
      const response = await checkEmailExists(normalizeEmail(email));
      const exists = !!response.data.exists;
      const termsAccepted = !!response.data.termsAccepted;

      if (!exists) {
        setShowNotFoundPopup(true);
        return;
      }

      if (!termsAccepted) {
        setTermsRequired(true);
        return;
      }

      setEmailChecked(true);
      setEmailExists(true);
    } catch (err) {
      setError(getAuthErrorMessage(err, 'Something went wrong while checking the email. Please try again.'));
    } finally {
      setChecking(false);
    }
  };

  const handleAcceptTerms = async () => {
    setError('');
    setAcceptingTerms(true);
    try {
      await acceptTerms(normalizeEmail(email));
      setTermsRequired(false);
      setEmailChecked(true);
      setEmailExists(true);
    } catch (err) {
      setError(getAuthErrorMessage(err, 'Could not save your acceptance. Please try again.'));
    } finally {
      setAcceptingTerms(false);
    }
  };

  const handleLogin = async () => {
    setError('');

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoggingIn(true);
    try {
      const response = await loginUser(normalizeEmail(email), password);
      // response.data => { token, email, isAdmin, name, city } - AppNavigator switches stacks automatically
      await login(response.data);
    } catch (err) {
      setError(getAuthErrorMessage(err, 'Incorrect email or password. Please try again.'));
    } finally {
      setLoggingIn(false);
    }
  };

  const handleChangeEmail = () => {
    setEmailChecked(false);
    setEmailExists(false);
    setTermsRequired(false);
    setPassword('');
    setError('');
  };

  const showPasswordStep = emailChecked && emailExists;

  return (
    <>
      <AuthCard
        title="Login"
        subtitle={
          termsRequired
            ? 'Please review and accept the Terms & Conditions to continue.'
            : showPasswordStep
              ? 'Enter your password to continue.'
              : 'Enter your email to get started.'
        }
      >
        {!termsRequired && (
          <AppInput
            label="Email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (emailChecked) handleChangeEmail();
            }}
            placeholder="you@example.com"
            keyboardType="email-address"
          />
        )}

        {termsRequired && (
          <TermsAcceptanceCard
            onAccept={handleAcceptTerms}
            onDecline={handleChangeEmail}
            accepting={acceptingTerms}
          />
        )}

        {!termsRequired && showPasswordStep && (
          <AppInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
          />
        )}

        {!!error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {!termsRequired && !showPasswordStep && (
          <AppButton title="Continue" onPress={handleContinue} loading={checking} />
        )}

        {!termsRequired && showPasswordStep && (
          <>
            <AppButton title="Login" onPress={handleLogin} loading={loggingIn} />
            <View style={styles.linksRow}>
              <AppButton
                title="Forgot password?"
                variant="text"
                onPress={() =>
                  navigation.navigate('ForgotPassword', {
                    email: normalizeEmail(email),
                  })
                }
              />
              <AppButton
                title="Use a different email"
                variant="text"
                onPress={handleChangeEmail}
              />
            </View>
          </>
        )}
      </AuthCard>

      <AppPopup
        visible={showNotFoundPopup}
        title="Email not found"
        message="We couldn't find an account for this email. Ask your admin to add you, or sign up below."
        primaryLabel="Go to signup"
        onPrimaryPress={() => {
          setShowNotFoundPopup(false);
          navigation.navigate('Signup', { email: normalizeEmail(email) });
        }}
        secondaryLabel="Try another email"
        onSecondaryPress={() => {
          setShowNotFoundPopup(false);
          handleChangeEmail();
        }}
        onClose={() => setShowNotFoundPopup(false)}
      />
    </>
  );
}