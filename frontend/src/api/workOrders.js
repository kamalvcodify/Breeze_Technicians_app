import apiClient from './client';

function appendAttachment(
  formData,
  attachment,
  ticketIndex,
  attachmentIndex
) {
  const fieldName =
    `ticket_${ticketIndex}` +
    `_attachment_${attachmentIndex}`;

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

export function submitWorkOrder(
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

  tickets.forEach(
    (ticket, ticketIndex) => {
      (
        ticket.attachments || []
      ).forEach(
        (
          attachment,
          attachmentIndex
        ) => {
          appendAttachment(
            formData,
            attachment,
            ticketIndex,
            attachmentIndex
          );
        }
      );
    }
  );

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