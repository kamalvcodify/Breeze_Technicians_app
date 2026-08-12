import apiClient from './client';

/**
 * api/moveOut.js
 * ----------------------------------------------------------------
 * Real, working call - the backend route below actually syncs to
 * Zoho Creator (same pattern as workOrders.js / rehabOrders.js).
 * ----------------------------------------------------------------
 */
export const submitMoveOut = (payload) => {
  return apiClient.post('/move-out', payload);
};