import { Platform } from 'react-native';

import apiClient from './client';

/**
 * api/workOrders.js
 * ----------------------------------------------------------------
 * FIX: React Native's FormData.append(name, { uri, name, type })
 * object shorthand is a NATIVE-ONLY convention - RN's own
 * networking layer specially recognizes that shape and converts it
 * into a real multipart file part. A real browser's FormData API
 * does not understand that shape at all - it silently stringifies
 * the object to the literal text "[object Object]", meaning NO
 * actual file bytes were ever being sent to the backend when
 * running on web. This is exactly why attachments never showed up
 * in Zoho despite the picker showing them attached in the UI.
 *
 * On web, appendAttachment() now fetch()es the attachment's own
 * URI (already a blob:/data: URI from AttachmentPicker.js's web
 * path) and calls .blob() on the response to get a REAL Blob
 * object, which FormData.append() on web actually understands.
 * Native (iOS/Android) is completely unchanged - it still needs
 * RN's {uri, name, type} shorthand.
 * ----------------------------------------------------------------
 */
async function appendAttachment(
  formData,
  attachment,
  ticketIndex,
  attachmentIndex
) {
  const fieldName =
    `ticket_${ticketIndex}` +
    `_attachment_${attachmentIndex}`;

  if (Platform.OS === 'web') {
    const response =
      await fetch(attachment.uri);

    const blob =
      await response.blob();

    formData.append(
      fieldName,
      blob,
      attachment.name
    );

    return;
  }

  /*
   * Native Android and iOS file structure.
   */
  formData.append(fieldName, {
    uri: attachment.uri,
    name: attachment.name,
    type:
      attachment.mimeType ||
      'application/octet-stream',
  });
}

export async function submitWorkOrder(
  tickets
) {
  const formData = new FormData();

  /*
   * The tickets metadata is sent as JSON.
   *
   * Actual file content is appended separately.
   */
  const ticketMetadata =
    tickets.map(
      (ticket, ticketIndex) => ({
        ...ticket,

        attachments:
          (
            ticket.attachments || []
          ).map(
            (
              attachment,
              attachmentIndex
            ) => ({
              fieldName:
                `ticket_${ticketIndex}` +
                `_attachment_${attachmentIndex}`,

              name:
                attachment.name,

              mimeType:
                attachment.mimeType,

              size:
                attachment.size,
            })
          ),
      })
    );

  formData.append(
    'tickets',
    JSON.stringify(ticketMetadata)
  );

  /*
   * appendAttachment is now async (web needs to await fetch()+
   * .blob()) - every attachment across every ticket must be fully
   * appended before the request is sent, so this loop is awaited
   * in order rather than the previous fire-and-forget forEach.
   */
  for (
    let ticketIndex = 0;
    ticketIndex < tickets.length;
    ticketIndex += 1
  ) {
    const ticket =
      tickets[ticketIndex];

    const attachments =
      ticket.attachments || [];

    for (
      let attachmentIndex = 0;
      attachmentIndex <
      attachments.length;
      attachmentIndex += 1
    ) {
      // eslint-disable-next-line no-await-in-loop
      await appendAttachment(
        formData,
        attachments[
          attachmentIndex
        ],
        ticketIndex,
        attachmentIndex
      );
    }
  }

  return apiClient.post(
    '/work-orders',
    formData,
    {
      headers: {
        'Content-Type':
          'multipart/form-data',
      },

      timeout: 60000,
    }
  );
}