const axios = require("axios");
const config = require("../config/env");
const { getAccessToken } = require("./zohoAuthService");

const { ownerName, appLinkName, usersFormLinkName, usersReportLinkName, fields } = config.zoho;

function assertZohoAppConfigured() {
  if (!ownerName || !appLinkName) {
    throw new Error(
      "Zoho Creator app is not configured. Set ZOHO_OWNER_NAME and ZOHO_APP_LINK_NAME " +
        "in backend/.env (from your Creator app URL: creator.zoho.com/<owner>/<app>)."
    );
  }
}

async function zohoRequest(method, path, { params, data } = {}) {
  assertZohoAppConfigured();
  const accessToken = await getAccessToken();
  const url = `${config.zoho.apiDomain}/creator/v2.1/data/${ownerName}/${appLinkName}${path}`;

  const response = await axios({
    method,
    url,
    params,
    data,
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });

  return response.data;
}

function criteriaForEmail(email) {
  const safeEmail = email.replace(/"/g, '\\"');
  return `(${fields.email} == "${safeEmail}")`;
}

function isNoRecordsError(err) {
  if (!err.response) return false;
  if (err.response.status === 204 || err.response.status === 404) return true;

  const code = err.response.data && err.response.data.code;
  return code === 3100 || code === 9280;
}

async function findUserByEmail(email) {
  try {
    const result = await zohoRequest("get", `/report/${usersReportLinkName}`, {
      params: { criteria: criteriaForEmail(email) },
    });

    const records = result && result.data ? result.data : [];
    if (!records.length) return null;
    return records[0];
  } catch (err) {
    if (isNoRecordsError(err)) return null;
    throw err;
  }
}

async function listUsers() {
  try {
    const result = await zohoRequest("get", `/report/${usersReportLinkName}`);
    return result && result.data ? result.data : [];
  } catch (err) {
    if (isNoRecordsError(err)) return [];
    throw err;
  }
}

/**
 * createUser
 * ----------------------------------------------------------------
 * FIX: this previously referenced `field.name` / `field.city`
 * (singular, undefined) instead of `fields.name` / `fields.city`
 * (plural - the actual destructured config object at the top of
 * this file) - that typo is exactly what threw "field is not
 * defined". config.zoho.fields already has both `name` and `city`
 * mapped correctly in env.js, so no config change was needed, just
 * this one reference fixed.
 * ----------------------------------------------------------------
 */
async function createUser({ name, city, email, passwordHash, isAdmin }) {
  const payload = {
    data: {
      [fields.email]: email,
      [fields.name]: name,
      [fields.city]: city,
      [fields.password]: passwordHash,
      [fields.isAdmin]: isAdmin ? "Yes" : "No",
    },
  };

  const result = await zohoRequest("post", `/form/${usersFormLinkName}`, { data: payload });
  return result;
}

async function updateUserTermsAccepted(recordId, accepted) {
  const payload = {
    data: {
      [fields.termsAccepted]: accepted ? "Accepted" : "Not Accepted",
    },
  };

  const result = await zohoRequest(
    "patch",
    `/report/${usersReportLinkName}/${recordId}`,
    { data: payload }
  );
  return result;
}

async function updateUserPassword(recordId, newPasswordHash) {
  const payload = {
    data: {
      [fields.password]: newPasswordHash,
    },
  };

  const result = await zohoRequest(
    "patch",
    `/report/${usersReportLinkName}/${recordId}`,
    { data: payload }
  );
  return result;
}

module.exports = {
  findUserByEmail,
  listUsers,
  createUser,
  updateUserPassword,
  updateUserTermsAccepted,
};