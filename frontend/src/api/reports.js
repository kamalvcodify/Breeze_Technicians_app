import apiClient from './client';

export const getReport = (reportKey) => {
  return apiClient.get(`/reports/${reportKey}`);
};