/**
 * utils/distance.js
 * ----------------------------------------------------------------
 * Pure, dependency-free distance math. No React Native or Expo
 * imports here on purpose — this file can be unit tested in plain
 * Node, and reused later (e.g. on a future admin map) without
 * dragging in any location-permission or GPS code.
 * ----------------------------------------------------------------
 */

const EARTH_RADIUS_METERS = 6371000;

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculates the great-circle distance between two lat/lng points
 * using the haversine formula. Returns the distance in meters.
 *
 * This is the standard approach for short-to-medium distances
 * (a technician standing near a property) and is accurate enough
 * for a 150m geofence check without needing any paid API.
 */
export function getDistanceInMeters(pointA, pointB) {
  if (
    !pointA ||
    !pointB ||
    !Number.isFinite(pointA.latitude) ||
    !Number.isFinite(pointA.longitude) ||
    !Number.isFinite(pointB.latitude) ||
    !Number.isFinite(pointB.longitude)
  ) {
    return null;
  }

  const lat1 = toRadians(pointA.latitude);
  const lat2 = toRadians(pointB.latitude);
  const deltaLat = toRadians(pointB.latitude - pointA.latitude);
  const deltaLng = toRadians(pointB.longitude - pointA.longitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

/**
 * Formats a meter distance for display, switching to kilometers
 * once it gets large enough that meters stop being a useful unit.
 */
export function formatDistance(meters) {
  if (!Number.isFinite(meters)) {
    return 'Unknown distance';
  }

  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }

  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Checks whether a distance in meters is within the given radius.
 * Centralized here so the "150 metres" rule from the handover doc
 * lives in exactly one place.
 */
export function isWithinRadius(meters, radiusMeters) {
  if (!Number.isFinite(meters)) {
    return false;
  }

  return meters <= radiusMeters;
}