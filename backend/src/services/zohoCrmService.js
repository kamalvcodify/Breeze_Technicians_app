const axios = require("axios");

const config = require(
  "../config/env"
);

const {
  getAccessToken,
} = require(
  "./zohoAuthService"
);

const {
  getCacheEntry,
  setCacheEntry,
} = require(
  "./lookupCacheService"
);

const PROPERTY_CACHE_KEY =
  "crm:properties:first-page";

function getUnitCacheKey(propertyId) {
  return `crm:units:property:${propertyId}`;
}

function escapeCriteriaValue(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\)/g, "\\)")
    .replace(/\(/g, "\\(")
    .trim();
}

function normaliseSearchQuery(query) {
  return String(query || "")
    .trim()
    .replace(/\s+/g, " ");
}

function validateRecordId(recordId) {
  return /^\d+$/.test(
    String(recordId || "")
  );
}

function buildCrmBaseUrl() {
  const crmConfig =
    config.zoho.crm;

  return (
    `${config.zoho.apiDomain}` +
    `/crm/${crmConfig.apiVersion}`
  );
}

async function crmRequest(
  method,
  path,
  {
    params,
    data,
  } = {}
) {
  const accessToken =
    await getAccessToken();

  const response =
    await axios({
      method,

      url:
        `${buildCrmBaseUrl()}${path}`,

      params,
      data,

      headers: {
        Authorization:
          `Zoho-oauthtoken ${accessToken}`,

        Accept:
          "application/json",

        "Content-Type":
          "application/json",
      },

      timeout: 30000,
    });

  return response.data;
}

function mapPropertyRecord(record) {
  const fields =
    config.zoho.crm
      .propertyFields;

  return {
    id:
      String(record.id),

    name:
      String(
        record[fields.name] ||
        "Unnamed property"
      ),

    address:
      String(
        record[fields.address] ||
        ""
      ),

    active:
      record[fields.active] !== false,
  };
}

function mapUnitRecord(record) {
  const fields =
    config.zoho.crm
      .unitFields;

  const propertyLookup =
    record[fields.property];

  return {
    id:
      String(record.id),

    name:
      String(
        record[fields.name] ||
        "Unnamed unit"
      ),

    propertyId:
      propertyLookup?.id
        ? String(propertyLookup.id)
        : "",

    propertyName:
      propertyLookup?.name
        ? String(propertyLookup.name)
        : "",
  };
}

function removeDuplicateRecords(
  records
) {
  const recordsById =
    new Map();

  records.forEach((record) => {
    if (record?.id) {
      recordsById.set(
        String(record.id),
        record
      );
    }
  });

  return Array.from(
    recordsById.values()
  );
}

function sortByName(records) {
  return [...records].sort(
    (first, second) =>
      String(first.name)
        .localeCompare(
          String(second.name),
          undefined,
          {
            sensitivity: "base",
            numeric: true,
          }
        )
  );
}

function isNoContentResponse(error) {
  return (
    error?.response?.status === 204 ||
    error?.response?.status === 404
  );
}

function findPropertiesLocally(
  properties,
  query
) {
  const lowerQuery =
    normaliseSearchQuery(query)
      .toLowerCase();

  if (!lowerQuery) {
    return properties;
  }

  return properties.filter(
    (property) => {
      const searchableValue =
        `${property.name} ${property.address}`
          .toLowerCase();

      return searchableValue.includes(
        lowerQuery
      );
    }
  );
}

function findUnitsLocally(
  units,
  query
) {
  const lowerQuery =
    normaliseSearchQuery(query)
      .toLowerCase();

  if (!lowerQuery) {
    return units;
  }

  return units.filter(
    (unit) =>
      unit.name
        .toLowerCase()
        .includes(lowerQuery)
  );
}

async function getProperties({
  forceRefresh = false,
} = {}) {
  const crmConfig =
    config.zoho.crm;

  if (!forceRefresh) {
    const cachedProperties =
      getCacheEntry(
        PROPERTY_CACHE_KEY
      );

    if (cachedProperties) {
      return {
        properties:
          cachedProperties.properties,

        info:
          cachedProperties.info,

        source:
          "backend-cache",
      };
    }
  }

  try {
    const response =
      await crmRequest(
        "get",
        `/${crmConfig.propertyModule}`,
        {
          params: {
            fields: [
              crmConfig
                .propertyFields
                .name,

              crmConfig
                .propertyFields
                .address,

              crmConfig
                .propertyFields
                .active,
            ].join(","),

            page: 1,

            per_page:
              crmConfig
                .lookupPageSize,

            sort_by:
              crmConfig
                .propertyFields
                .name,

            sort_order:
              "asc",
          },
        }
      );

    const properties =
      sortByName(
        removeDuplicateRecords(
          (response.data || [])
            .map(
              mapPropertyRecord
            )
            .filter(
              (property) =>
                property.id &&
                property.name
            )
        )
      );

    const result = {
      properties,

      info:
        response.info || {
          page: 1,
          per_page:
            crmConfig
              .lookupPageSize,
          count:
            properties.length,
          more_records: false,
        },
    };

    setCacheEntry(
      PROPERTY_CACHE_KEY,
      result,
      crmConfig
        .propertyCacheTtlMs
    );

    return {
      ...result,
      source:
        "zoho-crm",
    };
  } catch (error) {
    if (
      isNoContentResponse(error)
    ) {
      return {
        properties: [],
        info: {
          count: 0,
          more_records: false,
        },
        source:
          "zoho-crm",
      };
    }

    throw error;
  }
}






