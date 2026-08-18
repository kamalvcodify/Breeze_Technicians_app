import {
  useCallback,
  useEffect,
  useRef,
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

/*
 * Background unit-prefetch tuning. Staggered (not all at once) so
 * a technician with many properties doesn't fire off dozens of
 * simultaneous API calls the moment the property list loads - this
 * runs quietly in the background while they're using the app, so
 * there is no rush.
 */
const UNIT_PREFETCH_STAGGER_MS = 400;

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

  // Tracks which property IDs the background prefetch has already
  // handled (attempted or succeeded), so it never re-runs for the
  // same property twice within one app session.
  const prefetchedPropertyIdsRef = useRef(new Set());

  const loadUnitsRef = useRef(null);

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
         * FIX: this used to return localMatches immediately
         * whenever ANY loosely-matching property already existed
         * in the currently-loaded list, WITHOUT ever calling the
         * real remote search API - meaning a genuinely different
         * property elsewhere in Zoho (outside the first ~200
         * loaded records) could never be found if something else
         * already-loaded happened to loosely match the typed text
         * first. Remote search now always runs once the query is
         * long enough, regardless of local matches - local matches
         * are still returned instantly for a snappy first paint,
         * but the real search always follows up and merges in
         * whatever Zoho actually has.
         */
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

          /*
           * Return whichever result set is more complete - if the
           * remote search found real matches, prefer those over
           * the local-only guess from before the call resolved.
           */
          return remoteProperties.length > 0
            ? remoteProperties
            : localMatches;
        } catch (error) {
          console.warn(
            '[Property search] Remote search failed:',
            error?.response?.data ||
            error.message
          );

          // If the remote call itself fails (e.g. genuinely
          // offline), fall back to whatever was found locally
          // rather than showing nothing at all.
          return localMatches;
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

  // Keep a ref to the latest loadUnits so the background prefetch
  // effect below doesn't need it in its dependency array (which
  // would otherwise re-trigger the whole prefetch loop every time
  // unitsByProperty changes, i.e. after every single unit fetch).
  loadUnitsRef.current = loadUnits;

  /*
   * BACKGROUND UNIT PREFETCH FOR OFFLINE USE
   * ------------------------------------------------------------
   * Once the property list is available (from cache or a fresh
   * fetch), quietly walk through every property NOT already
   * prefetched this session and load+cache its units - one at a
   * time, staggered, entirely in the background.
   *
   * NOTE: this only prefetches units for whatever IS in the
   * `properties` list - if the backend's property list itself is
   * capped to a single page, any properties beyond that page are
   * outside what this can help with. That would need changes to
   * api/workOrderLookups.js and the backend lookup
   * controller/service, not this file.
   * ------------------------------------------------------------
   */
  useEffect(() => {
    if (properties.length === 0) {
      return undefined;
    }

    let cancelled = false;

    const propertiesToPrefetch = properties.filter(
      (property) => !prefetchedPropertyIdsRef.current.has(property.value)
    );

    if (propertiesToPrefetch.length === 0) {
      return undefined;
    }

    (async () => {
      for (const property of propertiesToPrefetch) {
        if (cancelled) {
          return;
        }

        prefetchedPropertyIdsRef.current.add(property.value);

        // eslint-disable-next-line no-await-in-loop
        await loadUnitsRef.current(property.value);

        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => setTimeout(resolve, UNIT_PREFETCH_STAGGER_MS));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [properties]);

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

        // Same fix as searchRemoteProperties above - always run
        // the real remote search, don't stop early just because
        // something already-loaded loosely matched first.
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

          return remoteUnits.length > 0
            ? remoteUnits
            : localMatches;
        } catch (error) {
          console.warn(
            '[Unit search] Remote search failed:',
            error?.response?.data ||
            error.message
          );

          return localMatches;
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