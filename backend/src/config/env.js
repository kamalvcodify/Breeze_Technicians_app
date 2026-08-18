require("dotenv").config();

function required(name, fallback = "") {
  const value = process.env[name];

  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return value;
}

function numberValue(name, fallback) {
  const value = Number(process.env[name]);

  return Number.isFinite(value) ? value : fallback;
}

function ticketFields(prefix) {
  return {
    enabled: required(`ZOHO_WORK_ORDER_${prefix}_ENABLED`),

    ticketId: required(`ZOHO_WORK_ORDER_${prefix}_TICKET_ID`),

    city: required(`ZOHO_WORK_ORDER_${prefix}_CITY`),

    technicianName: required(`ZOHO_WORK_ORDER_${prefix}_TECHNICIAN_NAME`),

    property: required(`ZOHO_WORK_ORDER_${prefix}_PROPERTY`),

    unit: required(`ZOHO_WORK_ORDER_${prefix}_UNIT`),

    status: required(`ZOHO_WORK_ORDER_${prefix}_STATUS`),

    clockIn: required(`ZOHO_WORK_ORDER_${prefix}_CLOCK_IN`),

    clockOut: required(`ZOHO_WORK_ORDER_${prefix}_CLOCK_OUT`),

    jobType: required(`ZOHO_WORK_ORDER_${prefix}_JOB_TYPE`),

    date: required(`ZOHO_WORK_ORDER_${prefix}_DATE`),

    workDetails: required(`ZOHO_WORK_ORDER_${prefix}_WORK_DETAILS`),

    attachmentsSubform: required(
      `ZOHO_WORK_ORDER_${prefix}_ATTACHMENTS_SUBFORM`,
    ),

    attachmentField: required(
      `ZOHO_WORK_ORDER_${prefix}_ATTACHMENT_FIELD`,
      "Image",
    ),

    /*
     * New - the single-line "Image_Sequence" field added inside
     * each ticket's attachments subform. Used to pre-create
     * subform rows (sequence number only, no image) at record-
     * creation time, then match those rows back to the right local
     * image file after the record is created - see
     * zohoWorkOrderService.js's uploadTicketAttachments().
     */
    attachmentSequenceField: required(
      `ZOHO_WORK_ORDER_${prefix}_ATTACHMENT_SEQUENCE_FIELD`,
      "Image_Sequence",
    ),

    topLevelAttachmentField: required(
      `ZOHO_WORK_ORDER_${prefix}_TOP_LEVEL_ATTACHMENT_FIELD`,
    ),
  };
}

/**
 * Rehab Order field mapping - same shape/pattern as ticketFields()
 * above, but for the Rehab_Order Creator form.
 */
function rehabTicketFields(prefix) {
  return {
    enabled: required(`ZOHO_REHAB_ORDER_${prefix}_ENABLED`),

    property: required(`ZOHO_REHAB_ORDER_${prefix}_PROPERTY`),

    unit: required(`ZOHO_REHAB_ORDER_${prefix}_UNIT`),

    city: required(`ZOHO_REHAB_ORDER_${prefix}_CITY`),

    rentReady: required(`ZOHO_REHAB_ORDER_${prefix}_RENT_READY`),

    technicianName: required(`ZOHO_REHAB_ORDER_${prefix}_TECHNICIAN_NAME`),

    clockIn: required(`ZOHO_REHAB_ORDER_${prefix}_CLOCK_IN`),

    clockOut: required(`ZOHO_REHAB_ORDER_${prefix}_CLOCK_OUT`),

    status: required(`ZOHO_REHAB_ORDER_${prefix}_STATUS`),

    description: required(`ZOHO_REHAB_ORDER_${prefix}_DESCRIPTION`),

    email: required(`ZOHO_REHAB_ORDER_${prefix}_EMAIL`),

    date: required(`ZOHO_REHAB_ORDER_${prefix}_DATE`),

    jobType: required(`ZOHO_REHAB_ORDER_${prefix}_JOB_TYPE`),

    /*
     * Attachment upload is now wired up - see
     * zohoRehabOrderService.js. attachmentsSubform's name differs
     * per entry (Attachments / Attachment2 / Attachment3 - note
     * entries 2/3 do NOT have a trailing "s" unlike Work Order's
     * equivalent naming), so it's required per-prefix like every
     * other field here, not defaulted.
     */
    attachmentsSubform: required(
      `ZOHO_REHAB_ORDER_${prefix}_ATTACHMENTS_SUBFORM`,
    ),

    attachmentField: required(
      `ZOHO_REHAB_ORDER_${prefix}_ATTACHMENT_FIELD`,
      "Image",
    ),

    attachmentSequenceField: required(
      `ZOHO_REHAB_ORDER_${prefix}_ATTACHMENT_SEQUENCE_FIELD`,
      "image_sequence",
    ),
  };
}

