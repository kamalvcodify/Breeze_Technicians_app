const cacheStore = new Map();

function getCacheEntry(key) {
  const entry = cacheStore.get(key);

  if (!entry) {
    return null;
  }

  if (Date.now() >= entry.expiresAt) {
    cacheStore.delete(key);
    return null;
  }

  return entry.value;
}

function setCacheEntry(
  key,
  value,
  ttlMilliseconds
) {
  const safeTtl =
    Number(ttlMilliseconds) > 0
      ? Number(ttlMilliseconds)
      : 5 * 60 * 1000;

  cacheStore.set(key, {
    value,
    expiresAt:
      Date.now() + safeTtl,
  });

  return value;
}

function deleteCacheEntry(key) {
  cacheStore.delete(key);
}

function deleteCacheEntriesByPrefix(
  prefix
) {
  for (const key of cacheStore.keys()) {
    if (key.startsWith(prefix)) {
      cacheStore.delete(key);
    }
  }
}

function clearCache() {
  cacheStore.clear();
}

module.exports = {
  getCacheEntry,
  setCacheEntry,
  deleteCacheEntry,
  deleteCacheEntriesByPrefix,
  clearCache,
};