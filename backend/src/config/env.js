require("dotenv").config();

function required(name, fallback = "") {
  const value = process.env[name];

  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return fallback;
  }

  return value;
}

function numberValue(
  name,
  fallback
) {
  const value = Number(
    process.env[name]
  );

  return Number.isFinite(value)
    ? value
    : fallback;
}

function ticketFields(prefix) {
  return {
    enabled: required(
      `ZOHO_WORK_ORDER_${prefix}_ENABLED`
    ),

    ticketId: required(
      `ZOHO_WORK_ORDER_${prefix}_TICKET_ID`
    ),

    city: required(
      `ZOHO_WORK_ORDER_${prefix}_CITY`
    ),

    technicianName: required(
      `ZOHO_WORK_ORDER_${prefix}_TECHNICIAN_NAME`
    ),

    property: required(
      `ZOHO_WORK_ORDER_${prefix}_PROPERTY`
    ),

    unit: required(
      `ZOHO_WORK_ORDER_${prefix}_UNIT`
    ),

    status: required(
      `ZOHO_WORK_ORDER_${prefix}_STATUS`
    ),

    clockIn: required(
      `ZOHO_WORK_ORDER_${prefix}_CLOCK_IN`
    ),

    clockOut: required(
      `ZOHO_WORK_ORDER_${prefix}_CLOCK_OUT`
    ),

    jobType: required(
      `ZOHO_WORK_ORDER_${prefix}_JOB_TYPE`
    ),

    date: required(
      `ZOHO_WORK_ORDER_${prefix}_DATE`
    ),

    workDetails: required(
      `ZOHO_WORK_ORDER_${prefix}_WORK_DETAILS`
    ),

    attachmentsSubform: required(
      `ZOHO_WORK_ORDER_${prefix}_ATTACHMENTS_SUBFORM`
    ),

    attachmentField: required(
      `ZOHO_WORK_ORDER_${prefix}_ATTACHMENT_FIELD`,
      "Image"
    ),

    topLevelAttachmentField: required(
      `ZOHO_WORK_ORDER_${prefix}_TOP_LEVEL_ATTACHMENT_FIELD`
    ),
  };
}

