import React, { useState, useRef, useEffect, useMemo } from 'react';
import { customTags } from './constants/tags';
import {
  buildSlotOccupancyIndex,
  categorizeSlots,
} from './utils/slotMatching';

const AddToModpack = ({
  mod,
  modpack = [],
  onClose,
  onSave,
  highlightedTag,
}) => {
  const isInModpack = useMemo(
    () => modpack.some((entry) => entry.id === mod.id),
    [modpack, mod.id]
  );

  const existingTags = useMemo(() => {
    const inModpack = modpack.find((entry) => entry.id === mod.id);
    return inModpack?.addedTags || mod.addedTags || [];
  }, [modpack, mod]);

  const [selectedSlots, setSelectedSlots] = useState(existingTags);

  useEffect(() => {
    setSelectedSlots(existingTags);
  }, [existingTags]);

  const { suggested, categories } = useMemo(
    () => categorizeSlots(mod, customTags),
    [mod]
  );

  const slotOccupancy = useMemo(
    () => buildSlotOccupancyIndex(modpack, mod.id),
    [modpack, mod.id]
  );

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
    onSave(mod, selectedSlots);
    onClose();
  };

  const handleSlotChange = (slot) => {
    setSelectedSlots((prevSlots) =>
      prevSlots.includes(slot)
        ? prevSlots.filter((s) => s !== slot)
        : [...prevSlots, slot]
    );
  };

  const handleSelectTaggedInCategory = (taggedSlots) => {
    setSelectedSlots((prevSlots) => [...new Set([...prevSlots, ...taggedSlots])]);
  };

  const handleCategoryToggle = (categorySlots) => {
    setSelectedSlots((prevSlots) => {
      const allSelected = categorySlots.every((slot) => prevSlots.includes(slot));
      if (allSelected) {
        return prevSlots.filter((slot) => !categorySlots.includes(slot));
      }
      return [...new Set([...prevSlots, ...categorySlots])];
    });
  };

  const setCategoryCheckboxRef = (categorySlots) => (element) => {
    if (!element) return;
    const selectedCount = categorySlots.filter((slot) =>
      selectedSlots.includes(slot)
    ).length;
    element.indeterminate =
      selectedCount > 0 && selectedCount < categorySlots.length;
  };

  const renderSlotItem = ({ slot, match }) => {
    const isHighlighted = slot === highlightedTag;
    const isSuggested = Boolean(match);
    const occupiedMods = slotOccupancy.get(slot) || [];
    const isCurrentModInSlot = existingTags.includes(slot);

    return (
      <div
        key={slot}
        ref={isHighlighted ? highlightedRef : null}
        className={[
          'slot-item',
          isHighlighted ? 'highlighted-slot' : '',
          isSuggested ? 'suggested-slot' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <label htmlFor={slot} className="slot-item-label">
          <input
            type="checkbox"
            id={slot}
            name={slot}
            value={slot}
            checked={selectedSlots.includes(slot)}
            onChange={() => handleSlotChange(slot)}
          />
          <span className="slot-item-name">{slot}</span>
          {match && <span className="slot-match-badge">({match.label})</span>}
        </label>
        {(occupiedMods.length > 0 || isCurrentModInSlot) && (
          <div className="slot-occupancy">
            {/* {isCurrentModInSlot && (
              <span className="slot-occupancy-current">Already on this mod</span>
            )} */}
            {occupiedMods.map((occupiedMod) => (
              <span key={occupiedMod.id} className="slot-occupancy-mod" title={occupiedMod.title}>
                Taken by: {occupiedMod.title}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="add-to-modpack-popup">
      <div className="popup-content add-modpack-popup">
        <div className="modpack-slot-header">
          <div className="modpack-slot-heading">
            <h2>{isInModpack ? 'Edit Slots' : 'Add to Modpack'}</h2>
            <p className="modpack-slot-mod-title">{mod.title}</p>
          </div>
          <div className="popup-buttons">
            <button type="button" onClick={handleSubmit}>
              Save
            </button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>

        <form className="slot-list-form" onSubmit={handleSubmit}>
          <div className="slot-list-container">
            {suggested.length > 0 && (
              <section className="slot-category-section slot-suggested-section">
                <h3>Suggested</h3>
                <p className="slot-section-hint">
                  Based on this mod&apos;s tags and title.
                </p>
                {suggested.map(renderSlotItem)}
              </section>
            )}

            {categories.map(({ category, slots, allSlots, taggedSlots, matchesCategory }) => {
              const unselectedTaggedCount = taggedSlots.filter(
                (slot) => !selectedSlots.includes(slot)
              ).length;
              const allCategorySelected = allSlots.every((slot) =>
                selectedSlots.includes(slot)
              );

              return (
              <section key={category} className="slot-category-section">
                <div className="slot-category-header">
                  <label className="slot-category-label">
                    <input
                      type="checkbox"
                      ref={setCategoryCheckboxRef(allSlots)}
                      checked={allCategorySelected}
                      onChange={() => handleCategoryToggle(allSlots)}
                    />
                    <span className="slot-category-name">{category}</span>
                  </label>
                  {taggedSlots.length > 1 && (
                    <button
                      type="button"
                      className="slot-select-tagged-btn"
                      onClick={() => handleSelectTaggedInCategory(taggedSlots)}
                      disabled={unselectedTaggedCount === 0}
                    >
                      {unselectedTaggedCount === 0
                        ? `All ${taggedSlots.length} tagged selected`
                        : `Select all tagged (${taggedSlots.length})`}
                    </button>
                  )}
                </div>
                {matchesCategory && taggedSlots.length > 0 && (
                  <p className="slot-section-hint">
                    Workshop tags match {taggedSlots.length} slot
                    {taggedSlots.length === 1 ? '' : 's'} in this category.
                  </p>
                )}
                {slots.map(renderSlotItem)}
              </section>
              );
            })}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddToModpack;
