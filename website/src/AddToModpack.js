import React, { useState, useRef, useEffect } from 'react';

let moddableItems = null;

/// UGGGH THIS IS A DUPLICATE OF 'customTags' on App.js. Im just being lazy... these should get fixed up.
const tagList = [
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

const AddToModpack = ({ mod, onClose, onAdd, allTags, highlightedTag }) => {
  // const [selectedSlot, setSelectedSlot] = useState('');
  const [selectedSlots, setSelectedSlots] = useState(mod.addedTags || []);
  // moddableItems = allTags.flatMap((category) => category.tags);
  moddableItems = tagList.flatMap((category) => category.tags);
  console.error(moddableItems, tagList);

  // TODO: This reruns a lot!
  const compatibleSlots = [];
  moddableItems = moddableItems.filter((item) => {
    if (mod.tags.includes(item)) {
      compatibleSlots.push(item);
      return false; // Remove from moddableItems
    }
    return true; // Keep in moddableItems
  });

  // Scroll to highlighted tag when popup opens
  const highlightedRef = useRef(null);
  useEffect(() => {
    console.error('HIGHTLIGHTEDTATGCHANGED: ', highlightedTag);
    if (highlightedTag && highlightedRef.current) {
      highlightedRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [highlightedTag]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedSlots.length > 0) {
      //   onAdd(mod, selectedSlot);
      console.error('ADDING ', mod, selectedSlots);
      selectedSlots.forEach((slot) => onAdd(mod, slot));
      onClose();
    } else {
      alert('Please select a slot.');
    }
  };

  const handleSlotChange = (slot) => {
    setSelectedSlots((prevSlots) =>
      prevSlots.includes(slot)
        ? prevSlots.filter((s) => s !== slot)
        : [...prevSlots, slot]
    );
  };

  // Helper function to render a slot item
  const renderSlotItem = (slot) => {
    const isHighlighted = slot === highlightedTag;
    return (
      <div
        key={slot}
        ref={isHighlighted ? highlightedRef : null}
        className={`slot-item ${isHighlighted ? 'highlighted-slot' : ''}`}
      >
        <input
          type="checkbox"
          id={slot}
          name={slot}
          value={slot}
          checked={selectedSlots.includes(slot)}
          onChange={() => handleSlotChange(slot)}
        />
        <label htmlFor={slot}>{slot}</label>
      </div>
    );
  };

  return (
    <div className="add-to-modpack-popup">
      <div className="popup-content">
        <div className="modpack-slot-header">
          <h2>Add {mod.title} to Modpack</h2>
          <div className="popup-buttons">
            <button type="submit" onClick={handleSubmit}>
              Add
            </button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
        {/* <p className="choose-slot">Choose a slot</p> */}
        <form onSubmit={handleSubmit}>
          <div>
            <h3>Compatible Slots:</h3>
            {compatibleSlots.map(renderSlotItem)}
          </div>
          <div>
            <h3>Other Slots:</h3>
            {moddableItems.map(renderSlotItem)}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddToModpack;
