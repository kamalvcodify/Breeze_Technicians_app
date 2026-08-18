import React, { createContext, useContext, useEffect, useState } from 'react';

import { getAuthValue, setAuthValue, deleteAuthValue } from '../services/authStorage';
import { setAuthToken } from '../api/client';

const TOKEN_KEY = 'breeze_auth_token';
const IS_ADMIN_KEY = 'breeze_is_admin';
const EMAIL_KEY = 'breeze_user_email';
const NAME_KEY = 'breeze_user_name';
const CITY_KEY = 'breeze_user_city';

const AuthContext = createContext(null);

/**
 * context/AuthContext.js
 * ----------------------------------------------------------------
 * name/city added alongside the existing email/isAdmin - exact
 * same pattern (own storage key, restored on boot, set on login,
 * cleared on logout, exposed via context value). Every form's
 * createEmptyOrder()/createEmptyEntry() should now read these from
 * useAuth() to auto-fill Technician Name/City, instead of guessing
 * the name from the email address or defaulting City to a
 * hardcoded value.
 * ----------------------------------------------------------------
 */
export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [email, setEmail] = useState(null);
  const [name, setName] = useState(null);
  const [city, setCity] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const storedToken = await getAuthValue(TOKEN_KEY);
        if (storedToken) {
          const storedIsAdmin = await getAuthValue(IS_ADMIN_KEY);
          const storedEmail = await getAuthValue(EMAIL_KEY);
          const storedName = await getAuthValue(NAME_KEY);
          const storedCity = await getAuthValue(CITY_KEY);
          setToken(storedToken);
          setIsAdmin(storedIsAdmin === 'true');
          setEmail(storedEmail);
          setName(storedName);
          setCity(storedCity);
          setAuthToken(storedToken);
        }
      } finally {
        setInitializing(false);
      }
    })();
  }, []);

  const login = async ({
    token: nextToken,
    email: userEmail,
    isAdmin: admin,
    name: userName,
    city: userCity,
  }) => {
    setToken(nextToken);
    setEmail(userEmail);
    setIsAdmin(admin);
    setName(userName || '');
    setCity(userCity || '');
    setAuthToken(nextToken);

    await setAuthValue(TOKEN_KEY, nextToken);
    await setAuthValue(IS_ADMIN_KEY, String(admin));
    await setAuthValue(EMAIL_KEY, userEmail || '');
    await setAuthValue(NAME_KEY, userName || '');
    await setAuthValue(CITY_KEY, userCity || '');
  };

  const logout = async () => {
    setToken(null);
    setEmail(null);
    setIsAdmin(false);
    setName(null);
    setCity(null);
    setAuthToken(null);

    await deleteAuthValue(TOKEN_KEY);
    await deleteAuthValue(IS_ADMIN_KEY);
    await deleteAuthValue(EMAIL_KEY);
    await deleteAuthValue(NAME_KEY);
    await deleteAuthValue(CITY_KEY);
  };

  return (
    <AuthContext.Provider value={{ token, email, name, city, isAdmin, initializing, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}