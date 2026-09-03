import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Thin JSON-typed wrapper around AsyncStorage. AsyncStorage itself ships a web build backed by
 * `localStorage`, so this single abstraction already works unmodified on iOS, Android and Web.
 */
export const storage = {
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (raw == null) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Best-effort persistence: swallow quota/serialization errors rather than crashing the timer.
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      // no-op
    }
  },
};

/** Adapter so zustand's `persist` middleware can use the abstraction above. */
export const zustandJsonStorage = {
  getItem: async (name: string) => {
    const raw = await AsyncStorage.getItem(name);
    return raw ?? null;
  },
  setItem: async (name: string, value: string) => {
    await AsyncStorage.setItem(name, value);
  },
  removeItem: async (name: string) => {
    await AsyncStorage.removeItem(name);
  },
};
