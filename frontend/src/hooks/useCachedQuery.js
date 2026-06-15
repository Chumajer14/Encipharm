import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const memoryCache = new Map();
const STORAGE_PREFIX = "enci-query:";
const FIREBASE_FREE_TIER_MODE = import.meta.env.VITE_FIREBASE_FREE_TIER_MODE !== "false";
const DEFAULT_REFRESH_MS = Number(
  import.meta.env.VITE_QUERY_REFRESH_MS || (FIREBASE_FREE_TIER_MODE ? 5 * 60 * 1000 : 60 * 1000),
);

function readSessionCache(key) {
  try {
    const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${key}`);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

function writeSessionCache(key, value) {
  try {
    sessionStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
  } catch {
    // Session storage can be unavailable in restricted browser modes.
  }
}

function readCache(key) {
  if (memoryCache.has(key)) return memoryCache.get(key);
  const cached = readSessionCache(key);
  if (cached !== undefined) {
    memoryCache.set(key, cached);
  }
  return cached;
}

function writeCache(key, value) {
  memoryCache.set(key, value);
  writeSessionCache(key, value);
}

export function invalidateCachedQuery(prefix) {
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }
  try {
    for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = sessionStorage.key(index);
      if (key?.startsWith(`${STORAGE_PREFIX}${prefix}`)) {
        sessionStorage.removeItem(key);
      }
    }
  } catch {
    // Ignore storage cleanup failures; memory cache is already invalidated.
  }
}

function useCachedQuery(
  key,
  fetcher,
  {
    enabled = true,
    initialData,
    refreshMs = DEFAULT_REFRESH_MS,
    refreshOnFocus = true,
    refreshOnMount = true,
  } = {},
) {
  const cacheKey = useMemo(() => String(key), [key]);
  const initialCached = enabled ? readCache(cacheKey) : undefined;
  const [data, setData] = useState(initialCached ?? initialData);
  const [loading, setLoading] = useState(enabled && initialCached === undefined);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const fetcherRef = useRef(fetcher);
  const refreshRef = useRef({ inFlight: null, lastStartedAt: 0, retryAfterUntil: 0 });

  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const refresh = useCallback(async ({ silent = false } = {}) => {
    if (!enabled) return undefined;
    const now = Date.now();
    if (refreshRef.current.inFlight) return refreshRef.current.inFlight;
    if (silent && now < refreshRef.current.retryAfterUntil) return readCache(cacheKey);
    if (silent && now - refreshRef.current.lastStartedAt < 1500) return readCache(cacheKey);

    refreshRef.current.lastStartedAt = now;
    const hasCache = readCache(cacheKey) !== undefined;
    if (!silent && !hasCache) {
      setLoading(true);
    }
    if (silent || hasCache) {
      setRefreshing(true);
    }

    const request = (async () => {
      try {
        const nextData = await fetcherRef.current();
        writeCache(cacheKey, nextData);
        setData(nextData);
        setError("");
        return nextData;
      } catch (refreshError) {
        if (refreshError?.status === 429) {
          refreshRef.current.retryAfterUntil = Date.now() + 60 * 1000;
        }
        setError(refreshError?.message || "No se pudieron cargar los datos.");
        return undefined;
      } finally {
        setLoading(false);
        setRefreshing(false);
        refreshRef.current.inFlight = null;
      }
    })();

    refreshRef.current.inFlight = request;
    return request;
  }, [cacheKey, enabled]);

  useEffect(() => {
    if (!enabled) return undefined;
    const cached = readCache(cacheKey);
    if (cached !== undefined) {
      queueMicrotask(() => {
        setData(cached);
        setLoading(false);
        if (refreshOnMount) {
          refresh({ silent: true });
        }
      });
    } else {
      queueMicrotask(() => refresh());
    }

    const interval = refreshMs > 0
      ? window.setInterval(() => refresh({ silent: true }), refreshMs)
      : null;
    const onFocus = () => {
      if (refreshOnFocus) {
        refresh({ silent: true });
      }
    };
    if (refreshOnFocus) {
      window.addEventListener("focus", onFocus);
    }
    const onDataMutated = () => refresh({ silent: true });
    window.addEventListener("enci:data-mutated", onDataMutated);

    return () => {
      if (interval) window.clearInterval(interval);
      if (refreshOnFocus) {
        window.removeEventListener("focus", onFocus);
      }
      window.removeEventListener("enci:data-mutated", onDataMutated);
    };
  }, [cacheKey, enabled, refresh, refreshMs, refreshOnFocus, refreshOnMount]);

  return { data, error, loading, refresh, refreshing };
}

export default useCachedQuery;