async function searchProperties(query) {
  const crmConfig =
    getCrmConfig();

  const cleanQuery =
    normaliseSearchQuery(query);

  if (cleanQuery.length < 2) {
    const error = new Error(
      "Enter at least two characters to search properties."
    );

    error.statusCode = 400;
    throw error;
  }

  /*
   * First search all Property records already
   * available in the backend cache.
   */
  const cachedResult =
    getCacheEntry(
      PROPERTY_CACHE_KEY
    );

  const cachedProperties =
    Array.isArray(
      cachedResult?.properties
    )
      ? cachedResult.properties
      : [];

  const localMatches =
    findPropertiesLocally(
      cachedProperties,
      cleanQuery
    );

  if (localMatches.length > 0) {
    return {
      properties:
        localMatches,

      info: {
        count:
          localMatches.length,

        more_records:
          Boolean(
            cachedResult?.info
              ?.more_records
          ),
      },

      source:
        "backend-cache",
    };
  }

  /*
   * Determine where pagination should continue.
   *
   * If page 1 was already loaded, begin at page 2.
   * Otherwise begin at page 1.
   */
  let currentPage =
    Number(
      cachedResult?.loadedUntilPage
    ) || 0;

  let moreRecords =
    cachedResult
      ? Boolean(
          cachedResult?.info
            ?.more_records
        )
      : true;

  let allProperties = [
    ...cachedProperties,
  ];

  /*
   * Safety limit.
   *
   * 10 pages × 200 records = 2,000 records.
   * This keeps one user search from producing
   * unlimited Zoho API calls.
   */
  const maximumPages =
    Number(
      crmConfig
        .lookupMaximumPages
    ) || 10;

  while (
    moreRecords &&
    currentPage < maximumPages
  ) {
    const nextPage =
      currentPage + 1;

    let response;

    try {
      response =
        await crmRequest(
          "get",
          `/${crmConfig.propertyModule}`,
          {
            params: {
              fields: [
                crmConfig
                  .propertyFields
                  .name,

                crmConfig
                  .propertyFields
                  .address,

                crmConfig
                  .propertyFields
                  .active,
              ].join(","),

              page:
                nextPage,

              per_page:
                crmConfig
                  .lookupPageSize,

              sort_by:
                crmConfig
                  .propertyFields
                  .name,

              sort_order:
                "asc",
            },
          }
        );
    } catch (error) {
      if (
        isNoContentResponse(error)
      ) {
        moreRecords = false;
        break;
      }

      if (
        error?.response?.data
      ) {
        const crmError =
          new Error(
            error.response.data
              .message ||
            "Zoho CRM property pagination failed."
          );

        crmError.statusCode =
          error.response.status ||
          502;

        crmError.zohoResponse =
          error.response.data;

        throw crmError;
      }

      throw error;
    }

    const pageProperties =
      sortByName(
        removeDuplicateRecords(
          (
            response?.data ||
            []
          )
            .map(
              mapPropertyRecord
            )
            .filter(
              (property) =>
                property.id &&
                property.name
            )
        )
      );

    /*
     * Add this page to the existing cached data.
     */
    allProperties =
      sortByName(
        removeDuplicateRecords([
          ...allProperties,
          ...pageProperties,
        ])
      );

    currentPage =
      nextPage;

    moreRecords =
      Boolean(
        response?.info
          ?.more_records
      );

    const updatedCache = {
      properties:
        allProperties,

      info: {
        page:
          currentPage,

        per_page:
          crmConfig
            .lookupPageSize,

        count:
          allProperties.length,

        more_records:
          moreRecords,
      },

      loadedUntilPage:
        currentPage,
    };

    setCacheEntry(
      PROPERTY_CACHE_KEY,
      updatedCache,
      crmConfig
        .propertyCacheTtlMs
    );

    /*
     * Search the newly downloaded page.
     */
    const pageMatches =
      findPropertiesLocally(
        pageProperties,
        cleanQuery
      );

    if (
      pageMatches.length > 0
    ) {
      return {
        properties:
          pageMatches,

        info: {
          page:
            currentPage,

          count:
            pageMatches.length,

          more_records:
            moreRecords,
        },

        source:
          "zoho-crm-pagination",
      };
    }

    /*
     * A defensive stop in case Zoho returns
     * an empty page while more_records is true.
     */
    if (
      pageProperties.length === 0
    ) {
      moreRecords = false;
      break;
    }
  }

  return {
    properties: [],

    info: {
      page:
        currentPage,

      count: 0,

      more_records:
        moreRecords,
    },

    source:
      "zoho-crm-pagination",
  };
}


