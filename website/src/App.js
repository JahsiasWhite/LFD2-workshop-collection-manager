import React, { useState, useEffect, useRef, useMemo, useCallback, useDeferredValue } from 'react';
import { FixedSizeList as List } from 'react-window';
import ModpackCreator from './ModpackCreator';
import AddToModpack from './AddToModpack';
import ImportCollection from './ImportCollection';
import ExportCollection from './ExportCollection';
import LazyImage from './components/LazyImage';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';
import ErrorState from './components/ErrorState';
import { useToast } from './contexts/ToastContext';
import {
  allTags,
  customTags,
  getSlotSearchTerm,
  slotSearchTags,
  survivorCategories,
} from './constants/tags';
import { getAutoAssignedSlots, modSuggestsMissingSlot } from './utils/slotMatching';
import {
  clearModpackState,
  loadModpackState,
  saveModpackState,
} from './utils/modpackStorage';
import { fetchJson, getErrorCopy } from './api';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/db';
const ITEM_HEIGHT = 196;
const SKELETON_ROWS = 4;
const PAGE_SIZE = 80;
const MODPACK_SLOTS = customTags.flatMap((category) => category.tags);

const App = () => {
  // Data
  const [mods, setMods] = useState([]);
  const [filteredMods, setFilteredMods] = useState([]);
  const [modpack, setModpack] = useState([]);
  const [originalCollection, setOriginalCollection] = useState([]);
  const [steamCollectionId, setSteamCollectionId] = useState('');
  const [modpackHydrated, setModpackHydrated] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sizeFilter, setSizeFilter] = useState({ min: 0, max: Infinity });
  const [sortBy, setSortBy] = useState('subscriptionsDesc');

  // Status
  const [loading, setLoading] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [slowLoad, setSlowLoad] = useState(false);
  const [listHeight, setListHeight] = useState(600);
  const abortRef = useRef(null);
  const loadingMoreRef = useRef(false);
  const modsRef = useRef([]);
  const hasMoreRef = useRef(true);
  const scanOffsetRef = useRef(0);
  const listHeightRef = useRef(600);
  const missingFilterRef = useRef({
    filterMissingOnly: false,
    missingSlots: [],
    browsingMissingSlot: false,
    missingBrowseSlot: '',
  });

  // UI
  const [view, setView] = useState('browser');
  const [showImportPopup, setShowImportPopup] = useState(false);
  const [showAddToModpack, setShowAddToModpack] = useState(false);
  const [showExportPopup, setShowExportPopup] = useState(false);

  const [selectedMod, setSelectedMod] = useState(null);
  const [missingBrowseSlot, setMissingBrowseSlot] = useState('');
  const [highlightMissingSlots, setHighlightMissingSlots] = useState(true);
  const [filterMissingOnly, setFilterMissingOnly] = useState(false);
  const [filterHideMaps, setFilterHideMaps] = useState(false);
  const [showBrowseFilters, setShowBrowseFilters] = useState(false);
  const browseFiltersRef = useRef(null);

  const modpackById = useMemo(
    () => new Map(modpack.map((entry) => [entry.id, entry])),
    [modpack]
  );

  const filledSlots = useMemo(() => {
    const slots = new Set();
    modpack.forEach((entry) => {
      (entry.addedTags || []).forEach((tag) => slots.add(tag));
    });
    return slots;
  }, [modpack]);

  const missingSlots = useMemo(
    () => MODPACK_SLOTS.filter((slot) => !filledSlots.has(slot)),
    [filledSlots]
  );
  const deferredMissingSlots = useDeferredValue(missingSlots);

  const browsingMissingSlot = Boolean(
    missingBrowseSlot && !filledSlots.has(missingBrowseSlot)
  );

  listHeightRef.current = listHeight;
  missingFilterRef.current = {
    filterMissingOnly,
    missingSlots,
    browsingMissingSlot,
    missingBrowseSlot,
  };

  const missingSlotSuggestions = useMemo(() => {
    const suggestions = new Map();
    if (
      (!highlightMissingSlots && !filterMissingOnly) ||
      deferredMissingSlots.length === 0
    ) {
      return suggestions;
    }

    const browsingSlot = browsingMissingSlot ? missingBrowseSlot : '';

    filteredMods.forEach((mod) => {
      suggestions.set(
        mod.id,
        modSuggestsMissingSlot(mod, deferredMissingSlots, customTags, {
          browsingSlot,
        })
      );
    });
    return suggestions;
  }, [
    filteredMods,
    deferredMissingSlots,
    browsingMissingSlot,
    missingBrowseSlot,
    highlightMissingSlots,
    filterMissingOnly,
  ]);

  const displayMods = useMemo(() => {
    if (!filterMissingOnly) return filteredMods;
    return filteredMods.filter((mod) => missingSlotSuggestions.get(mod.id));
  }, [filteredMods, filterMissingOnly, missingSlotSuggestions]);

  const modSuggestsMissing = useCallback(
    (mod) => missingSlotSuggestions.get(mod.id) ?? false,
    [missingSlotSuggestions]
  );

  // Toast notifications
  const { showError } = useToast();

  const buildModsUrl = useCallback(
    (offset, limit) => {
      const params = new URLSearchParams({
        offset: String(offset),
        limit: String(limit),
        search: debouncedSearch,
        tag: selectedTag,
        sortBy,
      });
      const { missingSlots, browsingMissingSlot } = missingFilterRef.current;
      if (
        filterMissingOnly &&
        missingSlots.length > 0 &&
        !browsingMissingSlot
      ) {
        params.set('missingSlots', JSON.stringify(missingSlots));
      }
      if (filterHideMaps) {
        params.set('hideMaps', '1');
      }
      return `${API_URL}/mods?${params}`;
    },
    [debouncedSearch, selectedTag, sortBy, filterMissingOnly, filterHideMaps]
  );

  const fetchMods = useCallback(
    async ({ reset = false } = {}) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      loadingMoreRef.current = true;
      setLoading(true);
      setError(null);
      if (reset) setIsReloading(true);

      const { filterMissingOnly } = missingFilterRef.current;

      try {
        if (reset) {
          modsRef.current = [];
          hasMoreRef.current = true;
          scanOffsetRef.current = 0;
          setMods([]);
          setFilteredMods([]);
        }

        while (!controller.signal.aborted) {
          const data = await fetchJson(
            buildModsUrl(scanOffsetRef.current, PAGE_SIZE),
            { signal: controller.signal }
          );

          if (controller.signal.aborted) return;

          if (data.error) {
            throw new Error(data.error);
          }

          const rows = data.mods || [];
          const existing = modsRef.current;
          const seen = new Set(existing.map((mod) => mod.id));
          const added = rows.filter((mod) => !seen.has(mod.id));
          const next = [...existing, ...added];
          modsRef.current = next;
          setMods(next);
          setFilteredMods(next);

          const parsedNext = Number(data.nextOffset);
          const prevOffset = scanOffsetRef.current;
          scanOffsetRef.current = Number.isFinite(parsedNext)
            ? parsedNext
            : scanOffsetRef.current + rows.length;

          const nextHasMore = Boolean(data.hasMore);
          hasMoreRef.current = nextHasMore;
          setHasMore(nextHasMore);

          if (reset) {
            setIsReloading(false);
          }

          // Keep scanning when the filter is on but this page was all duplicates
          // of mods we already have (common after filling slots without a reset).
          if (!filterMissingOnly || added.length > 0 || !nextHasMore) {
            break;
          }

          if (scanOffsetRef.current === prevOffset) {
            hasMoreRef.current = false;
            setHasMore(false);
            break;
          }
        }
      } catch (error) {
        if (error.name === 'AbortError' && !error.friendly) {
          return;
        }
        console.error('Error fetching mod data:', error);
        setError(error);
        if (!reset && modsRef.current.length > 0) {
          showError(getErrorCopy(error).message);
        }
      } finally {
        if (abortRef.current === controller) {
          loadingMoreRef.current = false;
          setLoading(false);
          setIsReloading(false);
        }
      }
    },
    [buildModsUrl, showError]
  );

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(searchTerm), 350);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  useEffect(() => {
    if (!showBrowseFilters) return undefined;

    const handleClickOutside = (event) => {
      if (
        browseFiltersRef.current &&
        !browseFiltersRef.current.contains(event.target)
      ) {
        setShowBrowseFilters(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showBrowseFilters]);

  useEffect(() => {
    fetchMods({ reset: true });
  }, [fetchMods]);

  const missingSlotsKey = missingSlots.join('\0');
  const prevMissingSlotsKeyRef = useRef(missingSlotsKey);

  useEffect(() => {
    if (!filterMissingOnly) {
      prevMissingSlotsKeyRef.current = missingSlotsKey;
      return;
    }
    if (prevMissingSlotsKeyRef.current === missingSlotsKey) return;
    prevMissingSlotsKeyRef.current = missingSlotsKey;

    // Slot set changed: the previous scan cursor belongs to a different query.
    scanOffsetRef.current = 0;
    hasMoreRef.current = true;
    setHasMore(true);
  }, [filterMissingOnly, missingSlotsKey]);

  useEffect(() => {
    if (!loading) {
      setSlowLoad(false);
      return;
    }
    const timeout = setTimeout(() => setSlowLoad(true), 4000);
    return () => clearTimeout(timeout);
  }, [loading]);

  useEffect(() => {
    const updateListHeight = () => {
      const header = document.querySelector('.app-header');
      const nav = document.querySelector('.nav-container');
      const used =
        (header?.offsetHeight || 0) + (nav?.offsetHeight || 0) + 72;
      setListHeight(Math.max(360, window.innerHeight - used));
    };

    updateListHeight();
    window.addEventListener('resize', updateListHeight);
    return () => window.removeEventListener('resize', updateListHeight);
  }, [view]);
  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
  };

  const loadMore = useCallback(() => {
    if (loadingMoreRef.current || !hasMoreRef.current) return;
    fetchMods({ reset: false });
  }, [fetchMods]);

  const handleScroll = useCallback(
    ({ scrollOffset, scrollUpdateWasRequested }) => {
      if (scrollUpdateWasRequested || !hasMore) return;

      const visibleCount = filterMissingOnly
        ? displayMods.length
        : filteredMods.length;

      if (visibleCount === 0) {
        if (filteredMods.length > 0) loadMore();
        return;
      }

      const totalHeight = visibleCount * ITEM_HEIGHT;
      const viewportBottom = scrollOffset + listHeight;
      const preloadThreshold = totalHeight - listHeight * 2;

      if (viewportBottom >= preloadThreshold) {
        loadMore();
      }
    },
    [
      hasMore,
      filteredMods.length,
      displayMods.length,
      filterMissingOnly,
      listHeight,
      loadMore,
    ]
  );

  useEffect(() => {
    if (loading || !hasMore) return;

    const visibleCount = filterMissingOnly
      ? displayMods.length
      : filteredMods.length;

    if (visibleCount === 0) {
      if (filteredMods.length > 0) loadMore();
      return;
    }

    const contentHeight = visibleCount * ITEM_HEIGHT;
    if (contentHeight <= listHeight * 1.5) {
      loadMore();
    }
  }, [
    displayMods.length,
    filteredMods.length,
    filterMissingOnly,
    listHeight,
    hasMore,
    loading,
    loadMore,
  ]);

  const updateModSlots = (mod, slots) => {
    setModpack((prevModpack) => {
      const index = prevModpack.findIndex((m) => m.id === mod.id);
      if (index === -1) {
        return [...prevModpack, { ...mod, addedTags: [...slots] }];
      }
      const updatedModpack = [...prevModpack];
      updatedModpack[index] = {
        ...updatedModpack[index],
        addedTags: [...slots],
      };
      return updatedModpack;
    });
  };

  const removeFromModpack = (modId) => {
    setModpack(modpack.filter((mod) => mod.id !== modId));
  };

  const closeAddToModpackPopup = () => {
    setShowAddToModpack(false);
    setSelectedMod(null);
  };

  const filterAndSortMods = (mods) => {
    // TODO: I should add some of this to the backend
    // let result = mods.filter((mod) => {
    //   const titleMatch = mod.title
    //     .toLowerCase()
    //     .includes(searchTerm.toLowerCase());
    //   const tagMatch = selectedTag === '' || mod.tags.includes(selectedTag);
    //   const sizeMatch =
    //     mod.file_size >= sizeFilter.min * 1024 * 1024 &&
    //     mod.file_size <= sizeFilter.max * 1024 * 1024;

    //   let categoryMatch = true;
    //   // if (selectedCategory !== '' && selectedCategory !== 'Extras') {
    //   //   categoryMatch = mod.tags.length <= 6;
    //   // }

    //   return titleMatch && tagMatch && sizeMatch && categoryMatch;
    // });
    const result = mods;

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
    setMissingBrowseSlot('');
  };

  const ModCardSkeleton = ({ style }) => (
    <div style={style}>
      <div className="mod-card mod-card-skeleton-row" aria-hidden="true">
        <div className="skeleton-thumb" />
        <div className="skeleton-body">
          <div className="skeleton-line wide" />
          <div className="skeleton-line" />
          <div className="skeleton-line short" />
        </div>
      </div>
    </div>
  );

  const ModCard = ({ index, style }) => {
    if (index >= displayMods.length) {
      return <ModCardSkeleton style={style} />;
    }

    const mod = displayMods[index];
    const modpackEntry = modpackById.get(mod.id);
    const assignedSlots = modpackEntry?.addedTags || [];
    const isInModpack = Boolean(modpackEntry);
    const fillsMissingSlot = modSuggestsMissing(mod);
    const highlightCard = highlightMissingSlots && fillsMissingSlot;

    return (
      <div style={style}>
        <div
          className={[
            'mod-card',
            highlightCard ? 'mod-card-missing-slot' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <LazyImage
            src={mod.preview_url}
            alt={mod.title}
            className="mod-card-img"
          />

          <div className="mod-card-body">
            <h3 className="mod-title">{mod.title}</h3>
            <div className="mod-card-meta">
              <span>
                {(mod.subscriptions || 0).toLocaleString()} subscriptions
              </span>
              <span>
                {(mod.file_size / 1024 / 1024).toFixed(2)} MB
              </span>
              {isInModpack && <span className="modpack-status">Added</span>}
            </div>
            {isInModpack && assignedSlots.length > 0 ? (
              <div className="mod-card-slots">
                {assignedSlots.map((slot) => (
                  <span key={slot} className="tag-pill">
                    {slot}
                  </span>
                ))}
              </div>
            ) : (
              <div className="mod-card-tags">
                {(mod.tags || []).map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div className="mod-card-actions">
              <a href={mod.url} target="_blank" rel="noopener noreferrer">
                View on Steam
              </a>
              <button
                className={`add-to-modpack ${isInModpack ? 'in-modpack' : ''}`}
                data-mod-id={mod.id}
                onClick={() => handleAddToModpackClick(mod)}
              >
                {isInModpack ? 'Edit Slots' : 'Add to Modpack'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const fetchModsByIds = async (modIds) => {
    try {
      const data = await fetchJson(`${API_URL}/mods/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ modIds: Array.from(modIds) }),
      });
      if (data.error) return [];
      return data.mods;
    } catch (error) {
      console.error('Error fetching mods by IDs:', error);
      showError(getErrorCopy(error).message);
      return [];
    }
  };

  useEffect(() => {
    let cancelled = false;

    const hydrateModpack = async () => {
      const stored = loadModpackState();
      if (!stored || stored.modpack.length === 0) {
        if (!cancelled) setModpackHydrated(true);
        return;
      }

      const allIds = new Set([
        ...stored.modpack.map((entry) => entry.id),
        ...stored.originalCollection,
      ]);

      const mods = await fetchModsByIds(allIds);
      if (cancelled) return;

      const modById = new Map(mods.map((mod) => [String(mod.id), mod]));

      const hydratedModpack = stored.modpack
        .map(({ id, addedTags }) => {
          const mod = modById.get(String(id));
          return mod ? { ...mod, addedTags: [...addedTags] } : null;
        })
        .filter(Boolean);

      const hydratedOriginal = stored.originalCollection
        .map((id) => modById.get(String(id)))
        .filter(Boolean);

      setModpack(hydratedModpack);
      setOriginalCollection(hydratedOriginal);
      setSteamCollectionId(stored.steamCollectionId || '');
      setModpackHydrated(true);
    };

    hydrateModpack();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!modpackHydrated) return undefined;

    const timeout = setTimeout(() => {
      if (modpack.length === 0 && originalCollection.length === 0) {
        clearModpackState();
      } else {
        saveModpackState(modpack, originalCollection, steamCollectionId);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [modpack, originalCollection, steamCollectionId, modpackHydrated]);

  const handleImportCollection = async (collection, collectionId = '') => {
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
    if (collectionId) {
      setSteamCollectionId(String(collectionId));
    }

    setModpack((prevModpack) => {
      const updatedModpack = [...prevModpack];
      modsToAdd.forEach((mod) => {
        if (!updatedModpack.some((m) => m.id === mod.id)) {
          const addedTags = getAutoAssignedSlots(mod, customTags);
          updatedModpack.push({ ...mod, addedTags });
        }
      });
      return updatedModpack;
    });

    console.log(`Added ${modsToAdd.length} mods to the modpack`);

    // maybe update filteredMods here?
    // filterAndSortMods();
  };

  const handleTagSearch = (search) => {
    const foundCategory = customTags.find((categoryObj) =>
      categoryObj.tags.includes(search)
    );

    if (!foundCategory) {
      console.error('Tag not found in any category');
      return;
    }

    setMissingBrowseSlot(filledSlots.has(search) ? '' : search);

    if (slotSearchTags[search]) {
      setSelectedTag(slotSearchTags[search]);
    } else if (foundCategory.category === 'Extras') {
      setSelectedTag('Miscellaneous');
    } else if (survivorCategories.has(foundCategory.category)) {
      setSelectedTag(search);
    } else {
      setSelectedTag('');
    }

    const query = getSlotSearchTerm(search);
    modsRef.current = [];
    hasMoreRef.current = true;
    scanOffsetRef.current = 0;
    setMods([]);
    setFilteredMods([]);
    setIsReloading(true);
    setSearchTerm(query);
    setDebouncedSearch(query);

    setView('browser');
  };

  const errorCopy = error ? getErrorCopy(error) : null;
  const showSkeletonRows = loading && hasMore && displayMods.length > 0;
  const listItemCount =
    displayMods.length + (showSkeletonRows ? SKELETON_ROWS : 0);
  const allSlotsFilled = missingSlots.length === 0;
  const filterHidAllResults =
    filterMissingOnly && displayMods.length === 0 && filteredMods.length > 0;
  const awaitingFilteredResults = filterHidAllResults && hasMore;
  const activeBrowseFilterCount =
    (highlightMissingSlots ? 1 : 0) +
    (filterMissingOnly ? 1 : 0) +
    (filterHideMaps ? 1 : 0);
  const browseFiltersActive = activeBrowseFilterCount > 0;

  return (
    <ErrorBoundary>
      <div className="app">
        <header className="app-header">
          <img src="hand.png" alt="" className="app-logo" />
          <div>
            <h1>L4D2 Collection Manager</h1>
            <p className="header-desc">
              Find mods, fill missing slots, and keep your collection organized
            </p>
          </div>
        </header>

        <div className="nav-container">
          {view === 'modpack' ? (
            <div className="modpack-actions">
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      'Are you sure you want to remove all mods?'
                    )
                  ) {
                    setModpack([]);
                    setOriginalCollection([]);
                    setSteamCollectionId('');
                    clearModpackState();
                  }
                }}
                className="remove-button"
              >
                Remove All
              </button>
              <button onClick={() => setShowImportPopup(true)}>
                Import
              </button>
              <button onClick={() => setShowExportPopup(true)}>
                Export
              </button>
            </div>
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
              <div className="browser-filter-wrap" ref={browseFiltersRef}>
                <button
                  type="button"
                  className={[
                    'browser-filter-btn',
                    browseFiltersActive ? 'is-active' : '',
                    showBrowseFilters ? 'is-open' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => setShowBrowseFilters((open) => !open)}
                  aria-expanded={showBrowseFilters}
                  aria-haspopup="dialog"
                  aria-label={
                    activeBrowseFilterCount > 0
                      ? `Browse filters, ${activeBrowseFilterCount} active`
                      : 'Browse filters'
                  }
                  title={
                    activeBrowseFilterCount > 0
                      ? `Filters (${activeBrowseFilterCount} active)`
                      : 'Filters'
                  }
                >
                  <svg
                    className="browser-filter-icon"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fill="currentColor"
                      d="M4 5h16v2.1l-6.4 7.5V19l-3.2 1.6V14.6L4 7.1V5zm2 2.2 5.6 6.6v4.3l1.2-.6v-3.7L18.4 7.2H6z"
                    />
                  </svg>
                  {activeBrowseFilterCount > 0 && (
                    <span className="browser-filter-count" aria-hidden="true">
                      {activeBrowseFilterCount}
                    </span>
                  )}
                </button>
                {showBrowseFilters && (
                  <div
                    className="browser-filter-panel"
                    role="dialog"
                    aria-label="Browse filters"
                  >
                    <p className="browser-filter-panel-title">Filters</p>
                    <label className="browser-option">
                      <input
                        type="checkbox"
                        checked={highlightMissingSlots}
                        onChange={(e) =>
                          setHighlightMissingSlots(e.target.checked)
                        }
                      />
                      Highlight missing slots
                    </label>
                    <label className="browser-option">
                      <input
                        type="checkbox"
                        checked={filterMissingOnly}
                        onChange={(e) =>
                          setFilterMissingOnly(e.target.checked)
                        }
                        disabled={allSlotsFilled}
                      />
                      Missing slots only
                    </label>
                    <label className="browser-option">
                      <input
                        type="checkbox"
                        checked={filterHideMaps}
                        onChange={(e) => setFilterHideMaps(e.target.checked)}
                      />
                      Hide maps
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}

          <nav className="view-tabs" aria-label="Primary">
            <button
              type="button"
              className={`view-tab ${view === 'browser' ? 'active' : ''}`}
              onClick={() => setView('browser')}
            >
              Browse Mods
            </button>
            <button
              type="button"
              className={`view-tab ${view === 'modpack' ? 'active' : ''}`}
              onClick={() => setView('modpack')}
            >
              Manage Modpack
              {modpack.length > 0 && (
                <span className="tab-count">{modpack.length}</span>
              )}
            </button>
          </nav>
        </div>

        {view === 'browser' ? (
          <div id="mod-browser" className="view active">
            {isReloading || (loading && displayMods.length === 0 && filteredMods.length === 0) ? (
              <div
                className="mod-list-panel"
                style={{ height: listHeight }}
              >
                <LoadingSpinner
                  size="large"
                  message={
                    slowLoad
                      ? 'Still working — the server may be waking up...'
                      : 'Loading mods...'
                  }
                />
              </div>
            ) : error && displayMods.length === 0 && filteredMods.length === 0 ? (
              <ErrorState
                title={errorCopy.title}
                message={errorCopy.message}
                onRetry={() => fetchMods({ reset: true })}
              />
            ) : awaitingFilteredResults ? (
              <div
                className="mod-list-panel"
                style={{ height: listHeight }}
              >
                <LoadingSpinner
                  size="large"
                  message="Finding mods for your missing slots..."
                />
              </div>
            ) : displayMods.length === 0 ? (
              <div className="empty-state">
                <h2>No mods found</h2>
                <p>
                  {filterHidAllResults
                    ? 'No mods match your missing slots for this search.'
                    : allSlotsFilled && filterMissingOnly
                      ? 'All collection slots are filled.'
                      : 'Try a different search, tag, or sort. Workshop titles are matched as you type.'}
                </p>
              </div>
            ) : (
              <>
                <List
                  height={listHeight}
                  itemCount={listItemCount}
                  itemSize={ITEM_HEIGHT}
                  width="100%"
                  className="mod-list"
                  onScroll={handleScroll}
                >
                  {ModCard}
                </List>
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
            onSave={updateModSlots}
          />
        )}

        {showAddToModpack && selectedMod && (
          <AddToModpack
            mod={selectedMod}
            modpack={modpack}
            onClose={closeAddToModpackPopup}
            onSave={updateModSlots}
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
          <div className="popup-overlay">
            <ExportCollection
              modpack={modpack}
              originalCollection={originalCollection}
              steamCollectionId={steamCollectionId}
              onClose={() => setShowExportPopup(false)}
            />
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App;
