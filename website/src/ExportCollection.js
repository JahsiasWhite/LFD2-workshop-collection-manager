import React, { useState, useMemo } from 'react';

import LazyImage from './components/LazyImage';

const ExportCollection = ({ modpack, onClose, originalCollection }) => {
  // Compare current modpack with original collection to find added/removed mods
  const { addedMods, removedMods } = useMemo(() => {
    const originalIds = new Set(originalCollection.map((mod) => mod.id));
    // const importedIds = new Set(importedMods.map((mod) => mod.id.toString()));
    const currentIds = new Set(modpack.map((mod) => mod.id));

    const added = modpack.filter((mod) => !originalIds.has(mod.id));
    const removed = originalCollection.filter((mod) => !currentIds.has(mod.id));

    return {
      addedMods: added,
      removedMods: removed,
    };
  }, [modpack, originalCollection]);

  return (
    <div className="popup-content">
      <div>
        <div>
          <div className="nav-container">
            <h2>Export Collection</h2>
            <button onClick={onClose}>Close</button>
          </div>

          <p>
            <strong>Note:</strong> Steam doesn't provide an API to automatically
            create or update collections. <br />
          </p>
          <p>
            To save these mods, you'll need to: <br />
            <ol>
              1. Create a new collection or use an existing one on the Steam
              Workshop
            </ol>
            <ol>2. Click each mod link below and add it to your collection</ol>
          </p>
        </div>

        <div>
          {/* Collection Stats */}
          <div>
            <div>
              <h3>Total Mods: {modpack.length}</h3>
            </div>
            <div>
              <h3>
                Total Mods Changed: {addedMods.length + removedMods.length}
              </h3>
            </div>
            {/* <div>
              <div>Added Mods: {addedMods.length}</div>
            </div>
            <div>
              <div>Removed Mods: {removedMods.length}</div>
            </div> */}
          </div>

          {/* Added Mods */}
          {addedMods.length > 0 && (
            <div>
              <h3>Added Mods: ({addedMods.length})</h3>
              <div>
                {addedMods.map((mod) => (
                  <div key={mod.id} className="list-item">
                    {mod.preview_url && (
                      <LazyImage
                        src={mod.preview_url}
                        alt={mod.title}
                        className="mod-card-img"
                      />
                    )}
                    <div className="export-mod-details">
                      <a
                        href={mod.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {mod.title}
                      </a>
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

          {/* Removed Mods */}
          {removedMods.length > 0 && (
            <div>
              <h3>Removed Mods: ({removedMods.length})</h3>
              <div className="space-y-3">
                {removedMods.map((mod) => (
                  <div key={mod.id}>
                    {mod.preview_url && (
                      <LazyImage
                        src={mod.preview_url}
                        alt={mod.title}
                        className="mod-card-img"
                      />
                    )}
                    <div className="export-mod-details">
                      <a
                        href={mod.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {mod.title}
                      </a>
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
      </div>
    </div>
  );
};

export default ExportCollection;
