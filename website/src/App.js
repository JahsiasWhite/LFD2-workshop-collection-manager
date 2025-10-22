import React, { useState, useEffect, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
// import AutoSizer from "react-virtualized-auto-sizer";
import ModpackCreator from './ModpackCreator';
import AddToModpack from './AddToModpack';
import ImportCollection from './ImportCollection';
import ExportCollection from './ExportCollection';
import LazyImage from './LazyImage';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';
import { useToast } from './contexts/ToastContext';
import { allTags, customTags } from './constants/tags';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/db';

const App = () => {
  const [mods, setMods] = useState([]);
  const [filteredMods, setFilteredMods] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('subscriptionsDesc');
  const [view, setView] = useState('browser');
  const [modpack, setModpack] = useState([]);
  const [sizeFilter, setSizeFilter] = useState({ min: 0, max: Infinity });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  const [showImportPopup, setShowImportPopup] = useState(false);
  const [showAddToModpack, setShowAddToModpack] = useState(false);
  const [showExportPopup, setShowExportPopup] = useState(false);

  const [selectedMod, setSelectedMod] = useState(null);

  // HMMM???
  const [originalCollection, setOriginalCollection] = useState([]);

  // Toast notifications
  const { showSuccess, showError, showWarning } = useToast();

  // useEffect(() => {
  //   const fetchMods = async () => {
  //     try {
  //       setLoading(true);
  //       const response = await fetch(
  //         `http://localhost:3000/api/db/mods?page=${page}`
  //       );
  //       const data = await response.json();

  //       if (page === 1) {
  //         setMods(data.mods);
  //         setFilteredMods(data.mods);
  //       } else {
  //         setMods((prevMods) => [...prevMods, ...data.mods]);
  //         setFilteredMods((prevMods) => [...prevMods, ...data.mods]);
  //       }

  //       setHasMore(data.hasMore);
  //       console.error('TOTAL NUMBER OF MODS: ', data.total);
  //     } catch (error) {
  //       console.error('Error fetching mod data:', error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchMods();
  // }, [page]);

  const fetchMods = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_URL}/mods?page=${page}&search=${searchTerm}&tag=${selectedTag}&sortBy=${sortBy}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const newMods = data.mods.filter(
        (newMod) => !mods.some((existingMod) => existingMod.id === newMod.id)
      );

      let modTemp = [];
      if (mods.length === 0) {
        modTemp = newMods;
        setMods(newMods);
        setFilteredMods(newMods);
      } else {
        modTemp = [...mods, ...newMods];
        setMods((prevMods) => [...prevMods, ...newMods]);
        setFilteredMods((prevMods) => [...prevMods, ...newMods]);
      }

      setHasMore(data.hasMore);
      filterAndSortMods(modTemp);

      if (page === 1) {
        showSuccess(`Loaded mods`);
      }
    } catch (error) {
      console.error('Error fetching mod data:', error);
      setError(error.message);
      showError(`Failed to load mods: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchMods();
  }, [page, searchTerm, selectedTag, sortBy]); // Add search dependencies
  // Reset page when search terms change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedTag]);
  const handleSortChange = (newSortBy) => {
    setMods([]);
    setFilteredMods([]);
    setPage(1);
    setSortBy(newSortBy);
  };

  // Simple scroll handler
  const handleScroll = ({ scrollOffset, scrollUpdateWasRequested }) => {
    if (scrollUpdateWasRequested || loading || !hasMore) return;

    // If we're near the bottom (within 1000px), load more
    if (scrollOffset > filteredMods.length * 230 - 1000) {
      setPage((p) => p + 1);
    }
  };

  const addToModpack = (mod, slot) => {
    const existingModIndex = modpack.findIndex((m) => m.id === mod.id);

    if (existingModIndex === -1) {
      // If mod is not in modpack, add it with the new tag
      if (mod.addedTags === undefined) mod.addedTags = [];
      mod.addedTags.push(slot);
      setModpack([...modpack, mod]);
    } else {
      // If mod exists in modpack, update its addedTags
      const updatedModpack = [...modpack];
      if (!updatedModpack[existingModIndex].addedTags) {
        updatedModpack[existingModIndex].addedTags = [];
      }

      if (!updatedModpack[existingModIndex].addedTags.includes(slot)) {
        updatedModpack[existingModIndex].addedTags.push(slot);
      }

      console.error(updatedModpack[existingModIndex]);
      setModpack(updatedModpack); // Update state with the modified modpack

      // mod.addedTags = [];
      // mod.addedTags.push(slot);
      // setModpack([...modpack, mod]);
    }
  };

  const removeFromModpack = (modId) => {
    setModpack(modpack.filter((mod) => mod.id !== modId));
  };

  const closeAddToModpackPopup = () => {
    setShowAddToModpack(false);
    setSelectedMod(null);
  };

  // const filterAndSortMods = useCallback(() => {
  //   let result = mods.filter((mod) => {
  //     const titleMatch = mod.title
  //       .toLowerCase()
  //       .includes(searchTerm.toLowerCase());
  //     const tagMatch = selectedTag === '' || mod.tags.includes(selectedTag);
  //     const sizeMatch =
  //       mod.file_size >= sizeFilter.min * 1024 * 1024 &&
  //       mod.file_size <= sizeFilter.max * 1024 * 1024;

  //     let categoryMatch = true;
  //     if (selectedCategory !== '' && selectedCategory !== 'Extras') {
  //       categoryMatch = mod.tags.length <= 6;
  //     }

  //     return titleMatch && tagMatch && sizeMatch && categoryMatch;
  //   });

  //   switch (sortBy) {
  //     case 'subscriptionsDesc':
  //       result.sort((a, b) => b.subscriptions - a.subscriptions);
  //       break;
  //     case 'subscriptionsAsc':
  //       result.sort((a, b) => a.subscriptions - b.subscriptions);
  //       break;
  //     case 'titleAsc':
  //       result.sort((a, b) => a.title.localeCompare(b.title));
  //       break;
  //     case 'titleDesc':
  //       result.sort((a, b) => b.title.localeCompare(a.title));
  //       break;
  //     case 'fileSize':
  //       result.sort((a, b) => b.file_size - a.file_size);
  //       break;
  //     default:
  //       break;
  //   }

  //   setFilteredMods(result);
  // }, [mods, searchTerm, selectedTag, sortBy, sizeFilter]);
  const filterAndSortMods = (mods) => {
    let result = mods.filter((mod) => {
      const titleMatch = mod.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const tagMatch = selectedTag === '' || mod.tags.includes(selectedTag);
      const sizeMatch =
        mod.file_size >= sizeFilter.min * 1024 * 1024 &&
        mod.file_size <= sizeFilter.max * 1024 * 1024;

      let categoryMatch = true;
      if (selectedCategory !== '' && selectedCategory !== 'Extras') {
        categoryMatch = mod.tags.length <= 6;
      }

      return titleMatch && tagMatch && sizeMatch && categoryMatch;
    });

    // TODO: MAJOR GLITCH
    // Basically, MongoDB sorts way different. EX: Emoji is end of Mongo list but start of our list
    switch (sortBy) {
      case 'subscriptionsDesc':
        result.sort((a, b) => b.subscriptions - a.subscriptions);
        break;
      case 'subscriptionsAsc':
        result.sort((a, b) => a.subscriptions - b.subscriptions);
        break;
      case 'titleAsc':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'titleDesc':
        result.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'fileSize':
        result.sort((a, b) => b.file_size - a.file_size);
        break;
      default:
        break;
    }

    setFilteredMods(result);
  };

  // TODO This infinetly runs???
  // useEffect(() => {
  //   filterAndSortMods();
  // }, [filterAndSortMods]);

  const handleAddToModpackClick = (mod) => {
    setSelectedMod(mod);
    setShowAddToModpack(true);
  };

  const updateSelectedTag = (tag) => {
    const selectedCategory =
      tag.options[tag.selectedIndex].getAttribute('data-category');

    // A lot of scripting mods include every tag. This muddys the list because
    // the user will just see the same mods every time. WE MUST DESTROY THEM
    setSelectedCategory(selectedCategory);

    setSelectedTag(tag.value);
  };

  const ModCard = ({ index, style }) => {
    const mod = filteredMods[index];
    return (
      <div className="mod-card" style={style}>
        {/* <img className="mod-card-img" src={mod.preview_url} alt={mod.title} />
         */}
        <LazyImage
          src={mod.preview_url}
          alt={mod.title}
          className="mod-card-img"
        />

        <div style={{ marginLeft: '10px' }}>
          <h3>{mod.title}</h3>
          <p>Subscriptions: {mod.subscriptions}</p>
          <p>File Size: {(mod.file_size / 1024 / 1024).toFixed(2)} MB</p>
          <div>
            {mod.tags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
          <a href={mod.url} target="_blank" rel="noopener noreferrer">
            View on Steam
          </a>
          <button
            className="add-to-modpack"
            data-mod-id={mod.id}
            onClick={() => handleAddToModpackClick(mod)}
          >
            Add to Modpack
          </button>
        </div>
      </div>
    );
  };

  const fetchModsByIds = async (modIds) => {
    console.error(modIds, JSON.stringify(modIds));
    try {
      const response = await fetch(`${API_URL}/mods/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ modIds: Array.from(modIds) }),
      });
      const data = await response.json();
      if (data.error) return [];
      return data.mods;
    } catch (error) {
      console.error('Error fetching mods by IDs:', error);
      return [];
    }
  };

  const handleImportCollection = async (collection) => {
    if (!collection.children || !Array.isArray(collection.children)) {
      console.error('Invalid collection format');
      return;
    }

    const importedModIds = new Set(
      collection.children.map((child) => child.publishedfileid)
    );

    const modsToAdd = await fetchModsByIds(importedModIds);

    // const modsToAdd = mods.filter((mod) =>
    //   importedModIds.has(mod.id.toString())
    // );

    if (modsToAdd.length === 0) {
      console.log('No matching mods found in the collection');
      return;
    }

    // Save the imported mods separately
    setOriginalCollection(modsToAdd);

    setModpack((prevModpack) => {
      const updatedModpack = [...prevModpack];
      modsToAdd.forEach((mod) => {
        if (!updatedModpack.some((m) => m.id === mod.id)) {
          // if (mod.addedTags === undefined) mod.addedTags = [];
          mod.addedTags = mod.tags;
          addCustomTags(mod);

          updatedModpack.push(mod);
        }
      });
      return updatedModpack;
    });

    console.log(`Added ${modsToAdd.length} mods to the modpack`);

    // Optionally, you might want to update filteredMods here if needed
    // filterAndSortMods();
  };

  const addCustomTags = (mod) => {
    customTags.forEach((category) => {
      category.tags.forEach((tag) => {
        // Convert both the tag and the mod title to lowercase for case-insensitive matching
        if (
          mod.title.toLowerCase().includes(tag.toLowerCase()) ||
          (tag === 'Fence' && mod.title.toLowerCase().includes('Fenc'))
        ) {
          // Check if the tag is already in addedTags to avoid duplicates
          if (!mod.addedTags.includes(tag)) {
            mod.addedTags.push(tag);
          }
        }
      });
    });
  };

  const handleTagSearch = (search) => {
    // Find the category that contains the searched tag
    const foundCategory = customTags.find((categoryObj) =>
      categoryObj.tags.includes(search)
    );
    console.error(foundCategory, foundCategory.category);
    if (foundCategory.category === 'Survivors') {
      setSelectedTag(search);
    } else if (foundCategory.category === 'Extras') {
      setSelectedTag('Miscellaneous');
    } else {
      setSelectedTag('');
    }
    setSearchTerm(search);

    setView('browser');
  };

  return (
    <ErrorBoundary>
      <div className="app">
        <header className="app-header">
          <img src="hand.png" alt="hand" height={100} width={100} />
          <div>
            <h1>Left 4 Dead 2 Mod Browser</h1>
            <p className="header-desc">
              Find and organize your favorite mods and collections
            </p>
          </div>
        </header>

        <div className="nav-container">
          {view === 'modpack' ? (
            <div></div>
          ) : (
            <div className="search-container">
              <input
                type="text"
                id="search-input"
                placeholder="Search mods..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                id="tag-select"
                value={selectedTag}
                onChange={(e) => updateSelectedTag(e.target)}
              >
                <option value="">All Tags</option>
                {allTags.map((category) => (
                  <optgroup key={category.category} label={category.category}>
                    {category.tags.map((tag) => (
                      <option
                        key={tag}
                        value={tag}
                        data-category={category.category}
                      >
                        {tag}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
              >
                <option value="subscriptionsDesc">Most Subscriptions</option>
                <option value="subscriptionsAsc">Least Subscriptions</option>
                <option value="titleAsc">Title A-Z</option>
                <option value="titleDesc">Title Z-A</option>
                <option value="fileSize">File Size</option>
              </select>
            </div>
          )}

          <nav>
            {view === 'browser' ? (
              'browser'
            ) : (
              <>
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        'Are you sure you want to remove all mods?'
                      )
                    ) {
                      setModpack([]);
                      setOriginalCollection([]);
                    }
                  }}
                  className="remove-button"
                >
                  Remove All Mods
                </button>
                <button onClick={() => setShowImportPopup(true)}>
                  Import Collection
                </button>
                <button onClick={() => setShowExportPopup(true)}>
                  Export Collection
                </button>
              </>
            )}
            <button
              onClick={() =>
                setView(view === 'browser' ? 'modpack' : 'browser')
              }
            >
              {view === 'browser' ? 'Manage Modpack' : 'Browse Mods'}
            </button>
          </nav>
        </div>

        {view === 'browser' ? (
          <div id="mod-browser" className="view active">
            {error && (
              <div className="error-message">
                <p>Error: {error}</p>
                <button onClick={() => fetchMods()}>Retry</button>
              </div>
            )}
            {loading && page === 1 ? (
              <LoadingSpinner message="Loading mods..." />
            ) : (
              <>
                <List
                  height={900}
                  itemCount={filteredMods.length}
                  itemSize={230}
                  width="100%"
                  style={{ overflowX: 'hidden', borderRadius: '8px' }}
                  onScroll={handleScroll}
                >
                  {ModCard}
                </List>
                {loading && page > 1 && (
                  <div className="loading-more">
                    <LoadingSpinner
                      size="small"
                      message="Loading more mods..."
                    />
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <ModpackCreator
            mods={mods}
            modpack={modpack}
            removeFromModpack={removeFromModpack}
            onTagSearch={handleTagSearch}
            allTags={allTags}
            onAdd={addToModpack}
          />
        )}

        {showAddToModpack && selectedMod && (
          <AddToModpack
            mod={selectedMod}
            // allTags={allTags}
            onClose={closeAddToModpackPopup}
            onAdd={addToModpack}
            highlightedTag={searchTerm}
          />
        )}
        {showImportPopup && (
          <ImportCollection
            onImport={handleImportCollection}
            onClose={() => setShowImportPopup(false)}
          />
        )}
        {showExportPopup && (
          <ExportCollection
            modpack={modpack}
            originalCollection={originalCollection}
            onClose={() => setShowExportPopup(false)}
          />
        )}

        <div className="footer"></div>
      </div>
    </ErrorBoundary>
  );
};

export default App;
