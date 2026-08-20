import apiClient from './client';

/**
 * api/simpleShift.js
 * ----------------------------------------------------------------
 * technicianName now required in the request body - the backend
 * needs it to search/create the Zoho CRM "Login" module record
 * (matched by Name + Record_Date, same as the reference Deluge
 * logic). The JWT only carries email/isAdmin, not name, so this is
 * sent explicitly from the frontend's already-available useAuth()
 * profile instead of requiring an extra backend lookup per toggle.
 * ----------------------------------------------------------------
 */
export const startSimpleShift = (technicianName) =>
  apiClient.post('/simple-shift/start', { technicianName });

export const endSimpleShift = (technicianName) =>
  apiClient.post('/simple-shift/end', { technicianName });