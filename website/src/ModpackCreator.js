import React, { useState, useEffect, memo, useMemo } from 'react';

import './ModpackCreator.css';

import TagCard from './components/TagCard';
import AddToModpack from './AddToModpack';
import { allTags, tagVariations } from './constants/tags';

const ModpackCreator = ({
  mods,
  modpack,
  removeFromModpack,
  onTagSearch,
  onAdd,
}) => {
  const [tagCounts, setTagCounts] = useState({});
  const [isModpackListOpen, setIsModpackListOpen] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);

  const [showPopup, setShowPopup] = useState(false);
  const [showModEditPopup, setShowModEditPopup] = useState(false);

  const [filteredMods, setFilteredMods] = useState([]);
  const [untaggedMods, setUntaggedMods] = useState([]);

  // Function to normalize text for comparison
  const normalizeText = (text) => {
    return (
      text
        .toLowerCase()
        .replace(/[-_]/g, '') // Remove hyphens and underscores
        // .replace(/\s+/g, '') // Remove spaces
        .trim()
    );
  };

  // Function to check if a mod's title or tags match any variations
  const matchesTagVariation = (mod, standardTag, variations) => {
    const normalizedTitle = normalizeText(mod.title);
    const normalizedTags = mod.tags.map((tag) => normalizeText(tag));

    // Check if the standard tag itself is included
    if (mod.addedTags.includes(standardTag)) {
      return true;
    }

    // Check all variations
    return variations.some((variation) => {
      const normalizedVariation = normalizeText(variation);
      return (
        normalizedTitle.includes(normalizedVariation) ||
        normalizedTags.some((tag) => tag.includes(normalizedVariation))
      );
    });
  };

  useEffect(() => {
    const counts = {};
    allTags.forEach((category) => {
      category.tags.forEach((tag) => {
        // Count mods that have the exact tag
        const exactMatches = modpack.filter((mod) =>
          mod.addedTags.includes(tag)
        );

        // Count mods that match variations
        const variationMatches = tagVariations[tag]
          ? modpack.filter((mod) =>
              matchesTagVariation(mod, tag, tagVariations[tag])
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

  const toggleModpackList = () => {
    // Don't open the list if there are no mods to show
    // if (!isModpackListOpen && modpack.length === 0) {
    //   return;
    // }

    setIsModpackListOpen(!isModpackListOpen);
  };

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
    // setFilteredMods([]);
  };

  const [selectedMod, setSelectedMod] = useState(null);
  const editMod = (mod) => {
    setShowModEditPopup(true);
    setSelectedMod(mod);
  };

  return (
    <div id="modpack-creator" className="view active">
      <h2>Modpack Creator</h2>

      <div id="modpack-stats">
        <p>Total mods: {modpack.length}</p>
        <p>
          Total moddable items:{' '}
          {allTags.reduce((total, item) => total + item.tags.length, 0)}
        </p>
        <p>
          Total size:{' '}
          {(
            modpack.reduce((acc, mod) => {
              const size = parseInt(mod.file_size);
              return acc + (isNaN(size) ? 0 : size);
            }, 0) /
            (1024 * 1024 * 1024)
          ).toFixed(2)}
          GB
        </p>
      </div>

      <div className="modpack-list-container">
        <button onClick={toggleModpackList} className="toggle-list-button">
          {isModpackListOpen ? 'Hide' : 'Show'} Modpack List ({modpack.length}{' '}
          mods)
        </button>
        {isModpackListOpen && (
          <div className="modpack-list">
            {modpack.length === 0 ? (
              <p>
                No mods have been added yet! Import a collection or browse mods
                to get started.
              </p>
            ) : (
              <>
                {/* Header row */}
                <div className="list-header modpack-item">
                  <span className="col-title">Title</span>
                  <span className="col-tags">Tags</span>
                  <span className="col-actions">Actions</span>
                </div>
                {modpack.map((mod) => (
                  <div key={mod.id} className="list-item modpack-item">
                    <span>{mod.title}</span>
                    <span className="col-tags">
                      {Array.isArray(mod.addedTags)
                        ? mod.addedTags.map((tag) => (
                            <span key={tag} className="tag-pill">
                              {tag}
                            </span>
                          ))
                        : mod.addedTags}
                    </span>
                    <div>
                      <button onClick={() => editMod(mod)}>Edit</button>
                      <button
                        onClick={() => removeFromModpack(mod.id)}
                        className="remove-button"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      <div className="untagged-mods-section">
        <h3>Untagged Mods</h3>
        {untaggedMods.length > 0 ? (
          <ul className="untagged-mods-list">
            {untaggedMods.map((mod) => (
              <li key={mod.id} className="untagged-mod-item">
                <span>{mod.title}</span>
                <div>
                  <button onClick={() => editMod(mod)}>Edit</button>
                  <button
                    onClick={() => removeFromModpack(mod.id)}
                    className="remove-button"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>No untagged mods in the modpack.</p>
        )}
      </div>

      <div className="tag-stats">
        <h3>Tag Overview</h3>
        {allTags.map((category) => (
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
          onAdd={onAdd}
          onClose={closeModEditPopup}
          // highlightedTag={'searchedTag'}
        />
      )}
    </div>
  );
};

export default ModpackCreator;
