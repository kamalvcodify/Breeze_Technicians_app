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
      isActive: required("ZOHO_FIELD_IS_ACTIVE", "Is_Active"),
    },

    autoEndShift: {
      cronExpression: required("AUTO_END_SHIFT_CRON", "0 17 * * *"),
    },

    /*
     * Shared Attachment_Sync checkbox field, same API name across
     * every form that has image upload built (Work Order, Rehab
     * Order, Move Out). One field per whole record, set true once
     * the upload phase finishes IF the record had at least one
     * attachment anywhere - never sent at all for a record with
     * zero attachments, since Zoho has a workflow tied to this
     * field. See markAttachmentSyncComplete() in each form's Zoho
     * service.
     */
    attachmentSyncField: required(
      "ZOHO_ATTACHMENT_SYNC_FIELD",
      "Attachment_Sync",
    ),

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
     * Work Order / Rehab Order -> Zoho CRM (Invoice1 module).
     *
     * Both forms write to this SAME module, one record per TICKET
     * (previously, Zoho Creator combined up to 3 tickets into ONE
     * record - CRM does not). rehabForm ("Yes"/"No") is the only
     * thing distinguishing which form a given record came from,
     * since both share this module. See
     * services/zohoCrmInvoiceService.js (shared engine),
     * services/zohoWorkOrderService.js, services/
     * zohoRehabOrderService.js.
     */
    crmInvoice: {
      module: required("ZOHO_CRM_INVOICE_MODULE", "Invoice1"),

      fields: {
        name: required("ZOHO_CRM_INVOICE_FIELD_NAME", "Name"),
        ticketId: required("ZOHO_CRM_INVOICE_FIELD_TICKET_ID", "Ticket_Id"),
        jobType: required("ZOHO_CRM_INVOICE_FIELD_JOB_TYPE", "Job_type"),
        unit: required("ZOHO_CRM_INVOICE_FIELD_UNIT", "Unit"),
        unitName: required("ZOHO_CRM_INVOICE_FIELD_UNIT_NAME", "Unit_name"),
        property: required("ZOHO_CRM_INVOICE_FIELD_PROPERTY", "Property"),
        city: required("ZOHO_CRM_INVOICE_FIELD_CITY", "City"),
        clockIn: required("ZOHO_CRM_INVOICE_FIELD_CLOCK_IN", "clockin"),
        clockOut: required("ZOHO_CRM_INVOICE_FIELD_CLOCK_OUT", "clockout"),
        status: required("ZOHO_CRM_INVOICE_FIELD_STATUS", "Status"),
        techName: required("ZOHO_CRM_INVOICE_FIELD_TECH_NAME", "Tech_Name"),
        workDetails: required(
          "ZOHO_CRM_INVOICE_FIELD_WORK_DETAILS",
          "Work_Details",
        ),
        date: required("ZOHO_CRM_INVOICE_FIELD_DATE", "Date"),
        rehabForm: required(
          "ZOHO_CRM_INVOICE_FIELD_REHAB_FORM",
          "Rehab_Form",
        ),
      },
    },

    /*
     * Rent Ready Checklist -> Zoho CRM (Rent_Ready_Checklist
     * module). Confirmed against 2 real sample CRM records - see
     * services/zohoRentReadyChecklistService.js.
     */
    crmRentReadyChecklist: {
      module: required(
        "ZOHO_CRM_RENT_READY_MODULE",
        "Rent_Ready_Checklist",
      ),

      fields: {
        property: required("ZOHO_CRM_RENT_READY_FIELD_PROPERTY", "Property"),
        unit: required("ZOHO_CRM_RENT_READY_FIELD_UNIT", "Unit"),
        email: required("ZOHO_CRM_RENT_READY_FIELD_EMAIL", "Email"),
        techName: required(
          "ZOHO_CRM_RENT_READY_FIELD_TECH_NAME",
          "Tec_Name",
        ),
        dateTime: required(
          "ZOHO_CRM_RENT_READY_FIELD_DATE_TIME",
          "Date_Time_1",
        ),
        readyRent: required(
          "ZOHO_CRM_RENT_READY_FIELD_READY_RENT",
          "Ready_Rent",
        ),
      },

      checklist: {
        EXTERIOR_DEBRIS: required(
          "ZOHO_CRM_RENT_READY_FIELD_EXTERIOR_DEBRIS",
          "Exterior_Free_of_debris_trash_and_personal_items",
        ),
        ENTRYWAY: required(
          "ZOHO_CRM_RENT_READY_FIELD_ENTRYWAY",
          "Entryway_Porch_balcony_swept_front_door_cleaned_do",
        ),
        MAILBOX: required(
          "ZOHO_CRM_RENT_READY_FIELD_MAILBOX",
          "Mailbox_Clean_intact_and_functional",
        ),
        LANDSCAPING: required(
          "ZOHO_CRM_RENT_READY_FIELD_LANDSCAPING",
          "Landscaping_Grass_cut_weeds_removed_bushes_trimmed",
        ),
        LIGHTING_EXTERIOR: required(
          "ZOHO_CRM_RENT_READY_FIELD_LIGHTING_EXTERIOR",
          "Lighting_All_exterior_lights_functional_bulbs_repl",
        ),
        WALLS_CEILINGS: required(
          "ZOHO_CRM_RENT_READY_FIELD_WALLS_CEILINGS",
          "Walls_Ceilings_Cleaned_patched_and_painted_touched",
        ),
        WINDOWS: required(
          "ZOHO_CRM_RENT_READY_FIELD_WINDOWS",
          "Windows_Cleaned_inside_and_out_blinds_curtains_fun",
        ),
        LIGHTING_ELECTRICAL: required(
          "ZOHO_CRM_RENT_READY_FIELD_LIGHTING_ELECTRICAL",
          "Lighting_Electrical_All_light_bulbs_working_outlet",
        ),
        FLOORING_GENERAL: required(
          "ZOHO_CRM_RENT_READY_FIELD_FLOORING_GENERAL",
          "Flooring_Carpet_professionally_cleaned_or_replaced",
        ),
        DOORS: required(
          "ZOHO_CRM_RENT_READY_FIELD_DOORS",
          "Doors_All_doors_open_and_close_properly_locks_func",
        ),
        HVAC: required(
          "ZOHO_CRM_RENT_READY_FIELD_HVAC",
          "HVAC_Filter_replaced_air_vents_cleaned",
        ),
        REFRIGERATOR: required(
          "ZOHO_CRM_RENT_READY_FIELD_REFRIGERATOR",
          "Refrigerator_Cleaned_inside_outside_and_top_coils",
        ),
        STOVE_OVEN: required(
          "ZOHO_CRM_RENT_READY_FIELD_STOVE_OVEN",
          "Stove_Oven_Range_top_cleaned_oven_scrubbed_burners",
        ),
        DISHWASHER: required(
          "ZOHO_CRM_RENT_READY_FIELD_DISHWASHER",
          "Dishwasher_Cleaned_and_running_properly",
        ),
        MICROWAVE: required(
          "ZOHO_CRM_RENT_READY_FIELD_MICROWAVE",
          "Microwave_Cleaned_inside_and_outside",
        ),
        CABINETS: required(
          "ZOHO_CRM_RENT_READY_FIELD_CABINETS",
          "Cabinets_Drawers_Cleaned_inside_and_outside",
        ),
        SINK_FAUCET: required(
          "ZOHO_CRM_RENT_READY_FIELD_SINK_FAUCET",
          "Sink_Faucet_No_leaks_garbage_disposal_functional",
        ),
        TOILET: required(
          "ZOHO_CRM_RENT_READY_FIELD_TOILET",
          "Toilet_Thoroughly_cleaned_flushes_properly_no_leak",
        ),
        SHOWER_TUB: required(
          "ZOHO_CRM_RENT_READY_FIELD_SHOWER_TUB",
          "Shower_Tub_Caulking_in_good_condition_shower_head",
        ),
        VANITY_SINK: required(
          "ZOHO_CRM_RENT_READY_FIELD_VANITY_SINK",
          "Vanity_Sink_Cleaned_faucet_functional",
        ),
        MIRROR_LIGHTING: required(
          "ZOHO_CRM_RENT_READY_FIELD_MIRROR_LIGHTING",
          "Mirror_Lighting_Mirror_cleaned_lights_working",
        ),
        VENTILATION: required(
          "ZOHO_CRM_RENT_READY_FIELD_VENTILATION",
          "Ventilation_Fan_clean_and_working",
        ),
        CLOSETS: required(
          "ZOHO_CRM_RENT_READY_FIELD_CLOSETS",
          "Closets_Shelves_cleaned_doors_track_properly",
        ),
        FLOORING_BEDROOM: required(
          "ZOHO_CRM_RENT_READY_FIELD_FLOORING_BEDROOM",
          "Flooring_Cleaned_no_stains_or_debris",
        ),
        SMOKE_DETECTORS: required(
          "ZOHO_CRM_RENT_READY_FIELD_SMOKE_DETECTORS",
          "Smoke_Detectors_New_batteries_installed_and_tested",
        ),
        CO_DETECTORS: required(
          "ZOHO_CRM_RENT_READY_FIELD_CO_DETECTORS",
          "CO_Detectors_New_batteries_installed_and_tested",
        ),
        FIRE_EXTINGUISHER: required(
          "ZOHO_CRM_RENT_READY_FIELD_FIRE_EXTINGUISHER",
          "Fire_Extinguisher_Present_and_updated_if_required",
        ),
        FINAL_CLEANING: required(
          "ZOHO_CRM_RENT_READY_FIELD_FINAL_CLEANING",
          "Final_Cleaning_Unit_is_dust_free_and_ready_for_fin",
        ),
        FINAL_WALKTHROUGH: required(
          "ZOHO_CRM_RENT_READY_FIELD_FINAL_WALKTHROUGH",
          "Final_Walkthrough_Final_walkthrough_completed",
        ),
      },
    },

    /*
     * Check In / Check Out Inventory -> Zoho CRM (Check_In_log
     * module). Confirmed against real sample CRM records - see
     * services/zohoCheckInOutService.js. Note: Name is NOT set here
     * - confirmed to be a plain Zoho auto-number field, unlike
     * Invoice1/Rent_Ready_Checklist's composable text Name field.
     */
    crmCheckInOut: {
      module: required("ZOHO_CRM_CHECK_IN_OUT_MODULE", "Check_In_log"),

      fields: {
        technician: required(
          "ZOHO_CRM_CHECK_IN_OUT_FIELD_TECHNICIAN",
          "Technician",
        ),
        city: required("ZOHO_CRM_CHECK_IN_OUT_FIELD_CITY", "City"),
        rehabUnit: required(
          "ZOHO_CRM_CHECK_IN_OUT_FIELD_REHAB_UNIT",
          "Rehab_Unit",
        ),
        workOrder: required(
          "ZOHO_CRM_CHECK_IN_OUT_FIELD_WORK_ORDER",
          "Work_Order",
        ),
        property: required(
          "ZOHO_CRM_CHECK_IN_OUT_FIELD_PROPERTY",
          "Property",
        ),
        partsInventory: required(
          "ZOHO_CRM_CHECK_IN_OUT_FIELD_PARTS_INVENTORY",
          "Parts_Inventory",
        ),
        quantityDesired: required(
          "ZOHO_CRM_CHECK_IN_OUT_FIELD_QUANTITY_DESIRED",
          "Quantity_Desired",
        ),
        quantityReturned: required(
          "ZOHO_CRM_CHECK_IN_OUT_FIELD_QUANTITY_RETURNED",
          "Quantity_Returned",
        ),
        dateTime: required(
          "ZOHO_CRM_CHECK_IN_OUT_FIELD_DATE_TIME",
          "Date_Time",
        ),
        email: required("ZOHO_CRM_CHECK_IN_OUT_FIELD_EMAIL", "Email"),
        partCode: required(
          "ZOHO_CRM_CHECK_IN_OUT_FIELD_PART_CODE",
          "Part_Code",
        ),
        notes: required("ZOHO_CRM_CHECK_IN_OUT_FIELD_NOTES", "Details"),
        action: required("ZOHO_CRM_CHECK_IN_OUT_FIELD_ACTION", "Action"),
        checkinFor: required(
          "ZOHO_CRM_CHECK_IN_OUT_FIELD_CHECKIN_FOR",
          "Checkin_For",
        ),
      },
    },

    /*
     * Process a Move Out -> Zoho CRM (Process_a_Move_Out module).
     * Confirmed against a real sample CRM record - see
     * services/zohoMoveOutService.js. Note: no dedicated Technician
     * Name field exists on this module - the technician's name is
     * mapped onto the record's own Name field instead (same
     * approach used for Check In/Out's mandatory Name field).
     */
    crmMoveOut: {
      module: required(
        "ZOHO_CRM_MOVE_OUT_MODULE",
        "Process_a_Move_Out",
      ),

      fields: {
        email: required("ZOHO_CRM_MOVE_OUT_FIELD_EMAIL", "Email"),
        property: required(
          "ZOHO_CRM_MOVE_OUT_FIELD_PROPERTY",
          "Property",
        ),
        unit: required("ZOHO_CRM_MOVE_OUT_FIELD_UNIT", "Unit"),
        dateOfInspection: required(
          "ZOHO_CRM_MOVE_OUT_FIELD_DATE_OF_INSPECTION",
          "Date_of_inspection",
        ),
        status: required("ZOHO_CRM_MOVE_OUT_FIELD_STATUS", "Status"),
        notes: required("ZOHO_CRM_MOVE_OUT_FIELD_NOTES", "Details"),
      },
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

    /*
     * Zoho CRM Task Tracking (per-Work-Order geofenced time
     * tracking, from the Technician Shift screen) - a SEPARATE
     * module from the header bar's Login/Logout shift toggle
     * (services/zohoCrmShiftService.js). One record per technician
     * + Work Order (matched by Email + Reference, not by calendar
     * day - a Work Order can span multiple days). A subform,
     * Task_Tracking_Sessions, holds one row per start/stop segment.
     * All fields in this module are real Zoho DateTime types, not
     * plain Text/Date - see services/zohoTaskTrackingService.js.
     */
    taskTracking: {
      module: required("ZOHO_TASK_TRACKING_MODULE", "Task_Tracking"),

      fields: {
        name: required("ZOHO_TASK_TRACKING_FIELD_NAME", "Name"),
        email: required("ZOHO_TASK_TRACKING_FIELD_EMAIL", "Email"),
        jobType: required("ZOHO_TASK_TRACKING_FIELD_JOB_TYPE", "Job_Type"),
        reference: required("ZOHO_TASK_TRACKING_FIELD_REFERENCE", "Reference"),
        firstStartTime: required(
          "ZOHO_TASK_TRACKING_FIELD_FIRST_START_TIME",
          "First_Start_Time",
        ),
        lastEndTime: required(
          "ZOHO_TASK_TRACKING_FIELD_LAST_END_TIME",
          "Last_End_Time",
        ),
        totalTimeWorked: required(
          "ZOHO_TASK_TRACKING_FIELD_TOTAL_TIME_WORKED",
          "Total_Time_Worked",
        ),
        sessionCount: required(
          "ZOHO_TASK_TRACKING_FIELD_SESSION_COUNT",
          "Session_Count",
        ),

        /*
         * NEW - event-log fields, per the client's provided
         * implementation spec. Location_Logs was redesigned from an
         * aggregated per-Work-Order record (firstStartTime,
         * totalTimeWorked, etc above - kept but no longer written
         * to) to a true event log: every Login, Logout, Break
         * Started, Break Ended, and Interval Ping is its own fresh
         * row using these fields. See
         * services/zohoTaskTrackingService.js's logEvent()/
         * logPingBatch().
         */
        logType: required("ZOHO_TASK_TRACKING_FIELD_LOG_TYPE", "Log_Type"),
        deviceTimestamp: required(
          "ZOHO_TASK_TRACKING_FIELD_DEVICE_TIMESTAMP",
          "Device_Timestamp",
        ),
        latitude: required("ZOHO_TASK_TRACKING_FIELD_LATITUDE", "Latitude"),
        longitude: required("ZOHO_TASK_TRACKING_FIELD_LONGITUDE", "Longitude"),
        relatedWorkOrder: required(
          "ZOHO_TASK_TRACKING_FIELD_RELATED_WORK_ORDER",
          "Related_Work_Order",
        ),
        technician: required(
          "ZOHO_TASK_TRACKING_FIELD_TECHNICIAN",
          "Technician",
        ),
      },

      subformName: required(
        "ZOHO_TASK_TRACKING_SUBFORM_NAME",
        "Task_Tracking_Sessions",
      ),

      sessionFields: {
        startTime: required(
          "ZOHO_TASK_TRACKING_SESSION_FIELD_START_TIME",
          "Start_Time",
        ),
        endTime: required(
          "ZOHO_TASK_TRACKING_SESSION_FIELD_END_TIME",
          "End_Time",
        ),
        duration: required(
          "ZOHO_TASK_TRACKING_SESSION_FIELD_DURATION",
          "Duration",
        ),
      },
    },
  },

  /*
   * AppFolio API - replaces the old Desk-based "My Assigned Work
   * Orders" data source entirely (per instructions: "rip it out,
   * pull it from AppFolio directly"). See services/
   * appFolioService.js, services/assignedWorkOrderStore.js, jobs/
   * appFolioSyncJob.js.
   */
  appFolio: {
    baseUrl: required("APPFOLIO_API_BASE_URL", "https://api.appfolio.com/api/v0"),
    authHeader: required("APPFOLIO_AUTH_HEADER"),
    developerId: required("APPFOLIO_DEVELOPER_ID"),

    // How often the background sync runs - cron format, always
    // interpreted in America/New_York. Default: every 5 minutes.
    syncCron: required("APPFOLIO_SYNC_CRON", "*/5 * * * *"),

    // Full reconciliation - once daily, replaces the ENTIRE local
    // store with a fresh pull, so work orders deleted on AppFolio's
    // side (which the 5-min incremental sync can't detect, since
    // LastUpdatedAtFrom has no way to signal a deletion) get removed
    // here too. Scoped to reconciliationLookbackDays rather than
    // truly every work order ever, to keep this pull reasonably
    // sized.
    reconciliationCron: required("APPFOLIO_RECONCILIATION_CRON", "0 3 * * *"),
    reconciliationLookbackDays: numberValue(
      "APPFOLIO_RECONCILIATION_LOOKBACK_DAYS",
      90,
    ),

    // How often the Users (staff) list gets refreshed - this
    // changes rarely, so it's deliberately NOT part of the
    // 5-minute cycle. Default: once every 24 hours.
    usersCacheTtlMs: numberValue("APPFOLIO_USERS_CACHE_TTL_MS", 24 * 60 * 60 * 1000),

    // Property/Unit lookups are cached aggressively since many
    // work orders share the same property - default 6 hours.
    propertyCacheTtlMs: numberValue("APPFOLIO_PROPERTY_CACHE_TTL_MS", 6 * 60 * 60 * 1000),
    unitCacheTtlMs: numberValue("APPFOLIO_UNIT_CACHE_TTL_MS", 6 * 60 * 60 * 1000),

    // Comma-separated. Anything in this list is treated as
    // "complete" and filtered OUT of a technician's "My Assigned
    // Work Orders" list. Admin's AppFolio Work Orders report always
    // shows everything, regardless of this list.
    completedStatuses: required(
      "APPFOLIO_COMPLETED_STATUSES",
      "Work Done,Ready to Bill,Completed,Completed No Need to Bill,Canceled",
    ).split(",").map((value) => value.trim()),
  },

  /*
   * Geocoding (OpenCage Data) - converts AppFolio's plain text
   * property addresses into latitude/longitude for the geofencing
   * feature (AppFolio itself provides no coordinates at all). Same
   * provider + API key already proven working in the client's
   * existing Zoho Creator Deluge script - ported directly, not a
   * new/unproven provider. See services/geocodingService.js.
   */
  geocoding: {
    openCageApiKey: required("OPENCAGE_API_KEY"),
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