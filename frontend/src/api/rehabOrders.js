import { Platform } from "react-native";

import apiClient from "./client";

/**
 * api/rehabOrders.js
 * ----------------------------------------------------------------
 * Rewritten to build real multipart/form-data, matching the same
 * fix already proven working on api/workOrders.js:
 *   - On web: fetch()es the attachment's own URI and converts it
 *     to a real Blob (RN's {uri,name,type} FormData shorthand does
 *     NOT work in a real browser - it silently stringifies to
 *     "[object Object]", sending zero actual file bytes).
 *   - On native: unchanged, uses RN's {uri, name, type} shorthand.
 *
 * File parts are named `order_{orderIndex}_attachment_{fileIndex}`
 * - rehabOrderController.js's getOrderAttachments() extracts files
 *   by this exact prefix.
 * ----------------------------------------------------------------
 */
async function appendAttachment(
  formData,
  attachment,
  orderIndex,
  attachmentIndex,
) {
  const fieldName = `order_${orderIndex}` + `_attachment_${attachmentIndex}`;

  if (Platform.OS === "web") {
    const response = await fetch(attachment.uri);

    const blob = await response.blob();

    formData.append(fieldName, blob, attachment.name);

    return;
  }

  formData.append(fieldName, {
    uri: attachment.uri,
    name: attachment.name,
    type: attachment.mimeType || "application/octet-stream",
  });
}

export async function submitRehabOrder(orders) {
  const formData = new FormData();

  const ordersForJson = orders.map(({ attachments, ...rest }) => rest);

  formData.append("orders", JSON.stringify(ordersForJson));

  for (let orderIndex = 0; orderIndex < orders.length; orderIndex += 1) {
    const order = orders[orderIndex];

    const attachments = order.attachments || [];

    for (
      let attachmentIndex = 0;
      attachmentIndex < attachments.length;
      attachmentIndex += 1
    ) {
      // eslint-disable-next-line no-await-in-loop
      await appendAttachment(
        formData,
        attachments[attachmentIndex],
        orderIndex,
        attachmentIndex,
      );
    }
  }

  return apiClient.post("/rehab-orders", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },

    timeout: 60000,
  });
}
