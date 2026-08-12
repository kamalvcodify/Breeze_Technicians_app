import apiClient from './client';

/**
 * api/checkInOut.js
 * ----------------------------------------------------------------
 * No Zoho/CRM sync yet - the backend route this hits only
 * console.logs the payload and responds with success. This is a
 * real, working call (not a placeholder like rehabOrders.js was
 * before its backend existed).
 * ----------------------------------------------------------------
 */
export const submitCheckInOut = (payload) => {
  return apiClient.post('/check-in-out', payload);
};