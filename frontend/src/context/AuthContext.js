import React, { createContext, useContext, useEffect, useState } from 'react';

import { getAuthValue, setAuthValue, deleteAuthValue } from '../services/authStorage';
import { setAuthToken } from '../api/client';

const TOKEN_KEY = 'breeze_auth_token';
const IS_ADMIN_KEY = 'breeze_is_admin';
const EMAIL_KEY = 'breeze_user_email';

const AuthContext = createContext(null);

/**
 * context/AuthContext.js
 * ----------------------------------------------------------------
 * IMPORTANT: this must go through services/authStorage.js, never
 * call expo-secure-store directly.
 *
 * This was the root cause of the "can't log in on my phone" issue:
 * this file used to call SecureStore.setItemAsync/getItemAsync
 * directly. On some real devices / dev-client builds SecureStore's
 * native module fails to link correctly and throws
 * "_ExpoSecureStore.default.getValueWithKeyAsync is not a function"
 * — which happened here, inside login()/the startup check, with no
 * try/catch around it. That crashed the login flow before the app
 * ever got to the next screen, even though the credentials were
 * correct. authStorage.js already existed specifically to fall back
 * to AsyncStorage when this happens; this file just wasn't using it.
 * ----------------------------------------------------------------
 */
export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [email, setEmail] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const storedToken = await getAuthValue(TOKEN_KEY);
        if (storedToken) {
          const storedIsAdmin = await getAuthValue(IS_ADMIN_KEY);
          const storedEmail = await getAuthValue(EMAIL_KEY);
          setToken(storedToken);
          setIsAdmin(storedIsAdmin === 'true');
          setEmail(storedEmail);
          setAuthToken(storedToken);
        }
      } finally {
        setInitializing(false);
      }
    })();
  }, []);

  const login = async ({ token: nextToken, email: userEmail, isAdmin: admin }) => {
    setToken(nextToken);
    setEmail(userEmail);
    setIsAdmin(admin);
    setAuthToken(nextToken);

    await setAuthValue(TOKEN_KEY, nextToken);
    await setAuthValue(IS_ADMIN_KEY, String(admin));
    await setAuthValue(EMAIL_KEY, userEmail || '');
  };

  const logout = async () => {
    setToken(null);
    setEmail(null);
    setIsAdmin(false);
    setAuthToken(null);

    await deleteAuthValue(TOKEN_KEY);
    await deleteAuthValue(IS_ADMIN_KEY);
    await deleteAuthValue(EMAIL_KEY);
  };

  return (
    <AuthContext.Provider value={{ token, email, isAdmin, initializing, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
