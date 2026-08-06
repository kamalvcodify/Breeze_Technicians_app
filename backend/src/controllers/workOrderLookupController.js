const zohoCrmService =
  require(
    "../services/zohoCrmService"
  );

function parseForceRefresh(value) {
  return (
    value === "true" ||
    value === true ||
    value === "1"
  );
}

async function listProperties(
  req,
  res
) {
  const result =
    await zohoCrmService
      .getProperties({
        forceRefresh:
          parseForceRefresh(
            req.query.refresh
          ),
      });

  return res.status(200).json({
    properties:
      result.properties,

    info:
      result.info,

    source:
      result.source,
  });
}

async function searchProperties(
  req,
  res
) {
  const query =
    String(req.query.q || "")
      .trim();

  const result =
    await zohoCrmService
      .searchProperties(query);

  return res.status(200).json({
    properties:
      result.properties,

    source:
      result.source,

    query,
  });
}

async function listUnitsByProperty(
  req,
  res
) {
  const propertyId =
    String(
      req.params.propertyId ||
      ""
    ).trim();

  const result =
    await zohoCrmService
      .getUnitsByProperty(
        propertyId,
        {
          forceRefresh:
            parseForceRefresh(
              req.query.refresh
            ),
        }
      );

  return res.status(200).json({
    units:
      result.units,

    propertyId,

    source:
      result.source,
  });
}

async function searchUnitsByProperty(
  req,
  res
) {
  const propertyId =
    String(
      req.params.propertyId ||
      ""
    ).trim();

  const query =
    String(req.query.q || "")
      .trim();

  const result =
    await zohoCrmService
      .searchUnitsByProperty(
        propertyId,
        query
      );

  return res.status(200).json({
    units:
      result.units,

    propertyId,

    source:
      result.source,

    query,
  });
}

module.exports = {
  listProperties,
  searchProperties,
  listUnitsByProperty,
  searchUnitsByProperty,
};