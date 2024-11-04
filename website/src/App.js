import React, { useState, useEffect, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
// import AutoSizer from "react-virtualized-auto-sizer";
import ModpackCreator from './ModpackCreator';
import AddToModpack from './AddToModpack';
import ImportCollection from './ImportCollection';
import ExportCollection from './ExportCollection';
import LazyImage from './LazyImage';

const allTags = [
  {
    category: 'Survivors',
    tags: [
      'Survivors',
      'Bill',
      'Francis',
      'Zoey',
      'Louis',
      'Coach',
      'Ellis',
      'Nick',
      'Rochelle',
    ],
  },

  {
    category: 'Infected',
    tags: [
      'Common Infected',
      'Special Infected',
      'Hunter',
      'Smoker',
      'Boomer',
      'Jockey',
      'Spitter',
      'Charger',
      'Witch',
      'Tank',
    ],
  },

  {
    category: 'Weapons',
    tags: [
      'Weapons',
      'Shotgun',
      'Grenade Launcher',
      'Rifle',
      'M60',
      'Melee',
      'SMG',
      'Pistol',
      'Sniper',
      'Throwable',
    ],
  },

  {
    category: 'Medical',
    tags: ['Medkit', 'Pills', 'Adrenaline', 'Defibrillator'],
  },

  {
    category: 'Music',
    tags: ['Sounds'],
  },

  {
    category: 'Extras',
    tags: ['Miscellaneous', 'Textures', 'Items', 'UI', 'Other', 'Models'],
  },
];

const customTags = [
  {
    category: 'Survivors',
    tags: [
      'Bill',
      'Francis',
      'Zoey',
      'Louis',
      'Coach',
      'Ellis',
      'Nick',
      'Rochelle',
    ],
  },
  {
    category: 'Infected',
    tags: [
      'Common Infected',
      'Riot Infected',
      'Mud Men',
      'Clown Infected',
      'CEDA Worker Infected',
      'Road Crew',
      'Fallen Survivor',
    ],
  },
  {
    category: 'Special Infected',
    tags: [
      'Hunter',
      'Smoker',
      'Boomer',
      'Jockey',
      'Spitter',
      'Charger',
      'Witch',
      'Tank',
    ],
  },
  {
    category: 'Melee Weapons',
    tags: [
      'Axe',
      'Baseball Bat',
      'Chainsaw',
      'Cricket Bat',
      'Crowbar',
      'Frying Pan',
      'Golf Club',
      'Guitar',
      'Katana',
      'Machete',
      'Tonfa',
      'Shovel',
      'Pitchfork',
      'Combat Knife',
    ],
  },
  {
    category: 'Handguns',
    tags: ['P220 Pistol', 'Glock 17', 'Magnum'],
  },
  {
    category: 'SMGs',
    tags: [
      'Submachine Gun (UZI)',
      'Silenced Submachine Gun (Mac-10)',
      'H&K MP5 (CS:S)',
    ],
  },
  {
    category: 'Assault Rifles',
    tags: ['M-16', 'Combat Rifle', 'AK-47', 'SIG SG552'],
  },
  {
    category: 'Shotguns',
    tags: [
      'Pump Shotgun',
      'Chrome Shotgun',
      'Tactical Shotgun',
      'Combat Shotgun',
    ],
  },
  {
    category: 'Snipers',
    tags: ['Hunting Rifle', 'Military Rifle', 'Scout Rifle', 'AWP'],
  },
  {
    category: 'Heavys',
    tags: ['Grenade Launcher', 'M60', 'Mounted M60'],
  },
  {
    category: 'Throwables',
    tags: ['Molotov', 'Pipe Bomb', 'Boomer Bile'],
  },
  {
    category: 'Weapon Upgrades',
    tags: ['Laser Sight', 'Incendiary Ammo', 'Explosive Ammo'],
  },
  {
    category: 'Usable Items',
    tags: [
      'Gas Can',
      'Oxygen Tank',
      'Fireworks',
      'Explosive Barrel',
      'Ammo Pile',
    ],
  },
  {
    category: 'Special Items',
    tags: ['Cola', 'Gnome Chompski', 'Scavenge Gas Cans'],
  },
  {
    category: 'Medical',
    tags: ['Medkit', 'Defibrillator', 'Pills', 'Adrenaline'],
  },
  {
    category: 'Animations',
    tags: ['Healing', 'Reviving'],
  },
  {
    category: 'Sounds',
    tags: [
      'Jukebox',
      'Horde Incoming',
      'Fall Sounds',
      'Radial Character Voices',
    ],
  },
  {
    category: 'Music',
    tags: [
      'Concert Music',
      'Saferoom Music',
      'End Music',
      'Death Music',
      'Main Menu Music',
      'Elevator Music',
      'Tank Fight Music',
    ],
  },
  {
    category: 'Extras',
    tags: [
      'Particles',
      'Graffiti',
      'Flash Light',
      'Moon',
      'Helicopter',
      'Jet',
      'Blood',
      'Car',
      'Fire',
      'Medical Cabinet',
      'HUD',
      'Main Menu Background',
      'Saferoom Door',
      'Grenade Launcher Grenade',
      'Skybox',
      'Billboards',
      'Posters',
      'Tank Rock',
      'Pizza Boxes',
      'Jimmys Car',
      'TV',
      'Ladders',
      'Generators',
      'Benches',
      'Barriers',
      'Tables',
      'Flags',
      'Potted Plant',
      'Foliage',
      'Water',
      'Fence',
    ],
  },
];

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

  const [showImportPopup, setShowImportPopup] = useState(false);
  const [showAddToModpack, setShowAddToModpack] = useState(false);
  const [showExportPopup, setShowExportPopup] = useState(false);

  const [selectedMod, setSelectedMod] = useState(null);

  // HMMM???
  const [originalCollection, setOriginalCollection] = useState([]);

  useEffect(() => {
    console.error('LOADING');
    const fetchMods = async () => {
      try {
        const response = await fetch('workshop_items1.json');
        const data1 = await response.json();
        const response2 = await fetch('workshop_items2.json');
        const data2 = await response2.json();
        // const response4 = await fetch('workshop_items4.json');
        // const data4 = await response4.json();
        // const response5 = await fetch('workshop_items5.json');
        // const data5 = await response5.json();
        // Combine the two datasets
        const combinedData = [...data1, ...data2];
        // Remove duplicates based on the 'id' field
        const uniqueData = Array.from(
          new Map(combinedData.map((item) => [item.id, item])).values()
        );

        // Set data
        setMods(uniqueData);
        setFilteredMods(uniqueData);
        console.error('TOTAL NUMBER OF MODS: ', uniqueData.length);
        console.error(
          'TOTAL SIZE: ',
          (
            uniqueData.reduce((acc, mod) => {
              const size = parseInt(mod.file_size);
              return acc + (isNaN(size) ? 0 : size);
            }, 0) /
            (1024 * 1024 * 1024)
          ).toFixed(2),
          ' GB'
        );
      } catch (error) {
        console.error('Error fetching mod data:', error);
      }
    };

    fetchMods();
  }, []);

  const addToModpack = (mod, slot) => {
    if (!modpack.some((m) => m.id === mod.id)) {
      if (mod.addedTags === undefined) mod.addedTags = [];
      mod.addedTags.push(slot);
      setModpack([...modpack, mod]);
    }
    console.error('ADDING ', mod, slot);
  };

  const removeFromModpack = (modId) => {
    setModpack(modpack.filter((mod) => mod.id !== modId));
  };

  const closeAddToModpackPopup = () => {
    setShowAddToModpack(false);
    setSelectedMod(null);
  };

  const filterAndSortMods = useCallback(() => {
    console.error(selectedTag);

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
      // Add similar conditions for other categories if needed
      // For example:
      // else if (selectedCategory === 'Infected') {
      //   categoryMatch = mod.tags.length <= 8;
      // }

      return titleMatch && tagMatch && sizeMatch && categoryMatch;
    });

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
        console.error(mods);
        result.sort((a, b) => b.file_size - a.file_size);
        break;
      default:
        break;
    }

    setFilteredMods(result);
  }, [mods, searchTerm, selectedTag, sortBy, sizeFilter]);

  // TODO This infinetly runs???
  useEffect(() => {
    filterAndSortMods();
  }, [filterAndSortMods]);

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

  const handleImportCollection = (collection) => {
    if (!collection.children || !Array.isArray(collection.children)) {
      console.error('Invalid collection format');
      return;
    }

    const importedModIds = new Set(
      collection.children.map((child) => child.publishedfileid)
    );

    const modsToAdd = mods.filter((mod) =>
      importedModIds.has(mod.id.toString())
    );

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
    filterAndSortMods();
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
    setSearchTerm(search);

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

    setView('browser');
  };

  return (
    <div className="app">
      <header className="app-header">
        <img
          src="hand.png"
          alt="hand.png"
          // className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          // onLoad={() => setIsLoaded(true)}
          height={100}
          width={100}
        />
        <div>
          <h1>Left 4 Dead 2 Mod Browser</h1>
          <p className="header-desc">Find and organize your favorite mods</p>
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
              onChange={(e) => setSortBy(e.target.value)}
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
                    window.confirm('Are you sure you want to remove all mods?')
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
            onClick={() => setView(view === 'browser' ? 'modpack' : 'browser')}
          >
            {view === 'browser' ? 'Manage Modpack' : 'Browse Mods'}
          </button>
        </nav>
      </div>

      {view === 'browser' ? (
        <div id="mod-browser" className="view active">
          <List
            height={900}
            itemCount={filteredMods.length}
            itemSize={230}
            width="100%"
            style={{ overflowX: 'hidden', borderRadius: '8px' }}
          >
            {ModCard}
          </List>
        </div>
      ) : (
        <ModpackCreator
          mods={mods}
          modpack={modpack}
          removeFromModpack={removeFromModpack}
          onTagSearch={handleTagSearch}
          allTags={allTags}
        />
      )}

      {showAddToModpack && selectedMod && (
        <AddToModpack
          mod={selectedMod}
          allTags={allTags}
          onClose={closeAddToModpackPopup}
          onAdd={addToModpack}
          tagList={customTags}
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
  );
};

export default App;
