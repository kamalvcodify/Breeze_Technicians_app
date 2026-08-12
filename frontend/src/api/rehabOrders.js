import apiClient from './client';

/**
 * api/rehabOrders.js
 * ----------------------------------------------------------------
 * PLACEHOLDER - the /rehab-orders endpoint does not exist on the
 * backend yet. This will fail with a 404 until the backend route,
 * controller, and Zoho service for Rehab Orders are built (the next
 * step after this frontend pass). Mirrors the exact shape of
 * api/workOrders.js's submitWorkOrder() so wiring up the real
 * endpoint later is a drop-in change, not a rewrite.
 * ----------------------------------------------------------------
 */
export const submitRehabOrder = (payload) => {
  return apiClient.post('/rehab-orders', payload);
};