const config = {
  port: numberValue("PORT", 5000),

  jwt: {
    secret: required("JWT_SECRET", "insecure-dev-secret-change-me"),

    expiresIn: required("JWT_EXPIRES_IN", "7d"),
  },

  zoho: {
    accountsDomain: required(
      "ZOHO_ACCOUNTS_DOMAIN",
      "https://accounts.zoho.com",
    ),

    apiDomain: required("ZOHO_API_DOMAIN", "https://www.zohoapis.com"),

    clientId: required("ZOHO_CLIENT_ID"),

    clientSecret: required("ZOHO_CLIENT_SECRET"),

    refreshToken: required("ZOHO_REFRESH_TOKEN"),

    /*
     * Zoho Creator configuration
     */
    ownerName: required("ZOHO_OWNER_NAME"),

    appLinkName: required("ZOHO_APP_LINK_NAME"),

    usersFormLinkName: required("ZOHO_USERS_FORM_LINK_NAME", "Users"),

    usersReportLinkName: required(
      "ZOHO_USERS_REPORT_LINK_NAME",
      "Users_Report",
    ),

    fields: {
      email: required("ZOHO_FIELD_EMAIL", "User_Email"),
      password: required("ZOHO_FIELD_PASSWORD", "Password"),
      isAdmin: required("ZOHO_FIELD_IS_ADMIN", "Is_Admin"),
      name: required("ZOHO_FIELD_NAME", "User_Name"), // ← already there, don't touch
      city: required("ZOHO_FIELD_CITY", "City"), // ← already there, don't touch
      termsAccepted: required("ZOHO_FIELD_TERM_CONDITIONS", "Term_Conditions"), // ← ADD THIS LINE
    },

    /*
     * Zoho Creator Work Order configuration
     */
    workOrder: {
      formLinkName: required("ZOHO_WORK_ORDER_FORM_LINK_NAME", "Work_Order"),

      reportLinkName: required(
        "ZOHO_WORK_ORDER_REPORT_LINK_NAME",
        "All_Work_Orders",
      ),

      emailField: required("ZOHO_WORK_ORDER_FIELD_EMAIL", "Email"),

      tickets: {
        ticket1: ticketFields("T1"),

        ticket2: ticketFields("T2"),

        ticket3: ticketFields("T3"),
      },
    },

    /*
     * Zoho Creator Rehab Order configuration
     *
     * Property/Unit lookups reuse the SAME Zoho CRM Products/Units
     * modules as Work Order (config.zoho.crm below) - there is no
     * separate lookup config for Rehab Order.
     */
    rehabOrder: {
      formLinkName: required("ZOHO_REHAB_ORDER_FORM_LINK_NAME", "Rehab_Order"),

      entries: {
        entry1: rehabTicketFields("T1"),

        entry2: rehabTicketFields("T2"),

        entry3: rehabTicketFields("T3"),
      },
    },

    /*
     * Zoho Creator Check In / Check Out / Inventory configuration
     *
     * Single-entry form (no T1/T2/T3 repeat pattern). Property
     * lookup reuses config.zoho.crm - no separate lookup config
     * needed here. The "unit" field name below is captured for
     * config completeness but is NOT currently used in
     * zohoCheckInOutService.js - that field is deliberately
     * excluded from the payload for now.
     */
    checkInOut: {
      formLinkName: required(
        "ZOHO_CHECK_IN_OUT_FORM_LINK_NAME",
        "CheckIn_CheckOut_Inventory",
      ),

      fields: {
        qrScan: required("ZOHO_CHECK_IN_OUT_FIELD_QR_SCAN", "QR_Scanner"),

        technicianName: required(
          "ZOHO_CHECK_IN_OUT_FIELD_TECHNICIAN_NAME",
          "Technician",
        ),

        property: required("ZOHO_CHECK_IN_OUT_FIELD_PROPERTY", "Property1"),

        unit: required("ZOHO_CHECK_IN_OUT_FIELD_UNIT", "Rehab_Unit1"),

        workOrder: required("ZOHO_CHECK_IN_OUT_FIELD_WORK_ORDER", "Work_Order"),

        dateTime: required("ZOHO_CHECK_IN_OUT_FIELD_DATE_TIME", "Date_Time1"),

        notes: required("ZOHO_CHECK_IN_OUT_FIELD_NOTES", "Notes"),

        email: required("ZOHO_CHECK_IN_OUT_FIELD_EMAIL", "Email"),

        jobType: required("ZOHO_CHECK_IN_OUT_FIELD_JOB_TYPE", "Check_in_out"),

        city: required("ZOHO_CHECK_IN_OUT_FIELD_CITY", "City"),

        action: required("ZOHO_CHECK_IN_OUT_FIELD_ACTION", "Action_field"),

        quantityDesired: required(
          "ZOHO_CHECK_IN_OUT_FIELD_QUANTITY_DESIRED",
          "Quantity_Desired",
        ),

        quantityReturned: required(
          "ZOHO_CHECK_IN_OUT_FIELD_QUANTITY_RETURNED",
          "Quantity_Returned",
        ),

        partCode: required("ZOHO_CHECK_IN_OUT_FIELD_PART_CODE", "Part_Code"),

        partsInventory: required(
          "ZOHO_CHECK_IN_OUT_FIELD_PARTS_INVENTORY",
          "Parts_Inventory",
        ),
      },
    },

    /*
     * Zoho Creator Process a Move Out configuration
     *
     * Single-entry form. Property/Unit lookups reuse
     * config.zoho.crm - no separate lookup config needed here.
     * Photo/attachments are NOT sent to Zoho yet - see
     * zohoMoveOutService.js.
     */
    moveOut: {
      formLinkName: required(
        "ZOHO_MOVE_OUT_FORM_LINK_NAME",
        "Move_Out_Checklist",
      ),

      fields: {
        technicianName: required(
          "ZOHO_MOVE_OUT_FIELD_TECHNICIAN_NAME",
          "Technician_Name",
        ),

        property: required("ZOHO_MOVE_OUT_FIELD_PROPERTY", "Property"),

        email: required("ZOHO_MOVE_OUT_FIELD_EMAIL", "Email"),

        unit: required("ZOHO_MOVE_OUT_FIELD_UNIT", "Unit"),

        finalStatus: required(
          "ZOHO_MOVE_OUT_FIELD_FINAL_STATUS",
          "Final_Status",
        ),

        dateOfInspection: required(
          "ZOHO_MOVE_OUT_FIELD_DATE_OF_INSPECTION",
          "Date_of_Inspection",
        ),

        notes: required("ZOHO_MOVE_OUT_FIELD_NOTES", "Notes"),

        /*
         * Attachment upload now wired up - single subform "Photo",
         * field "Image", sequence "image_sequence". Move Out is
         * single-entry, so only one set of these (no T1/T2/T3
         * pattern).
         */
        attachmentsSubform: required(
          "ZOHO_MOVE_OUT_ATTACHMENTS_SUBFORM",
          "Photo",
        ),

        attachmentField: required("ZOHO_MOVE_OUT_ATTACHMENT_FIELD", "Image"),

        attachmentSequenceField: required(
          "ZOHO_MOVE_OUT_ATTACHMENT_SEQUENCE_FIELD",
          "image_sequence",
        ),
      },
    },

    /*
     * Zoho Creator Rent Ready Checklist configuration
     *
     * Only the 7 top fields go through name-mapping here. The ~29
     * checklist boolean items are NOT listed field-by-field in
     * config - their Zoho API names are used directly as object
     * keys in the frontend/controller/service, since the given
     * names already ARE the exact Zoho field names. See
     * zohoRentReadyChecklistService.js for how those get merged
     * into the payload.
     */
    rentReadyChecklist: {
      formLinkName: required(
        "ZOHO_RENT_READY_CHECKLIST_FORM_LINK_NAME",
        "Rent_Ready_Checklist",
      ),

      fields: {
        property: required(
          "ZOHO_RENT_READY_CHECKLIST_FIELD_PROPERTY",
          "Property",
        ),

        unit: required("ZOHO_RENT_READY_CHECKLIST_FIELD_UNIT", "Unit"),

        email: required("ZOHO_RENT_READY_CHECKLIST_FIELD_EMAIL", "Email"),

        technicianName: required(
          "ZOHO_RENT_READY_CHECKLIST_FIELD_TECHNICIAN_NAME",
          "Tech_Name",
        ),

        rentReady: required(
          "ZOHO_RENT_READY_CHECKLIST_FIELD_RENT_READY",
          "Rent_Ready",
        ),

        dateTime: required(
          "ZOHO_RENT_READY_CHECKLIST_FIELD_DATE_TIME",
          "Date_Time1",
        ),

        notes: required("ZOHO_RENT_READY_CHECKLIST_FIELD_NOTES", "Notes"),
      },

      /*
       * Checklist item field mapping - every item's REAL Zoho field
       * API name lives here, in .env, not hardcoded anywhere in
       * frontend/controller/service code. The short keys on the
       * left (EXTERIOR_DEBRIS, LANDSCAPING, etc) are stable
       * identifiers used by the frontend's checklist state and
       * never change; only the .env VALUE (the actual Zoho field
       * name) needs editing if a field gets renamed/removed in
       * Zoho later.
       */
      checklist: {
        // --- Exterior & Entry ---
        EXTERIOR_DEBRIS: required(
          "ZOHO_RENT_READY_CHECKLIST_FIELD_EXTERIOR_DEBRIS",
          "Exterior_Free_of_debris_trash_and_personal_items",
        ),
        ENTRYWAY: required(
          "ZOHO_RENT_READY_CHECKLIST_FIELD_ENTRYWAY",
          "Entryway_Porch_balcony_swept_front_door_cleaned_doorbell_working",
        ),
        MAILBOX: required(
          "ZOHO_RENT_READY_CHECKLIST_FIELD_MAILBOX",
          "Mailbox_Clean_intact_and_functional",
        ),
        LANDSCAPING: required(
          "ZOHO_RENT_READY_CHECKLIST_FIELD_LANDSCAPING",
          "Landscaping_Grass_cut_weeds_removed_bushes_trimmed",
        ),
        LIGHTING_EXTERIOR: required(
          "ZOHO_RENT_READY_CHECKLIST_FIELD_LIGHTING_EXTERIOR",
          "Lighting_All_exterior_lights_functional_bulbs_replaced_if_needed",
        ),

        // --- General Interior ---
        WALLS_CEILINGS: required(
          "ZOHO_RENT_READY_CHECKLIST_FIELD_WALLS_CEILINGS",
          "Walls_Ceilings_Cleaned_patched_and_painted_touched_up1",
        ),
        WINDOWS: required(
          "ZOHO_RENT_READY_CHECKLIST_FIELD_WINDOWS",
          "Windows_Cleaned_inside_and_out_blinds_curtains_functional_screens_intact1",
        ),
        LIGHTING_ELECTRICAL: required(
          "ZOHO_RENT_READY_CHECKLIST_FIELD_LIGHTING_ELECTRICAL",
          "Lighting_Electrical_All_light_bulbs_working_outlet_covers_in_place1",
        ),
        FLOORING_GENERAL: required(
          "ZOHO_RENT_READY_CHECKLIST_FIELD_FLOORING_GENERAL",
          "Flooring_Carpet_professionally_cleaned_or_replaced_hardwood_tile_swept_and_mopped1",
        ),
        DOORS: required(
          "ZOHO_RENT_READY_CHECKLIST_FIELD_DOORS",
          "Doors_All_doors_open_and_close_properly_locks_functional_keys_available1",
        ),
        HVAC: required(
          "ZOHO_RENT_READY_CHECKLIST_FIELD_HVAC",
          "HVAC_Filter_replaced_air_vents_cleaned1",
        ),

        // --- Kitchen ---
        REFRIGERATOR: required(
          "ZOHO_RENT_READY_CHECKLIST_FIELD_REFRIGERATOR",
          "Refrigerator_Cleaned_inside_outside_and_top_coils_vacuumed_ice_maker_functional1",
        ),
        STOVE_OVEN: required(
          "ZOHO_RENT_READY_CHECKLIST_FIELD_STOVE_OVEN",
          "Stove_Oven_Range_top_cleaned_oven_scrubbed_burners_functional1",
        ),
        DISHWASHER: required(
          "ZOHO_RENT_READY_CHECKLIST_FIELD_DISHWASHER",
          "Dishwasher_Cleaned_and_running_properly1",
        ),
        MICROWAVE: required(
          "ZOHO_RENT_READY_CHECKLIST_FIELD_MICROWAVE",
          "Microwave_Cleaned_inside_and_outside1",
        ),
        CABINETS: required(
          "ZOHO_RENT_READY_CHECKLIST_FIELD_CABINETS",
          "Cabinets_Drawers_Cleaned_inside_and_outside1",
        ),
        SINK_FAUCET: required(
          "ZOHO_RENT_READY_CHECKLIST_FIELD_SINK_FAUCET",
          "Sink_Faucet_No_leaks_garbage_disposal_functional1",
        ),

        // --- Bathrooms ---
        TOILET: required(
          "ZOHO_RENT_READY_CHECKLIST_FIELD_TOILET",
          "Toilet_Thoroughly_cleaned_flushes_properly_no_leaks1",
        ),
        SHOWER_TUB: required(
          "ZOHO_RENT_READY_CHECKLIST_FIELD_SHOWER_TUB",
          "Shower_Tub_Caulking_in_good_condition_shower_head_functional_no_drain_clogs1",
        ),
        VANITY_SINK: required(
          "ZOHO_RENT_READY_CHECKLIST_FIELD_VANITY_SINK",
          "Vanity_Sink_Cleaned_faucet_functional1",
        ),
        MIRROR_LIGHTING: required(
          "ZOHO_RENT_READY_CHECKLIST_FIELD_MIRROR_LIGHTING",
          "Mirror_Lighting_Mirror_cleaned_lights_working1",
        ),
        VENTILATION: required(
          "ZOHO_RENT_READY_CHECKLIST_FIELD_VENTILATION",
          "Ventilation_Fan_clean_and_working1",
        ),

        // --- Bedrooms & Closets ---
        CLOSETS: required(
          "ZOHO_RENT_READY_CHECKLIST_FIELD_CLOSETS",
          "Closets_Shelves_cleaned_doors_track_properly1",
        ),
        FLOORING_BEDROOM: required(
          "ZOHO_RENT_READY_CHECKLIST_FIELD_FLOORING_BEDROOM",
          "Flooring_Cleaned_no_stains_or_debris1",
        ),

        // --- Safety & Final Touches ---
        SMOKE_DETECTORS: required(
          "ZOHO_RENT_READY_CHECKLIST_FIELD_SMOKE_DETECTORS",
          "Smoke_Detectors_New_batteries_installed_and_tested1",
        ),
        // NOTE: no trailing "1" in the default, unlike its siblings
        // in this section - given exactly this way, worth
        // double-checking in Zoho.
        CO_DETECTORS: required(
          "ZOHO_RENT_READY_CHECKLIST_FIELD_CO_DETECTORS",
          "CO_Detectors_New_batteries_installed_and_tested",
        ),
        FIRE_EXTINGUISHER: required(
          "ZOHO_RENT_READY_CHECKLIST_FIELD_FIRE_EXTINGUISHER",
          "Fire_Extinguisher_Present_and_updated_if_required1",
        ),
        FINAL_CLEANING: required(
          "ZOHO_RENT_READY_CHECKLIST_FIELD_FINAL_CLEANING",
          "Final_Cleaning_Unit_is_dust_free_and_ready_for_final_review1",
        ),
        FINAL_WALKTHROUGH: required(
          "ZOHO_RENT_READY_CHECKLIST_FIELD_FINAL_WALKTHROUGH",
          "Final_Walkthrough_Final_walkthrough_completed1",
        ),
      },
    },

    /*
     * Zoho Creator report link names - one per submission form,
     * used by zohoReportService.js to fetch each report's records.
     * All field-NAME mapping for reading these back is reused
     * directly from the config blocks above (workOrder, rehabOrder,
     * checkInOut, moveOut, rentReadyChecklist) - nothing is
     * duplicated here.
     */
    reports: {
      workOrder: required(
        "ZOHO_REPORT_WORK_ORDER_LINK_NAME",
        "Admin_All_Work_Orders",
      ),
      checkInOut: required(
        "ZOHO_REPORT_CHECK_IN_OUT_LINK_NAME",
        "All_Inventory_Parts",
      ),
      moveOut: required(
        "ZOHO_REPORT_MOVE_OUT_LINK_NAME",
        "All_Move_out_Checklist_Report",
      ),
      rentReadyChecklist: required(
        "ZOHO_REPORT_RENT_READY_CHECKLIST_LINK_NAME",
        "Admin_Rent_Ready_Checklist_Report",
      ),
      rehabOrder: required(
        "ZOHO_REPORT_REHAB_ORDER_LINK_NAME",
        "Admin_All_Rehab_Orders1",
      ),
    },

    /*
     * Zoho CRM configuration
     *
     * This must remain inside the zoho object because
     * zohoCrmService reads config.zoho.crm.
     */
    crm: {
      apiVersion: required("ZOHO_CRM_API_VERSION", "v2"),

      propertyModule: required("ZOHO_CRM_PROPERTY_MODULE", "Products"),

      propertyFields: {
        name: required("ZOHO_CRM_PROPERTY_NAME_FIELD", "Product_Name"),

        address: required(
          "ZOHO_CRM_PROPERTY_ADDRESS_FIELD",
          "Property_Address",
        ),

        active: required("ZOHO_CRM_PROPERTY_ACTIVE_FIELD", "Product_Active"),
      },

      unitModule: required("ZOHO_CRM_UNIT_MODULE", "Units"),

      unitFields: {
        name: required("ZOHO_CRM_UNIT_NAME_FIELD", "Name"),

        property: required("ZOHO_CRM_UNIT_PROPERTY_FIELD", "Property"),
      },

      lookupPageSize: numberValue("ZOHO_CRM_LOOKUP_PAGE_SIZE", 200),

      propertyCacheTtlMs: numberValue(
        "ZOHO_CRM_PROPERTY_CACHE_TTL_MS",
        15 * 60 * 1000,
      ),

      unitCacheTtlMs: numberValue("ZOHO_CRM_UNIT_CACHE_TTL_MS", 10 * 60 * 1000),
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
        "Technician_Shift_Sessions",
      ),

      sessionFields: {
        technicianName: required(
          "ZOHO_TRACKING_FIELD_TECHNICIAN_NAME",
          "Technician",
        ),
        technicianEmail: required(
          "ZOHO_TRACKING_FIELD_TECHNICIAN_EMAIL",
          "Technician_Email",
        ),
        workOrder: required("ZOHO_TRACKING_FIELD_WORK_ORDER", "Work_Order"),
        loginTime: required("ZOHO_TRACKING_FIELD_LOGIN_TIME", "Login_Time"),
        breakStart: required("ZOHO_TRACKING_FIELD_BREAK_START", "Break_Start"),
        breakEnd: required("ZOHO_TRACKING_FIELD_BREAK_END", "Break_End"),
        logoutTime: required("ZOHO_TRACKING_FIELD_LOGOUT_TIME", "Logout_Time"),
        status: required("ZOHO_TRACKING_FIELD_STATUS", "Status"),
        startLatitude: required(
          "ZOHO_TRACKING_FIELD_START_LATITUDE",
          "Start_Latitude",
        ),
        startLongitude: required(
          "ZOHO_TRACKING_FIELD_START_LONGITUDE",
          "Start_Longitude",
        ),
        endLatitude: required(
          "ZOHO_TRACKING_FIELD_END_LATITUDE",
          "End_Latitude",
        ),
        endLongitude: required(
          "ZOHO_TRACKING_FIELD_END_LONGITUDE",
          "End_Longitude",
        ),
      },

      locationLogFormLinkName: required(
        "ZOHO_TRACKING_LOCATION_LOG_FORM_LINK_NAME",
        "Technician_Location_Logs",
      ),

      locationLogFields: {
        technicianName: required(
          "ZOHO_TRACKING_LOG_FIELD_TECHNICIAN_NAME",
          "Technician",
        ),
        technicianEmail: required(
          "ZOHO_TRACKING_LOG_FIELD_TECHNICIAN_EMAIL",
          "Technician_Email",
        ),
        session: required(
          "ZOHO_TRACKING_LOG_FIELD_SESSION",
          "Tracking_Session",
        ),
        workOrder: required("ZOHO_TRACKING_LOG_FIELD_WORK_ORDER", "Work_Order"),
        latitude: required("ZOHO_TRACKING_LOG_FIELD_LATITUDE", "Latitude"),
        longitude: required("ZOHO_TRACKING_LOG_FIELD_LONGITUDE", "Longitude"),
        accuracy: required("ZOHO_TRACKING_LOG_FIELD_ACCURACY", "Accuracy"),
        recordedTime: required(
          "ZOHO_TRACKING_LOG_FIELD_RECORDED_TIME",
          "Recorded_Time",
        ),
        trackingStatus: required(
          "ZOHO_TRACKING_LOG_FIELD_TRACKING_STATUS",
          "Tracking_Status",
        ),
        devicePlatform: required(
          "ZOHO_TRACKING_LOG_FIELD_DEVICE_PLATFORM",
          "Device_Platform",
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
      "./data/tracking-sessions.json",
    ),

    // Per handover doc Section 18: "Suggested initial radius: 150 metres."
    shiftRadiusMeters: numberValue("TRACKING_SHIFT_RADIUS_METERS", 150),
  },

  email: {
    host: required("EMAIL_HOST", "smtp.zoho.com"),

    port: numberValue("EMAIL_PORT", 587),

    user: required("EMAIL_HOST_USER"),

    password: required("EMAIL_HOST_PASSWORD"),

    from: required(
      "EMAIL_FROM",
      "Breeze Property Group <noreply@breeze-property.com>",
    ),
  },
};

module.exports = config;
