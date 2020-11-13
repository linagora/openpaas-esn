const CACHE_TTL = 5 * 60 * 1000;
const CACHE_PURGE_INTERVAL = CACHE_TTL;

const cache = new Map();

let purgeIntervalId = null;

module.exports = {
  set,
  get,
  purge,
  start,
  stop
};

function set(id, value) {
  if (!id) {
    throw new Error('Cache id cannot be null');
  }

  const cacheEntry = {
    value,
    validUntil: Date.now() + CACHE_TTL
  };

  cache.set(id, cacheEntry);
}

function get(id) {
  const cacheEntry = cache.get(id);
  const now = Date.now();

  if (!cacheEntry || cacheEntry.validUntil < now) {
    return null;
  }

  return cacheEntry.value;
}

function purge() {
  const now = Date.now();

  const ids = [...cache.keys()];

  ids.forEach(id => {
    const cacheEntry = cache.get(id);

    if (cacheEntry.validUntil < now) {
      cache.delete(id);
    }
  });
}

function start() {
  purgeIntervalId = setInterval(purge, CACHE_PURGE_INTERVAL);
}

function stop() {
  purgeIntervalId && clearInterval(purgeIntervalId);
  purgeIntervalId = null;
}
