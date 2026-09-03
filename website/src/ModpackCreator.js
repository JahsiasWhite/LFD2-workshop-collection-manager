import React, { useState, useEffect, useMemo } from 'react';

import './ModpackCreator.css';

import TagCard from './components/TagCard';
import AddToModpack from './AddToModpack';
import LazyImage from './components/LazyImage';
import { customTags, getTagVariations, tagVariations } from './constants/tags';
import { normalizeText } from './utils/slotMatching';

const ModpackCreator = ({
  mods,
  modpack,
  removeFromModpack,
  onTagSearch,
  onSave,
}) => {
  const [tagCounts, setTagCounts] = useState({});
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [inventorySearch, setInventorySearch] = useState('');
  const [expandedCard, setExpandedCard] = useState(null);
  const [showUntagged, setShowUntagged] = useState(false);

  const [selectedMod, setSelectedMod] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showModEditPopup, setShowModEditPopup] = useState(false);

  const [filteredMods, setFilteredMods] = useState([]);
  const [untaggedMods, setUntaggedMods] = useState([]);

  // Function to check if a mod's title or tags match any variations
  const matchesTagVariation = (mod, standardTag, variations) => {
    const normalizedTitle = normalizeText(mod.title);
    const normalizedTags = (mod.tags || []).map(normalizeText);

    if ((mod.addedTags || []).includes(standardTag)) {
      return true;
    }

    return variations.some((variation) => {
      const normalizedVariation = normalizeText(variation);
      if (normalizedVariation.length < 3) return false;

      return (
        normalizedTitle.includes(normalizedVariation) ||
        normalizedTags.some((tag) => tag.includes(normalizedVariation))
      );
    });
  };

  useEffect(() => {
    const counts = {};
    customTags.forEach((category) => {
      category.tags.forEach((tag) => {
        // Count mods that have the exact tag
        const exactMatches = modpack.filter((mod) =>
          mod.addedTags.includes(tag)
        );

        // Count mods that match variations
        const variationMatches = tag in tagVariations
          ? modpack.filter((mod) =>
              matchesTagVariation(mod, tag, getTagVariations(tag))
            )
          : [];

        // remove generic addedTags from the variationMatches
        if (variationMatches.length > 0) {
          variationMatches.forEach((mod) => {
            mod.addedTags = [];
          });
        }

        // Combine unique matches
        // const allMatches = [...new Set([...exactMatches, ...variationMatches])];
        const allMatches =
          variationMatches.length > 0 ? variationMatches : exactMatches;
        counts[tag] = allMatches.length;

        // Add the tag to mods that match variations but don't have the tag yet
        variationMatches.forEach((mod) => {
          if (!mod.addedTags.includes(tag)) {
            mod.addedTags.push(tag);
          }
        });
      });
    });

    setTagCounts(counts);

    const untagged = modpack.filter(
      (mod) => !mod.addedTags || mod.addedTags.length === 0
    );
    setUntaggedMods(untagged);
  }, [modpack]);

  const totalSlots = useMemo(
    () => customTags.reduce((total, item) => total + item.tags.length, 0),
    []
  );

  const filledSlots = useMemo(
    () => Object.values(tagCounts).filter((count) => count > 0).length,
    [tagCounts]
  );

  const totalSizeGb = useMemo(
    () =>
      (
        modpack.reduce((acc, mod) => {
          const size = parseInt(mod.file_size, 10);
          return acc + (Number.isNaN(size) ? 0 : size);
        }, 0) /
        (1024 * 1024 * 1024)
      ).toFixed(2),
    [modpack]
  );

  const slotProgress =
    totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;

  const inventoryMods = useMemo(() => {
    const query = inventorySearch.trim().toLowerCase();
    if (!query) return modpack;

    return modpack.filter((mod) => {
      const titleMatch = mod.title.toLowerCase().includes(query);
      const tagMatch = (mod.addedTags || []).some((tag) =>
        tag.toLowerCase().includes(query)
      );
      return titleMatch || tagMatch;
    });
  }, [modpack, inventorySearch]);

  const toggleUntagged = () => {
    setShowUntagged((open) => !open);
  };

  useEffect(() => {
    if (untaggedMods.length === 0) {
      setShowUntagged(false);
    }
  }, [untaggedMods.length]);

  const handleCardClick = (tag) => {
    if (tagCounts[tag] === 0) {
      // Filter mods for the selected tag
      const modsWithTag = mods.filter((mod) => mod.tags.includes(tag));
      setFilteredMods(modsWithTag);
      setShowPopup(true);
    } else {
      setExpandedCard(expandedCard === tag ? null : tag);
    }
  };

  const closePopup = () => {
    setShowPopup(false);
    setFilteredMods([]);
  };

  const closeModEditPopup = () => {
    setShowModEditPopup(false);
  };

  const editMod = (mod) => {
    setShowModEditPopup(true);
    setSelectedMod(mod);
  };

  const renderModRow = (mod) => (
    <div key={mod.id} className="inventory-row">
      <LazyImage
        src={mod.preview_url}
        alt=""
        className="inventory-thumb"
      />
      <div className="inventory-info">
        {mod.url ? (
          <a
            href={mod.url}
            className="inventory-title"
            target="_blank"
            rel="noopener noreferrer"
          >
            {mod.title}
          </a>
        ) : (
          <span className="inventory-title">{mod.title}</span>
        )}
        <div className="inventory-tags">
          {Array.isArray(mod.addedTags) && mod.addedTags.length > 0 ? (
            mod.addedTags.map((tag) => (
              <span key={tag} className="tag-pill">
                {tag}
              </span>
            ))
          ) : (
            <span className="inventory-untagged">No slots assigned</span>
          )}
        </div>
      </div>
      <div className="inventory-actions">
        <button type="button" onClick={() => editMod(mod)}>
          Edit
        </button>
        <button
          type="button"
          onClick={() => removeFromModpack(mod.id)}
          className="remove-button"
        >
          Remove
        </button>
      </div>
    </div>
  );

  return (
    <div id="modpack-creator" className="view active">
      <section className="modpack-overview">
        <div className="overview-header">
          <h3>Modpack Overview</h3>
          <button
            type="button"
            className="overview-expand-btn"
            onClick={() => setIsInventoryOpen((open) => !open)}
            aria-expanded={isInventoryOpen}
          >
            {isInventoryOpen ? 'Hide Mods' : 'View All Mods'}
          </button>
        </div>

        <div className="overview-stats">
          <div className="overview-stat">
            <span className="overview-stat-value">{modpack.length}</span>
            <span className="overview-stat-label">Mods</span>
          </div>
          <div className="overview-stat">
            <span className="overview-stat-value">
              {filledSlots}/{totalSlots}
            </span>
            <span className="overview-stat-label">Slots filled</span>
          </div>
          <div className="overview-stat">
            <span className="overview-stat-value">{totalSizeGb} GB</span>
            <span className="overview-stat-label">Total size</span>
          </div>
          {untaggedMods.length > 0 && (
            <button
              type="button"
              className={`overview-stat overview-stat-warning${
                showUntagged ? ' is-active' : ''
              }`}
              onClick={toggleUntagged}
              aria-expanded={showUntagged}
              aria-controls="untagged-mods-section"
            >
              <span className="overview-stat-value">{untaggedMods.length}</span>
              <span className="overview-stat-label">Untagged</span>
            </button>
          )}
        </div>

        <div
          className="overview-progress"
          role="progressbar"
          aria-valuenow={slotProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${filledSlots} of ${totalSlots} slots filled`}
        >
          <div
            className="overview-progress-bar"
            style={{ width: `${slotProgress}%` }}
          />
        </div>
        <p className="overview-progress-label">
          {filledSlots} of {totalSlots} collection slots filled ({slotProgress}%)
        </p>

        {isInventoryOpen && (
          <div className="overview-inventory">
            {modpack.length === 0 ? (
              <p className="overview-empty">
                No mods have been added yet. Import a collection or browse mods
                to get started.
              </p>
            ) : (
              <>
                <input
                  type="search"
                  className="overview-search"
                  placeholder="Search by title or slot tag..."
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                />
                <div className="inventory-list">
                  {inventoryMods.length === 0 ? (
                    <p className="overview-empty">
                      No mods match &ldquo;{inventorySearch}&rdquo;
                    </p>
                  ) : (
                    inventoryMods.map(renderModRow)
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </section>

      {showUntagged && untaggedMods.length > 0 ? (
        <div
          id="untagged-mods-section"
          className="untagged-mods-section"
        >
          <h3>Untagged Mods</h3>
          <div className="inventory-list">{untaggedMods.map(renderModRow)}</div>
        </div>
      ) : null}

      <div className="tag-stats">
        {/* <h3>Tag Overview</h3> */}
        {customTags.map((category) => (
          <div key={category.category} className="category-container">
            <h4>{category.category}</h4>
            <div className="tag-grid">
              {category.tags.map((tag) => (
                <TagCard
                  key={tag}
                  tag={tag}
                  count={tagCounts[tag] || 0}
                  category={category.category}
                  modpack={modpack}
                  onCardClick={handleCardClick}
                  isExpanded={expandedCard === tag}
                  onTagSearch={onTagSearch}
                  removeFromModpack={removeFromModpack}
                  editMod={editMod}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* <div id="mod-browser" className="view active">
          <List
            height={900}
            itemCount={filteredMods.length}
            itemSize={200}
            width="100%"
            overflow="none"
          >
            {ModCard}
          </List>
        </div> */}
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h3>Mods with selected tag</h3>
            <button onClick={closePopup}>Close</button>
            <ul>
              {filteredMods.map((mod) => (
                <li key={mod.id}>{mod.title}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {showModEditPopup && (
        <AddToModpack
          mod={selectedMod}
          modpack={modpack}
          onSave={onSave}
          onClose={closeModEditPopup}
        />
      )}
    </div>
  );
};

export default ModpackCreator;
