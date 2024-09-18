// Main data store
let mods = [];
// let allTags = new Set();
// let allTags = [
//   {
//     category: 'Survivors',
//     tags: [
//       'Bill',
//       'Francis',
//       'Zoey',
//       'Louis',
//       'Coach',
//       'Ellis',
//       'Nick',
//       'Rochelle',
//     ],
//   },
// ];
let allTags = [
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
  // {
  //   category: 'Melee Weapons',
  //   tags: [
  //     'Axe',
  //     'Baseball Bat',
  //     'Chainsaw',
  //     'Cricket Bat',
  //     'Crowbar',
  //     'Frying Pan',
  //     'Golf Club',
  //     'Guitar',
  //     'Katana',
  //     'Machete',
  //     'Tonfa',
  //     'Shovel',
  //     'Pitchfork',
  //     'Combat Knife',
  //   ],
  // },
  // {
  //   category: 'Handguns',
  //   tags: ['P220 Pistol', 'Glock 17', 'Magnum'],
  // },
  // {
  //   category: 'SMGs',
  //   tags: [
  //     'Submachine Gun (UZI)',
  //     'Silenced Submachine Gun (Mac-10)',
  //     'H&K MP5 (CS:S)',
  //   ],
  // },
  // {
  //   category: 'Assault Rifles',
  //   tags: ['M-16', 'Combat Rifle', 'AK-47', 'SIG SG552'],
  // },
  // {
  //   category: 'Shotguns',
  //   tags: [
  //     'Pump Shotgun',
  //     'Chrome Shotgun',
  //     'Tactical Shotgun',
  //     'Combat Shotgun',
  //   ],
  // },
  // {
  //   category: 'Snipers',
  //   tags: ['Hunting Rifle', 'Military Rifle', 'Scout Rifle', 'AWP'],
  // },
  // {
  //   category: 'Heavys',
  //   tags: ['Grenade Launcher', 'M60', 'Mounted M60'],
  // },
  // {
  //   category: 'Throwables',
  //   tags: ['Molotov', 'Pipe Bomb', 'Boomer Bile'],
  // },
  // {
  //   category: 'Weapon Upgrades',
  //   tags: ['Laser Sight', 'Incendiary Ammo', 'Explosive Ammo'],
  // },
  // {
  //   category: 'Usable Items',
  //   tags: [
  //     'Gas Can',
  //     'Oxygen Tank',
  //     'Fireworks',
  //     'Explosive Barrel',
  //     'Ammo Pile',
  //   ],
  // },
  // {
  //   category: 'Special Items',
  //   tags: ['Cola', 'Gnome Chompski', 'Scavenge Gas Cans'],
  // },
  // {
  //   category: 'Medical',
  //   tags: ['Medkit', 'Defibrillator', 'Pills', 'Adrenaline'],
  // },
  // {
  //   category: 'Animations',
  //   tags: ['Healing', 'Reviving'],
  // },
  // {
  //   category: 'Sounds',
  //   tags: [
  //     'Jukebox',
  //     'Horde Incoming',
  //     'Fall Sounds',
  //     'Radial Character Voices',
  //   ],
  // },
  // {
  //   category: 'Music',
  //   tags: [
  //     'Concert Music',
  //     'Saferoom Music',
  //     'End Music',
  //     'Death Music',
  //     'Main Menu Music',
  //     'Elevator Music',
  //     'Tank Fight Music',
  //   ],
  // },
  // {
  //   category: 'Extras',
  //   tags: [
  //     'Graffiti',
  //     'Flash Light',
  //     'Moon',
  //     'Helicopter',
  //     'Jet',
  //     'Blood',
  //     'Car',
  //     'Fire',
  //     'Medical Cabinet',
  //     'HUD',
  //     'Saferoom Door',
  //     'Grenade Launcher Grenade',
  //     'Skybox',
  //     'Billboards',
  //     'Posters',
  //     'Tank Rock',
  //     'Pizza Boxes',
  //     'Jimmys Car',
  //     'TV',
  //   ],
  // },
];
let moddableItems = [];

