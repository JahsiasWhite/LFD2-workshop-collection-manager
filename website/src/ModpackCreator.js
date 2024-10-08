import React, { useState, useEffect } from 'react';

import './ModpackCreator.css';

const allTags = [
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
      'Saferoom Door',
      'Grenade Launcher Grenade',
      'Skybox',
      'Billboards',
      'Posters',
      'Tank Rock',
      'Pizza Boxes',
      'Jimmys Car',
      'TV',
    ],
  },
];

const ModpackCreator = ({ modpack, removeFromModpack }) => {
  const [tagCounts, setTagCounts] = useState({});

  useEffect(() => {
    console.error('MODPACK: ', modpack);
    const counts = {};
    allTags.forEach((category) => {
      category.tags.forEach((tag) => {
        counts[tag] = modpack.filter((mod) =>
          mod.addedTags.includes(tag)
        ).length;
      });
    });
    console.error(counts, Object.values(counts));
    setTagCounts(counts);
  }, [modpack]);

  const TagCard = ({ tag, count, category }) => {
    const hasTag = count > 0;
    const backgroundImage = `logo192.png`;

    return (
      <div className={`tag-card ${hasTag ? 'has-tag' : 'missing-tag'}`}>
        <img src={backgroundImage} alt={tag} className="tag-image" />
        <div className="tag-content">
          <h4>{tag}</h4>
          {/* <p className="category">{category}</p> */}
          <p className={`status ${hasTag ? 'added' : 'missing'}`}>
            {hasTag ? 'Added' : 'Missing'}
          </p>
          <p className="count">Count: {count}</p>
        </div>
      </div>
    );
  };

  const [isModpackListOpen, setIsModpackListOpen] = useState(false);
  const toggleModpackList = () => {
    setIsModpackListOpen(!isModpackListOpen);
  };

  return (
    <div id="modpack-creator" className="view active">
      <h2>Modpack Creator</h2>

      {/* <div id="modpack-list">
        {modpack.map((mod) => (
          <div key={mod.id} className="modpack-item">
            <span>{mod.title}</span>
            <button onClick={() => removeFromModpack(mod.id)}>Remove</button>
          </div>
        ))}
      </div> */}
      <div className="modpack-list-container">
        <button onClick={toggleModpackList} className="toggle-list-button">
          {isModpackListOpen ? 'Hide' : 'Show'} Modpack List ({modpack.length}{' '}
          mods)
        </button>
        {isModpackListOpen && (
          <div className="modpack-list">
            {modpack.map((mod) => (
              <div key={mod.id} className="modpack-item">
                <span>{mod.title}</span>
                <span>{mod.tags}</span>
                <button
                  onClick={() => removeFromModpack(mod.id)}
                  className="remove-button"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

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
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModpackCreator;
