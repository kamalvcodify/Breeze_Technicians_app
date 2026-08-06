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

module.exports = {
  creatorRequest,
};