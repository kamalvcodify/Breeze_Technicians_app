import apiClient from './client';

export const submitRentReadyChecklist = (payload) => {
  return apiClient.post('/rent-ready-checklist', payload);
};