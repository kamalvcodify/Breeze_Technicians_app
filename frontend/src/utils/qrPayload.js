/**
 * utils/qrPayload.js
 * ----------------------------------------------------------------
 * The QR codes used for Inventory Parts encode a link like:
 *   https://.../something?Part_Code=WAT-129&Parts_Inventory=zcrm_6315271000011603195
 * (or possibly just the query-string portion on its own, depending
 * on how Zoho generates the code) - this pulls Part_Code and
 * Parts_Inventory out of whatever was scanned, regardless of
 * whether it's a full URL or a bare query string.
 * ----------------------------------------------------------------
 */
export function parseInventoryQrValue(scannedValue) {
  if (!scannedValue) {
    return { partCode: '', partsInventory: '' };
  }

  const queryIndex = scannedValue.indexOf('?');
  const queryString =
    queryIndex !== -1 ? scannedValue.slice(queryIndex + 1) : scannedValue;

  const params = new URLSearchParams(queryString);

  return {
    partCode: params.get('Part_Code') || '',
    partsInventory: params.get('Parts_Inventory') || '',
  };
}