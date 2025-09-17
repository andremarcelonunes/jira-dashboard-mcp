/**
 * Preload cache utility for ultra-fast dashboard loading
 */

interface CachePreloader {
  preloadAgileMetrics: () => Promise<any>;
  preloadExecutiveMetrics: () => Promise<any>;
  preloadAll: () => Promise<void>;
}

const API_BASE = 'http://localhost:8089/api';

// Persistent cache keys
const AGILE_CACHE_KEY = 'jira_agile_cache';
const EXECUTIVE_CACHE_KEY = 'jira_executive_cache';
const CACHE_TIMESTAMP_KEY = 'jira_cache_timestamp';
const CACHE_DURATION = 30000; // 30 seconds

// Global preload storage for instant access
let preloadedAgileData: any = null;
let preloadedExecutiveData: any = null;

// Persistent cache utilities
const persistentCache = {
  save: (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  },
  
  load: (key: string) => {
    try {
      const data = localStorage.getItem(key);
      const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
      
      if (data && timestamp) {
        const age = Date.now() - parseInt(timestamp);
        if (age < CACHE_DURATION) {
          return JSON.parse(data);
        }
      }
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
    }
    return null;
  },
  
  isValid: () => {
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    if (timestamp) {
      const age = Date.now() - parseInt(timestamp);
      return age < CACHE_DURATION;
    }
    return false;
  }
};

// Load from persistent cache immediately (synchronous)
preloadedAgileData = persistentCache.load(AGILE_CACHE_KEY);
preloadedExecutiveData = persistentCache.load(EXECUTIVE_CACHE_KEY);

if (preloadedAgileData) {
  console.log('⚡ INSTANT agile data loaded from localStorage');
}
if (preloadedExecutiveData) {
  console.log('⚡ INSTANT executive data loaded from localStorage');
}

export const cachePreloader: CachePreloader = {
  preloadAgileMetrics: async () => {
    try {
      const startTime = Date.now();
      const response = await fetch(`${API_BASE}/agile-metrics`);
      const data = await response.json();
      const loadTime = Date.now() - startTime;
      
      // Store in both memory and localStorage
      preloadedAgileData = data;
      persistentCache.save(AGILE_CACHE_KEY, data);
      
      if (data._cache_served) {
        console.log(`⚡ Agile metrics cached in ${loadTime}ms`);
      } else {
        console.log(`📡 Agile metrics fresh in ${loadTime}ms`);
      }
      return data;
    } catch (error) {
      console.warn('Failed to preload agile metrics:', error);
      // Return cached data if network fails
      return preloadedAgileData || persistentCache.load(AGILE_CACHE_KEY);
    }
  },

  preloadExecutiveMetrics: async () => {
    try {
      const startTime = Date.now();
      const response = await fetch(`${API_BASE}/executive-metrics`);
      const data = await response.json();
      const loadTime = Date.now() - startTime;
      
      // Store in both memory and localStorage
      preloadedExecutiveData = data;
      persistentCache.save(EXECUTIVE_CACHE_KEY, data);
      
      if (data._cache_served) {
        console.log(`⚡ Executive metrics cached in ${loadTime}ms`);
      } else {
        console.log(`📡 Executive metrics fresh in ${loadTime}ms`);
      }
      return data;
    } catch (error) {
      console.warn('Failed to preload executive metrics:', error);
      // Return cached data if network fails
      return preloadedExecutiveData || persistentCache.load(EXECUTIVE_CACHE_KEY);
    }
  },

  preloadAll: async () => {
    try {
      // Preload both metrics in parallel
      const startTime = Date.now();
      await Promise.all([
        cachePreloader.preloadAgileMetrics(),
        cachePreloader.preloadExecutiveMetrics()
      ]);
      const totalTime = Date.now() - startTime;
      console.log(`⚡ All metrics preloaded for instant access in ${totalTime}ms`);
    } catch (error) {
      console.warn('Failed to preload all metrics:', error);
    }
  }
};

// Export preloaded data getters with localStorage fallback
export const getPreloadedAgileData = () => {
  return preloadedAgileData || persistentCache.load(AGILE_CACHE_KEY);
};

export const getPreloadedExecutiveData = () => {
  return preloadedExecutiveData || persistentCache.load(EXECUTIVE_CACHE_KEY);
};

// Export cache status
export const isCacheValid = () => persistentCache.isValid();
export const getCacheAge = () => {
  const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
  return timestamp ? Date.now() - parseInt(timestamp) : null;
};

// Auto-preload when this module is imported
cachePreloader.preloadAll();