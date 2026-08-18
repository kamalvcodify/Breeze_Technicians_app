const axios = require('axios');
const config = require('../config/env');
const { getAccessToken } = require('./zohoAuthService');

function assertCreatorConfigured() {
  if (!config.zoho.ownerName || !config.zoho.appLinkName) {
    const error = new Error(
      'Zoho Creator owner name or app link name is not configured.'
    );

    error.statusCode = 500;
    throw error;
  }
}

async function creatorRequest(method, path, options = {}) {
  assertCreatorConfigured();

  const accessToken = await getAccessToken();

  const url =
    `${config.zoho.apiDomain}/creator/v2.1/data/` +
    `${config.zoho.ownerName}/${config.zoho.appLinkName}${path}`;

  const response = await axios({
    method,
    url,
    params: options.params,
    data: options.data,
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });

  return response.data;
}

/**
 * creatorUploadFile
 * ----------------------------------------------------------------
 * NEW - shared multipart/form-data upload call, used for the
 * Upload File API (subform or top-level Image/file fields).
 * creatorRequest() above always sends application/json, so it
 * can't be reused for this - this is a separate function so every
 * form's Zoho service can share it once each form's image-upload
 * flow gets built (currently only zohoWorkOrderService.js uses
 * this).
 *
 * `formData` must be a `form-data` package instance (Node), NOT the
 * browser/RN FormData - the caller is responsible for building it
 * with a "file" field containing the image buffer.
 * ----------------------------------------------------------------
 */
async function creatorUploadFile(path, formData) {
  assertCreatorConfigured();

  const accessToken = await getAccessToken();

  const url =
    `${config.zoho.apiDomain}/creator/v2.1/data/` +
    `${config.zoho.ownerName}/${config.zoho.appLinkName}${path}`;

  const response = await axios.post(url, formData, {
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
      ...formData.getHeaders(),
    },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });

  return response.data;
}

module.exports = {
  creatorRequest,
  creatorUploadFile,
};