import { Platform } from "react-native";

import apiClient from "./client";

/**
 * api/moveOut.js
 * ----------------------------------------------------------------
 * Rewritten to build real multipart/form-data - same fix already
 * proven on api/workOrders.js and api/rehabOrders.js. Move Out is
 * single-entry (no ticket/order index), so file parts are simply
 * named `attachment_{fileIndex}`.
 * ----------------------------------------------------------------
 */
async function appendAttachment(formData, attachment, attachmentIndex) {
  const fieldName = `attachment_${attachmentIndex}`;

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

export async function submitMoveOut(entry) {
  const formData = new FormData();

  const { attachments, ...entryForJson } = entry;

  formData.append("entry", JSON.stringify(entryForJson));

  const attachmentList = attachments || [];

  for (
    let attachmentIndex = 0;
    attachmentIndex < attachmentList.length;
    attachmentIndex += 1
  ) {
    // eslint-disable-next-line no-await-in-loop
    await appendAttachment(
      formData,
      attachmentList[attachmentIndex],
      attachmentIndex,
    );
  }

  return apiClient.post("/move-out", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },

    timeout: 60000,
  });
}
