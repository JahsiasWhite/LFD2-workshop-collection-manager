import React, { useMemo } from 'react';

import LazyImage from './components/LazyImage';
import {
  getCollectionEditorBrowserUrl,
  getWorkshopBrowserUrl,
  getWorkshopSteamUrl,
  openSteamCommunityPage,
} from './utils/steamLinks';

const ExportCollection = ({
  modpack,
  onClose,
  originalCollection,
  steamCollectionId,
}) => {
  const { addedMods, removedMods } = useMemo(() => {
    const originalIds = new Set(originalCollection.map((mod) => mod.id));
    const currentIds = new Set(modpack.map((mod) => mod.id));

    const added = modpack.filter((mod) => !originalIds.has(mod.id));
    const removed = originalCollection.filter((mod) => !currentIds.has(mod.id));

    return {
      addedMods: added,
      removedMods: removed,
    };
  }, [modpack, originalCollection]);

  const collectionEditorBrowserUrl =
    getCollectionEditorBrowserUrl(steamCollectionId);

  const openCollectionInSteam = () => {
    if (steamCollectionId) {
      window.location.assign(getWorkshopSteamUrl(steamCollectionId));
      return;
    }
    openSteamCommunityPage(collectionEditorBrowserUrl);
  };

  return (
    <div className="popup-content export-collection-popup">
      <div className="nav-container">
        <h2>Export Collection</h2>
        <button onClick={onClose}>Close</button>
      </div>

      <p className="export-collection-note">
        Steam does not provide an API to update collections automatically. Open
        your collection in Steam, then use the mod links below to subscribe and
        add each one.
      </p>

      <div className="export-collection-actions">
        <button
          type="button"
          className="export-steam-button"
          onClick={openCollectionInSteam}
        >
          {steamCollectionId
            ? 'Open collection in Steam'
            : 'Create collection in Steam'}
        </button>
        <a
          className="export-browser-link"
          href={collectionEditorBrowserUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Browser
        </a>
      </div>

      <div className="export-collection-stats">
        <h3>Total Mods: {modpack.length}</h3>
        <h3>Total Mods Changed: {addedMods.length + removedMods.length}</h3>
      </div>

      {addedMods.length > 0 && (
        <div className="export-collection-section">
          <h3>Added Mods ({addedMods.length})</h3>
          <div>
            {addedMods.map((mod) => (
              <div key={mod.id} className="list-item export-mod-item">
                {mod.preview_url && (
                  <LazyImage
                    src={mod.preview_url}
                    alt={mod.title}
                    className="mod-card-img"
                  />
                )}
                <div className="export-mod-details">
                  <div className="export-mod-links">
                    <a href={getWorkshopSteamUrl(mod.id)}>{mod.title}</a>
                    <a
                      className="export-browser-link"
                      href={getWorkshopBrowserUrl(mod.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Browser
                    </a>
                  </div>
                  <div>
                    Size: {(mod.file_size / 1024 / 1024).toFixed(2)} MB
                  </div>
                  <div>
                    {mod.addedTags?.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {removedMods.length > 0 && (
        <div className="export-collection-section">
          <h3>Removed Mods ({removedMods.length})</h3>
          <div>
            {removedMods.map((mod) => (
              <div key={mod.id} className="list-item export-mod-item">
                {mod.preview_url && (
                  <LazyImage
                    src={mod.preview_url}
                    alt={mod.title}
                    className="mod-card-img"
                  />
                )}
                <div className="export-mod-details">
                  <div className="export-mod-links">
                    <a href={getWorkshopSteamUrl(mod.id)}>{mod.title}</a>
                    <a
                      className="export-browser-link"
                      href={getWorkshopBrowserUrl(mod.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Browser
                    </a>
                  </div>
                  <div>
                    Size: {(mod.file_size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportCollection;