// DOM elements
const modList = document.getElementById('mod-list');
const searchInput = document.getElementById('search-input');
const tagSelect = document.getElementById('tag-select');
const modpackSlots = document.getElementById('modpack-slots');
const modpackProgress = document.getElementById('modpack-progress');
const toggleViewButton = document.getElementById('toggle-view');
const modBrowserView = document.getElementById('mod-browser');
const modpackCreatorView = document.getElementById('modpack-creator');

// Create dialog element
const dialog = document.createElement('div');
dialog.id = 'add-to-modpack-dialog';
dialog.className = 'dialog';
document.body.appendChild(dialog);

// Fetch and initialize data
async function initializeData() {
  try {
    const response = await fetch('workshop_items2.json');
    mods = await response.json();
    displayMods(mods);
    populateTagSelect();
    identifyModdableItems();
    createModpackSlots();
  } catch (error) {
    console.error('Error fetching mod data:', error);
    modList.innerHTML =
      '<p>Error loading mod data. Please try again later.</p>';
  }
}

// Display mods
function displayMods(modsToShow) {
  modList.innerHTML = '';
  modsToShow.forEach((mod) => {
    const modCard = createModCard(mod);
    modList.appendChild(modCard);
  });
}

// Create a mod card element
function createModCard(mod) {
  const modCard = document.createElement('div');
  modCard.className = 'mod-card';
  modCard.innerHTML = `
        <h3>${mod.title}</h3>
        <p>Subscriptions: ${mod.subscriptions}</p>
        <p>File Size: ${(mod.file_size / 1024 / 1024).toFixed(2)} MB</p>
        <div>${mod.tags
          .map((tag) => `<span class="tag">${tag}</span>`)
          .join('')}</div>
        <a href="${mod.url}" target="_blank">View on Steam</a>
        <button class="add-to-modpack" data-mod-id="${
          mod.id
        }">Add to Modpack</button>
    `;

  // Add event listener to the "Add to Modpack" button
  const addButton = modCard.querySelector('.add-to-modpack');
  addButton.addEventListener('click', () => showAddToModpackDialog(mod));

  return modCard;
}

// Show Add to Modpack dialog
function showAddToModpackDialog(mod) {
  const compatibleSlots = moddableItems.filter((item) =>
    mod.tags.includes(item)
  );

  if (compatibleSlots.length === 0) {
    alert(
      'This mod is not compatible with any available slots in the modpack.'
    );
    return;
  }

  dialog.innerHTML = `
    <h2>Add ${mod.title} to Modpack</h2>
    <p>Choose a slot:</p>
    <form id="add-to-modpack-form">
    Compatible Slots:
      ${compatibleSlots
        .map(
          (slot) => `
        <div>
          <input type="radio" id="${slot}" name="slot" value="${slot}">
          <label for="${slot}">${slot}</label>
        </div>
      `
        )
        .join('')}
        <br />
      
      Other Slots:
      ${moddableItems
        .map(
          (slot) => `
        <div>
          <input type="radio" id="${slot}" name="slot" value="${slot}">
          <label for="${slot}">${slot}</label>
        </div>
      `
        )
        .join('')}

        <div class="dialog-buttons">
          <button type="submit">Add</button>
          <button type="button" id="cancel-add-to-modpack">Cancel</button>
        </div>
    </form>
  `;

  const form = dialog.querySelector('#add-to-modpack-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const selectedSlot = form.slot.value;
    if (selectedSlot) {
      addToModpack(mod, selectedSlot);
      closeDialog();
    } else {
      alert('Please select a slot.');
    }
  });

  const cancelButton = dialog.querySelector('#cancel-add-to-modpack');
  cancelButton.addEventListener('click', closeDialog);

  dialog.style.display = 'block';
}

