import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_CACHE_DURATION =
  15 * 60 * 1000;

export async function readLookupCache(
  cacheKey,
  maxAge = DEFAULT_CACHE_DURATION
) {
  try {
    const storedValue =
      await AsyncStorage.getItem(cacheKey);

    if (!storedValue) {
      return null;
    }

    const parsedValue =
      JSON.parse(storedValue);

    if (
      !parsedValue.savedAt ||
      !Array.isArray(parsedValue.data)
    ) {
      return null;
    }

    const cacheAge =
      Date.now() - parsedValue.savedAt;

    if (cacheAge > maxAge) {
      await AsyncStorage.removeItem(
        cacheKey
      );

      return null;
    }

    return parsedValue.data;
  } catch (error) {
    console.warn(
      `[Lookup cache] Could not read ${cacheKey}:`,
      error
    );

    return null;
  }
}

export async function writeLookupCache(
  cacheKey,
  data
) {
  try {
    await AsyncStorage.setItem(
      cacheKey,
      JSON.stringify({
        savedAt: Date.now(),
        data,
      })
    );
  } catch (error) {
    console.warn(
      `[Lookup cache] Could not write ${cacheKey}:`,
      error
    );
  }
}

export function mergeLookupRecords(
  existingRecords,
  newRecords
) {
  const recordMap = new Map();

  existingRecords.forEach((record) => {
    recordMap.set(record.value, record);
  });

  newRecords.forEach((record) => {
    recordMap.set(record.value, record);
  });

  return Array.from(
    recordMap.values()
  ).sort((first, second) =>
    first.label.localeCompare(
      second.label
    )
  );
}