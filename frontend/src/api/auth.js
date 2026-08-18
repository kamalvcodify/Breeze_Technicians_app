import apiClient from './client';

export const acceptTerms = (email) => apiClient.post('/auth/accept-terms', { email });
export const checkEmailExists = (email) => apiClient.post('/auth/check-email', { email });
export const loginUser = (email, password) => apiClient.post('/auth/login', { email, password });
export const signupUser = (email, password) => apiClient.post('/auth/signup', { email, password });
export const resetPassword = (email, tempPassword, newPassword) =>
  apiClient.post('/auth/forgot-password', {
    email,
    temp_password: tempPassword,
    new_password: newPassword,
  });


