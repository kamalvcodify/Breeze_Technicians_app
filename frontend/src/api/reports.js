import apiClient from './client';

export const getReport = (reportKey) => {
  return apiClient.get(`/reports/${reportKey}`);
};

/**
 * getReportImage
 * ----------------------------------------------------------------
 * FIX: now takes a structured imageRef object (reportLinkName,
 * recordId, subformName, fieldName, subformRecordId) instead of a
 * single raw path string - matches Zoho's documented Download File
 * from Subform API shape, which the backend reconstructs into the
 * real download URL server-side. See components/ReportImage.js.
 * ----------------------------------------------------------------
 */
export const getReportImage = (imageRef) => {
  return apiClient.get('/reports/image', { params: imageRef });
};