const config = {
  port: numberValue(
    "PORT",
    5000
  ),

  jwt: {
    secret: required(
      "JWT_SECRET",
      "insecure-dev-secret-change-me"
    ),

    expiresIn: required(
      "JWT_EXPIRES_IN",
      "7d"
    ),
  },

  zoho: {
    accountsDomain: required(
      "ZOHO_ACCOUNTS_DOMAIN",
      "https://accounts.zoho.com"
    ),

    apiDomain: required(
      "ZOHO_API_DOMAIN",
      "https://www.zohoapis.com"
    ),

    clientId: required(
      "ZOHO_CLIENT_ID"
    ),

    clientSecret: required(
      "ZOHO_CLIENT_SECRET"
    ),

    refreshToken: required(
      "ZOHO_REFRESH_TOKEN"
    ),

    /*
     * Zoho Creator configuration
     */
    ownerName: required(
      "ZOHO_OWNER_NAME"
    ),

    appLinkName: required(
      "ZOHO_APP_LINK_NAME"
    ),

    usersFormLinkName: required(
      "ZOHO_USERS_FORM_LINK_NAME",
      "Users"
    ),

    usersReportLinkName: required(
      "ZOHO_USERS_REPORT_LINK_NAME",
      "Users_Report"
    ),

    fields: {
      email: required(
        "ZOHO_FIELD_EMAIL",
        "User_Email"
      ),

      password: required(
        "ZOHO_FIELD_PASSWORD",
        "Password"
      ),

      isAdmin: required(
        "ZOHO_FIELD_IS_ADMIN",
        "Is_Admin"
      ),
    },

    /*
     * Zoho Creator Work Order configuration
     */
    workOrder: {
      formLinkName: required(
        "ZOHO_WORK_ORDER_FORM_LINK_NAME",
        "Work_Order"
      ),

      reportLinkName: required(
        "ZOHO_WORK_ORDER_REPORT_LINK_NAME",
        "All_Work_Orders"
      ),

      emailField: required(
        "ZOHO_WORK_ORDER_FIELD_EMAIL",
        "Email"
      ),

      tickets: {
        ticket1:
          ticketFields("T1"),

        ticket2:
          ticketFields("T2"),

        ticket3:
          ticketFields("T3"),
      },
    },

    /*
     * Zoho CRM configuration
     *
     * This must remain inside the zoho object because
     * zohoCrmService reads config.zoho.crm.
     */
    crm: {
      apiVersion: required(
        "ZOHO_CRM_API_VERSION",
        "v2"
      ),

      propertyModule: required(
        "ZOHO_CRM_PROPERTY_MODULE",
        "Products"
      ),

      propertyFields: {
        name: required(
          "ZOHO_CRM_PROPERTY_NAME_FIELD",
          "Product_Name"
        ),

        address: required(
          "ZOHO_CRM_PROPERTY_ADDRESS_FIELD",
          "Property_Address"
        ),

        active: required(
          "ZOHO_CRM_PROPERTY_ACTIVE_FIELD",
          "Product_Active"
        ),
      },

      unitModule: required(
        "ZOHO_CRM_UNIT_MODULE",
        "Units"
      ),

      unitFields: {
        name: required(
          "ZOHO_CRM_UNIT_NAME_FIELD",
          "Name"
        ),

        property: required(
          "ZOHO_CRM_UNIT_PROPERTY_FIELD",
          "Property"
        ),
      },

      lookupPageSize: numberValue(
        "ZOHO_CRM_LOOKUP_PAGE_SIZE",
        200
      ),

      propertyCacheTtlMs:
        numberValue(
          "ZOHO_CRM_PROPERTY_CACHE_TTL_MS",
          15 * 60 * 1000
        ),

      unitCacheTtlMs:
        numberValue(
          "ZOHO_CRM_UNIT_CACHE_TTL_MS",
          10 * 60 * 1000
        ),
    },

    /*
     * Zoho Creator Tracking configuration (Technician Shift feature)
     *
     * NOTE: These are PLACEHOLDER field/form names. The actual Zoho
     * Creator forms for "Technician Login/Logout Activity" and
     * "Technician Location Logs" have not been built yet (see
     * handover doc Section 23 - "Proposed Tracking Data Storage").
     * Once those Creator forms exist, update the corresponding
     * ZOHO_TRACKING_* values in .env - no code changes should be
     * needed elsewhere since trackingService.js only reads field
     * names from here.
     */
    tracking: {
      sessionFormLinkName: required(
        "ZOHO_TRACKING_SESSION_FORM_LINK_NAME",
        "Technician_Shift_Sessions"
      ),

      sessionFields: {
        technicianName: required(
          "ZOHO_TRACKING_FIELD_TECHNICIAN_NAME",
          "Technician"
        ),
        technicianEmail: required(
          "ZOHO_TRACKING_FIELD_TECHNICIAN_EMAIL",
          "Technician_Email"
        ),
        workOrder: required(
          "ZOHO_TRACKING_FIELD_WORK_ORDER",
          "Work_Order"
        ),
        loginTime: required(
          "ZOHO_TRACKING_FIELD_LOGIN_TIME",
          "Login_Time"
        ),
        breakStart: required(
          "ZOHO_TRACKING_FIELD_BREAK_START",
          "Break_Start"
        ),
        breakEnd: required(
          "ZOHO_TRACKING_FIELD_BREAK_END",
          "Break_End"
        ),
        logoutTime: required(
          "ZOHO_TRACKING_FIELD_LOGOUT_TIME",
          "Logout_Time"
        ),
        status: required(
          "ZOHO_TRACKING_FIELD_STATUS",
          "Status"
        ),
        startLatitude: required(
          "ZOHO_TRACKING_FIELD_START_LATITUDE",
          "Start_Latitude"
        ),
        startLongitude: required(
          "ZOHO_TRACKING_FIELD_START_LONGITUDE",
          "Start_Longitude"
        ),
        endLatitude: required(
          "ZOHO_TRACKING_FIELD_END_LATITUDE",
          "End_Latitude"
        ),
        endLongitude: required(
          "ZOHO_TRACKING_FIELD_END_LONGITUDE",
          "End_Longitude"
        ),
      },

      locationLogFormLinkName: required(
        "ZOHO_TRACKING_LOCATION_LOG_FORM_LINK_NAME",
        "Technician_Location_Logs"
      ),

      locationLogFields: {
        technicianName: required(
          "ZOHO_TRACKING_LOG_FIELD_TECHNICIAN_NAME",
          "Technician"
        ),
        technicianEmail: required(
          "ZOHO_TRACKING_LOG_FIELD_TECHNICIAN_EMAIL",
          "Technician_Email"
        ),
        session: required(
          "ZOHO_TRACKING_LOG_FIELD_SESSION",
          "Tracking_Session"
        ),
        workOrder: required(
          "ZOHO_TRACKING_LOG_FIELD_WORK_ORDER",
          "Work_Order"
        ),
        latitude: required(
          "ZOHO_TRACKING_LOG_FIELD_LATITUDE",
          "Latitude"
        ),
        longitude: required(
          "ZOHO_TRACKING_LOG_FIELD_LONGITUDE",
          "Longitude"
        ),
        accuracy: required(
          "ZOHO_TRACKING_LOG_FIELD_ACCURACY",
          "Accuracy"
        ),
        recordedTime: required(
          "ZOHO_TRACKING_LOG_FIELD_RECORDED_TIME",
          "Recorded_Time"
        ),
        trackingStatus: required(
          "ZOHO_TRACKING_LOG_FIELD_TRACKING_STATUS",
          "Tracking_Status"
        ),
        devicePlatform: required(
          "ZOHO_TRACKING_LOG_FIELD_DEVICE_PLATFORM",
          "Device_Platform"
        ),
      },
    },
  },

  /*
   * Local tracking-session storage (temporary, until the Zoho
   * Creator sync above is switched on). Sessions are persisted to a
   * plain JSON file so Start -> Break -> Continue -> Stop survives a
   * backend restart during development/testing.
   */
  tracking: {
    sessionStoreFilePath: required(
      "TRACKING_SESSION_STORE_FILE_PATH",
      "./data/tracking-sessions.json"
    ),

    // Per handover doc Section 18: "Suggested initial radius: 150 metres."
    shiftRadiusMeters: numberValue(
      "TRACKING_SHIFT_RADIUS_METERS",
      150
    ),
  },

  email: {
    host: required(
      "EMAIL_HOST",
      "smtp.zoho.com"
    ),

    port: numberValue(
      "EMAIL_PORT",
      587
    ),

    user: required(
      "EMAIL_HOST_USER"
    ),

    password: required(
      "EMAIL_HOST_PASSWORD"
    ),

    from: required(
      "EMAIL_FROM",
      "Breeze Property Group <noreply@breeze-property.com>"
    ),
  },
};

module.exports = config;