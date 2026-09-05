export const allTags = [
  {
    category: 'Left 4 Dead 1 Survivors',
    tags: ['Survivors', 'Bill', 'Francis', 'Zoey', 'Louis'],
  },
  {
    category: 'Left 4 Dead 2 Survivors',
    tags: ['Coach', 'Ellis', 'Nick', 'Rochelle'],
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
    category: 'Maps',
    tags: ['Campaigns', 'Survival'],
  },
  {
    category: 'Extras',
    tags: [
      'Single Player',
      'Miscellaneous',
      'Textures',
      'Items',
      'UI',
      'Other',
      'Models',
    ],
  },
];

export const customTags = [
  {
    category: 'Left 4 Dead 1 Survivors',
    tags: ['Bill', 'Francis', 'Zoey', 'Louis'],
  },
  {
    category: 'Left 4 Dead 2 Survivors',
    tags: ['Coach', 'Ellis', 'Nick', 'Rochelle'],
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
    category: 'Maps',
    tags: ['Campaigns', 'Survival'],
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
      'Helicopter Pilot',
      'Jet',
      'Vending Machines',
      'Blood',
      'Car',
      'Fire',
      'Medical Cabinet',
      'HUD',
      'Loading Spinner',
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

export const survivorCategories = new Set([
  'Left 4 Dead 1 Survivors',
  'Left 4 Dead 2 Survivors',
]);

// Workshop game-mode tags that indicate a custom map/campaign, not a content-replacement mod.
export const workshopMapTags = new Set([
  'Co-op',
  'Campaigns',
  'Versus',
  'Scavenge',
  'Survival',
  'Realism',
  'Mutations',
]);

// Browse "Hide maps" filter — campaign maps and survival maps.
export const mapFilterTags = ['Campaigns', 'Survival'];

// Alternate names only — the slot name itself always matches too (case-insensitive).
export const tagVariations = {
  Campaigns: ['Campaign'],
  'M-16': ['M16', 'M 16', 'M-16 Rifle', 'M16 Rifle'],
  'CEDA Worker Infected': ['CEDA'],
  'Mud Men': ['Mudmen'],
  'Road Crew': ['Roadcrew'],
  'Boomer Bile': ['boomer bile', 'bile jar', 'bile', 'vomit jar'],
  'Pipe Bomb': ['pipebomb'],
  Molotov: ['molotov', 'molotov cocktail'],
  'Pump Shotgun': ['pump shotgun', 'pumpshotgun'],
  'Tactical Shotgun': ['spas'],
  'Combat Shotgun': ['auto shotgun'],
  Magnum: ['magnum', 'magnum pistol', 'desert eagle', 'deagle'],
  'Glock 17': ['glock'],
  'P220 Pistol': ['p220', 'pistol'],
  'Combat Knife': ['knife'],
  'Skybox': ['skybox', 'skyboxes'],
  'AK-47': ['ak47'],
  'Frying Pan': ['pan'],
  'Silenced Submachine Gun (Mac-10)': ['mac10', 'mac-10'],
  'Loading Spinner': ['spinner'],
  'Combat Rifle': ['scar-h'],
  'Submachine Gun (UZI)': ['UZI'],
  'Radial Character Voices': ['voices'],
  'SIG SG552': ['sg552'],
};

/** Workshop tag applied when browsing from a missing slot card. */
export const slotSearchTags = {
  'Radial Character Voices': 'Sounds',
};

export const getTagVariations = (slot) => [slot, ...(tagVariations[slot] || [])];

/** Short search query when browsing from a missing slot card. */
export const getSlotSearchTerm = (slot) => {
  const variations = tagVariations[slot];
  if (variations?.length) return variations[0];

  const parenMatch = slot.match(/\(([^)]+)\)/);
  if (parenMatch) return parenMatch[1];

  return slot;
};
