import React, { useState, useRef, useEffect } from 'react';
import { customTags } from './constants/tags';

let moddableItems = null;

const AddToModpack = ({ mod, onClose, onAdd, allTags, highlightedTag }) => {
  // const [selectedSlot, setSelectedSlot] = useState('');
  const [selectedSlots, setSelectedSlots] = useState(mod.addedTags || []);
  // moddableItems = allTags.flatMap((category) => category.tags);
  moddableItems = customTags.flatMap((category) => category.tags);

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
      console.log('Adding ' + selectedSlots + ' mod to modpack', mod);
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
