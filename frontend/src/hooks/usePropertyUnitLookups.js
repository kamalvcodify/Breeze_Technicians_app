import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  getProperties,
  getUnitsByProperty,
  searchProperties,
  searchUnitsByProperty,
} from '../api/workOrderLookups';

import {
  mergeLookupRecords,
  readLookupCache,
  writeLookupCache,
} from './useCachedLookup';

const PROPERTY_CACHE_KEY =
  'breeze_crm_properties_v1';

function getUnitCacheKey(propertyId) {
  return `breeze_crm_units_${propertyId}_v1`;
}

function mapProperty(record) {
  return {
    label:
      record.name ||
      record.Product_Name ||
      'Unnamed property',

    value:
      String(
        record.id ||
        record.ID
      ),

    subtitle:
      record.address ||
      record.Property_Address ||
      '',
  };
}

function mapUnit(record) {
  return {
    label:
      record.name ||
      record.Name ||
      'Unnamed unit',

    value:
      String(
        record.id ||
        record.ID
      ),

    propertyId:
      String(
        record.propertyId ||
        record.Property?.id ||
        ''
      ),
  };
}

export default function usePropertyUnitLookups() {
  const [
    properties,
    setProperties,
  ] = useState([]);

  const [
    unitsByProperty,
    setUnitsByProperty,
  ] = useState({});

  const [
    loadingProperties,
    setLoadingProperties,
  ] = useState(false);

  const [
    loadingUnitsByProperty,
    setLoadingUnitsByProperty,
  ] = useState({});

  const [
    propertyError,
    setPropertyError,
  ] = useState('');

  const loadProperties =
    useCallback(async ({
      forceRefresh = false,
    } = {}) => {
      setPropertyError('');

      if (!forceRefresh) {
        const cachedProperties =
          await readLookupCache(
            PROPERTY_CACHE_KEY
          );

        if (
          cachedProperties?.length
        ) {
          setProperties(
            cachedProperties
          );

          return cachedProperties;
        }
      }

      setLoadingProperties(true);

      try {
        const response =
          await getProperties();

        const mappedProperties =
          (
            response.data.properties ||
            []
          ).map(mapProperty);

        setProperties(
          mappedProperties
        );

        await writeLookupCache(
          PROPERTY_CACHE_KEY,
          mappedProperties
        );

        return mappedProperties;
      } catch (error) {
        const message =
          error?.response?.data
            ?.detail ||
          'Could not load properties.';

        setPropertyError(message);

        return [];
      } finally {
        setLoadingProperties(false);
      }
    }, []);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  const searchRemoteProperties =
    useCallback(
      async (query) => {
        const cleanQuery =
          String(query || '').trim();

        if (cleanQuery.length < 2) {
          return [];
        }

        const localMatches =
          properties.filter(
            (property) => {
              const searchableText =
                `${property.label} ${property.subtitle}`
                  .toLowerCase();

              return searchableText.includes(
                cleanQuery.toLowerCase()
              );
            }
          );

        /*
         * Avoid a CRM API call when the
         * requested records already exist
         * in the downloaded 200 records.
         */
        if (localMatches.length > 0) {
          return localMatches;
        }

        try {
          const response =
            await searchProperties(
              cleanQuery
            );

          const remoteProperties =
            (
              response.data.properties ||
              []
            ).map(mapProperty);

          setProperties(
            (currentProperties) => {
              const mergedProperties =
                mergeLookupRecords(
                  currentProperties,
                  remoteProperties
                );

              writeLookupCache(
                PROPERTY_CACHE_KEY,
                mergedProperties
              );

              return mergedProperties;
            }
          );

          return remoteProperties;
        } catch (error) {
          console.warn(
            '[Property search] Remote search failed:',
            error?.response?.data ||
            error.message
          );

          return [];
        }
      },
      [properties]
    );

  const loadUnits =
    useCallback(
      async (
        propertyId,
        {
          forceRefresh = false,
        } = {}
      ) => {
        if (!propertyId) {
          return [];
        }

        if (
          !forceRefresh &&
          unitsByProperty[propertyId]
            ?.length
        ) {
          return unitsByProperty[
            propertyId
          ];
        }

        if (!forceRefresh) {
          const cachedUnits =
            await readLookupCache(
              getUnitCacheKey(
                propertyId
              )
            );

          if (cachedUnits?.length) {
            setUnitsByProperty(
              (current) => ({
                ...current,
                [propertyId]:
                  cachedUnits,
              })
            );

            return cachedUnits;
          }
        }

        setLoadingUnitsByProperty(
          (current) => ({
            ...current,
            [propertyId]: true,
          })
        );

        try {
          const response =
            await getUnitsByProperty(
              propertyId
            );

          const mappedUnits =
            (
              response.data.units ||
              []
            ).map(mapUnit);

          setUnitsByProperty(
            (current) => ({
              ...current,
              [propertyId]:
                mappedUnits,
            })
          );

          await writeLookupCache(
            getUnitCacheKey(
              propertyId
            ),
            mappedUnits
          );

          return mappedUnits;
        } catch (error) {
          console.warn(
            '[Unit lookup] Could not load units:',
            error?.response?.data ||
            error.message
          );

          return [];
        } finally {
          setLoadingUnitsByProperty(
            (current) => ({
              ...current,
              [propertyId]: false,
            })
          );
        }
      },
      [unitsByProperty]
    );

  const searchRemoteUnits =
    useCallback(
      async (
        propertyId,
        query
      ) => {
        if (!propertyId) {
          return [];
        }

        const cleanQuery =
          String(query || '').trim();

        if (cleanQuery.length < 2) {
          return [];
        }

        const existingUnits =
          unitsByProperty[
            propertyId
          ] || [];

        const localMatches =
          existingUnits.filter(
            (unit) =>
              unit.label
                .toLowerCase()
                .includes(
                  cleanQuery.toLowerCase()
                )
          );

        if (localMatches.length > 0) {
          return localMatches;
        }

        try {
          const response =
            await searchUnitsByProperty(
              propertyId,
              cleanQuery
            );

          const remoteUnits =
            (
              response.data.units ||
              []
            ).map(mapUnit);

          setUnitsByProperty(
            (current) => {
              const mergedUnits =
                mergeLookupRecords(
                  current[propertyId] ||
                    [],
                  remoteUnits
                );

              writeLookupCache(
                getUnitCacheKey(
                  propertyId
                ),
                mergedUnits
              );

              return {
                ...current,
                [propertyId]:
                  mergedUnits,
              };
            }
          );

          return remoteUnits;
        } catch (error) {
          console.warn(
            '[Unit search] Remote search failed:',
            error?.response?.data ||
            error.message
          );

          return [];
        }
      },
      [unitsByProperty]
    );

  const getUnitsForProperty =
    useCallback(
      (propertyId) => {
        if (!propertyId) {
          return [];
        }

        return (
          unitsByProperty[
            propertyId
          ] || []
        );
      },
      [unitsByProperty]
    );

  const isLoadingUnits =
    useCallback(
      (propertyId) =>
        Boolean(
          loadingUnitsByProperty[
            propertyId
          ]
        ),
      [loadingUnitsByProperty]
    );

  return {
    properties,
    loadingProperties,
    propertyError,

    loadProperties,
    searchRemoteProperties,

    loadUnits,
    getUnitsForProperty,
    searchRemoteUnits,
    isLoadingUnits,
  };
}