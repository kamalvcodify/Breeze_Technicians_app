import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AuthCard from '../components/AuthCard';
import AppInput from '../components/AppInput';
import AppButton from '../components/AppButton';
import AppPopup from '../components/AppPopup';

import { checkEmailExists, loginUser } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { isValidEmail, normalizeEmail, getAuthErrorMessage } from '../utils/validation';

import styles from '../styles/AuthCard.styles';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailChecked, setEmailChecked] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [checking, setChecking] = useState(false);
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
      setEmailChecked(true);
      setEmailExists(exists);

      if (!exists) {
        setShowNotFoundPopup(true);
      }
    } catch (err) {
      setError(getAuthErrorMessage(err, 'Something went wrong while checking the email. Please try again.'));
    } finally {
      setChecking(false);
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
      // response.data => { token, email, isAdmin } - AppNavigator switches stacks automatically
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
    setPassword('');
    setError('');
  };

  const showPasswordStep = emailChecked && emailExists;

  return (
    <>
      <AuthCard
        title="Login"
        subtitle={
          showPasswordStep
            ? 'Enter your password to continue.'
            : 'Enter your email to get started.'
        }
      >
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

        {showPasswordStep && (
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

        {!showPasswordStep ? (
          <AppButton title="Continue" onPress={handleContinue} loading={checking} />
        ) : (
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
