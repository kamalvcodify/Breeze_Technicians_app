import { submitWorkOrder } from './workOrders';
import { submitRehabOrder } from './rehabOrders';
import { submitCheckInOut } from './checkInOut';
import { submitMoveOut } from './moveOut';
import { submitRentReadyChecklist } from './rentReadyChecklist';

/**
 * api/offlineFormRegistry.js
 * ----------------------------------------------------------------
 * Maps a plain string key (stored in the offline queue) to the
 * REAL submit function that already works and already syncs to
 * Zoho when online. This is the one place that connects the
 * generic offline queue back to actual form submission - the
 * queue itself never imports or knows about these functions
 * directly, since function references can't be serialized into
 * AsyncStorage.
 *
 * Adding a 6th form later means adding one line here - nothing
 * else in the offline system needs to change.
 * ----------------------------------------------------------------
 */
export const OFFLINE_FORM_REGISTRY = {
  workOrder: submitWorkOrder,
  rehabOrder: submitRehabOrder,
  checkInOut: submitCheckInOut,
  moveOut: submitMoveOut,
  rentReadyChecklist: submitRentReadyChecklist,
};

export function getSubmitFunctionForFormType(formType) {
  return OFFLINE_FORM_REGISTRY[formType] || null;
}