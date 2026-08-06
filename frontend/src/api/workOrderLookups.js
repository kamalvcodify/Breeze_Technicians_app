import apiClient from './client';

export function getProperties() {
  return apiClient.get(
    '/work-orders/lookups/properties'
  );
}

export function searchProperties(query) {
  return apiClient.get(
    '/work-orders/lookups/properties/search',
    {
      params: {
        q: query,
      },
    }
  );
}

export function getUnitsByProperty(propertyId) {
  return apiClient.get(
    `/work-orders/lookups/properties/${propertyId}/units`
  );
}

export function searchUnitsByProperty(
  propertyId,
  query
) {
  return apiClient.get(
    `/work-orders/lookups/properties/${propertyId}/units/search`,
    {
      params: {
        q: query,
      },
    }
  );
}