async function getUnitsByProperty(
  propertyId,
  {
    forceRefresh = false,
  } = {}
) {
  if (
    !validateRecordId(propertyId)
  ) {
    const error =
      new Error(
        "A valid Property CRM record ID is required."
      );

    error.statusCode = 400;
    throw error;
  }

  const crmConfig =
    config.zoho.crm;

  const cacheKey =
    getUnitCacheKey(
      propertyId
    );

  if (!forceRefresh) {
    const cachedUnits =
      getCacheEntry(cacheKey);

    if (cachedUnits) {
      return {
        units:
          cachedUnits,

        source:
          "backend-cache",
      };
    }
  }

  const propertyField =
    crmConfig
      .unitFields
      .property;

  const criteria =
    `(${propertyField}:equals:${propertyId})`;

  try {
    const response =
      await crmRequest(
        "get",
        `/${crmConfig.unitModule}/search`,
        {
          params: {
            criteria,

            fields: [
              crmConfig
                .unitFields
                .name,

              propertyField,
            ].join(","),

            page: 1,

            per_page:
              crmConfig
                .lookupPageSize,
          },
        }
      );

    const units =
      sortByName(
        removeDuplicateRecords(
          (response.data || [])
            .map(
              mapUnitRecord
            )
            .filter(
              (unit) =>
                unit.id &&
                unit.propertyId ===
                  String(
                    propertyId
                  )
            )
        )
      );

    setCacheEntry(
      cacheKey,
      units,
      crmConfig
        .unitCacheTtlMs
    );

    return {
      units,
      source:
        "zoho-crm",
    };
  } catch (error) {
    if (
      isNoContentResponse(error)
    ) {
      setCacheEntry(
        cacheKey,
        [],
        crmConfig
          .unitCacheTtlMs
      );

      return {
        units: [],
        source:
          "zoho-crm",
      };
    }

    throw error;
  }
}

async function searchUnitsByProperty(
  propertyId,
  query
) {
  if (
    !validateRecordId(propertyId)
  ) {
    const error =
      new Error(
        "A valid Property CRM record ID is required."
      );

    error.statusCode = 400;
    throw error;
  }

  const cleanQuery =
    normaliseSearchQuery(query);

  if (cleanQuery.length < 2) {
    const error =
      new Error(
        "Enter at least two characters to search Units."
      );

    error.statusCode = 400;
    throw error;
  }

  const crmConfig =
    config.zoho.crm;

  const cacheKey =
    getUnitCacheKey(
      propertyId
    );

  const cachedUnits =
    getCacheEntry(cacheKey);

  if (cachedUnits) {
    const localMatches =
      findUnitsLocally(
        cachedUnits,
        cleanQuery
      );

    if (localMatches.length > 0) {
      return {
        units:
          localMatches,

        source:
          "backend-cache",
      };
    }
  }

  const propertyField =
    crmConfig
      .unitFields
      .property;

  const unitNameField =
    crmConfig
      .unitFields
      .name;

  const safeQuery =
    escapeCriteriaValue(
      cleanQuery
    );

  const criteria =
    `((${propertyField}:equals:${propertyId})` +
    `and(${unitNameField}:contains:${safeQuery}))`;

  try {
    const response =
      await crmRequest(
        "get",
        `/${crmConfig.unitModule}/search`,
        {
          params: {
            criteria,

            fields: [
              unitNameField,
              propertyField,
            ].join(","),

            page: 1,

            per_page:
              crmConfig
                .lookupPageSize,
          },
        }
      );

    const units =
      sortByName(
        removeDuplicateRecords(
          (response.data || [])
            .map(
              mapUnitRecord
            )
            .filter(
              (unit) =>
                unit.id &&
                unit.propertyId ===
                  String(
                    propertyId
                  )
            )
        )
      );

    return {
      units,
      source:
        "zoho-crm-search",
    };
  } catch (error) {
    if (
      isNoContentResponse(error)
    ) {
      return {
        units: [],
        source:
          "zoho-crm-search",
      };
    }

    throw error;
  }
}

module.exports = {
  getProperties,
  searchProperties,
  getUnitsByProperty,
  searchUnitsByProperty,
};