import React, { useState } from 'react';

let moddableItems = null;

const AddToModpack = ({ mod, onClose, onAdd, allTags }) => {
  const [selectedSlot, setSelectedSlot] = useState('');
  const [selectedSlots, setSelectedSlots] = useState([]);
  moddableItems = allTags.flatMap((category) => category.tags);

  const compatibleSlots = [];
  moddableItems = moddableItems.filter((item) => {
    if (mod.tags.includes(item)) {
      compatibleSlots.push(item);
      return false; // Remove from moddableItems
    }
    return true; // Keep in moddableItems
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedSlots.length > 0) {
      //   onAdd(mod, selectedSlot);
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

  return (
    <div className="add-to-modpack-popup">
      <div className="popup-content">
        <h2>Add {mod.title} to Modpack</h2>
        <p>Choose a slot</p>
        <form onSubmit={handleSubmit}>
          <div>
            <h3>Compatible Slots:</h3>
            {compatibleSlots.map((slot) => (
              <div key={slot}>
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
            ))}
          </div>
          <div>
            <h3>Other Slots:</h3>
            {moddableItems.map((slot) => (
              <div key={slot}>
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
            ))}
          </div>
          <div className="popup-buttons">
            <button type="submit">Add</button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddToModpack;
