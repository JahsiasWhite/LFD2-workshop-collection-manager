const STORAGE_KEY = 'lfd2-modpack';
const STORAGE_VERSION = 1;

export function loadModpackState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (parsed.version !== STORAGE_VERSION) return null;

    return {
      modpack: Array.isArray(parsed.modpack) ? parsed.modpack : [],
      originalCollection: Array.isArray(parsed.originalCollection)
        ? parsed.originalCollection
        : [],
      steamCollectionId: parsed.steamCollectionId
        ? String(parsed.steamCollectionId)
        : '',
    };
  } catch {
    return null;
  }
}

export function saveModpackState(modpack, originalCollection, steamCollectionId = '') {
  try {
    const payload = {
      version: STORAGE_VERSION,
      modpack: modpack.map((mod) => ({
        id: String(mod.id),
        addedTags: mod.addedTags || [],
      })),
      originalCollection: originalCollection.map((mod) => String(mod.id)),
      steamCollectionId: steamCollectionId ? String(steamCollectionId) : '',
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn('Failed to save modpack to localStorage:', error);
  }
}

export function clearModpackState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore quota / private browsing errors
  }
}