// Close the dialog
function closeDialog() {
  dialog.style.display = 'none';
}

// Add mod to modpack
function addToModpack(mod, slot) {
  const slotSelect = document.getElementById(slot);
  slotSelect.value = mod.id;
  updateModpackProgress();
  // alert(`${mod.title} has been added to the ${slot} slot.`);
}

// Populate tag select dropdown
function populateTagSelect() {
  allTags.forEach((category) => {
    const optgroup = document.createElement('optgroup');
    optgroup.label = category.category;

    category.tags.forEach((tag) => {
      const option = document.createElement('option');
      option.value = tag;
      option.textContent = tag;
      optgroup.appendChild(option);
    });

    tagSelect.appendChild(optgroup);
  });
}

// Filter mods based on search and tag
function filterMods() {
  const searchTerm = searchInput.value.toLowerCase();
  const selectedTag = tagSelect.value;

  const filteredMods = mods.filter((mod) => {
    const matchesSearch = mod.title.toLowerCase().includes(searchTerm);
    const matchesTag = selectedTag === '' || mod.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  displayMods(filteredMods);
}

// Identify moddable items from tags
function identifyModdableItems() {
  const excludedTags = ['mod', 'left 4 dead 2', 'left4dead2', 'l4d2'];
  moddableItems = allTags.flatMap((category) =>
    category.tags.filter((tag) => !excludedTags.includes(tag.toLowerCase()))
  );
}

// Create modpack slots
function createModpackSlots() {
  modpackSlots.innerHTML = '';
  allTags.forEach((category) => {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'modpack-category';
    categoryDiv.innerHTML = `<h3>${category.category}</h3>`;

    category.tags.forEach((item) => {
      if (moddableItems.includes(item)) {
        const slot = document.createElement('div');
        slot.className = 'modpack-slot empty-slot'; // Add empty-slot class by default
        slot.innerHTML = `
          <label for="${item}">${item}:</label>
          <select id="${item}" onchange="updateModpackProgress()">
            <option value="">Select a mod</option>
            ${mods
              .filter((mod) => mod.tags.includes(item))
              .map(
                (mod) => `
                <option value="${mod.id}">${mod.title}</option>
            `
              )
              .join('')}
          </select>
        `;
        categoryDiv.appendChild(slot);
      }
    });

    modpackSlots.appendChild(categoryDiv);
  });
  updateModpackProgress();
}

// Update modpack progress
function updateModpackProgress() {
  const totalSlots = moddableItems.length;
  const filledSlots = Array.from(
    modpackSlots.querySelectorAll('select')
  ).filter((select) => select.value !== '').length;
  const progressPercentage = (filledSlots / totalSlots) * 100;

  modpackProgress.innerHTML = `
  <p>${filledSlots} out of ${totalSlots} mods added</p>
  <div class="progress-bar-container">
    <div id="modpack-progress-bar" style="width: ${progressPercentage}%"></div>
  </div>
`;
  modpackProgress.title = `${filledSlots} out of ${totalSlots} slots filled`;

  // Highlight empty slots
  const allSlots = modpackSlots.querySelectorAll('.modpack-slot');
  allSlots.forEach((slot) => {
    const select = slot.querySelector('select');
    if (select.value === '') {
      slot.classList.add('empty-slot');
    } else {
      slot.classList.remove('empty-slot');
    }
  });
}

// Toggle between mod browser and modpack creator views
function toggleView() {
  modBrowserView.classList.toggle('active');
  modpackCreatorView.classList.toggle('active');
  if (modpackCreatorView.classList.contains('active')) {
    toggleViewButton.textContent = 'Browse Mods';
  } else {
    toggleViewButton.textContent = 'Create Modpack';
  }
}

// Event listeners
searchInput.addEventListener('input', filterMods);
tagSelect.addEventListener('change', filterMods);
toggleViewButton.addEventListener('click', toggleView);

// Initialize the application
initializeData();
