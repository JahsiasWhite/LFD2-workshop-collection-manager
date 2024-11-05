import React, { useMemo } from 'react';
import LazyImage from './LazyImage';

import './TagCard.css';

const TagCard = ({
  tag,
  count,
  category,
  modpack,
  onCardClick,
  isExpanded,
  onTagSearch,
  removeFromModpack,
  editMod,
}) => {
  const hasTag = count > 0;

  const modsWithTag = useMemo(() => {
    return count > 0
      ? modpack.filter((mod) => mod.addedTags.includes(tag))
      : [];
  }, [modpack, tag, count]);

  // ? Necessary?
  const normalizeText = (text) => {
    return text.toLowerCase().replace(/[-_]/g, ' ').trim();
  };

  const hasCompleteWord = (text, word) => {
    const normalizedText = normalizeText(text);
    const normalizedWord = normalizeText(word);
    return normalizedText.includes(normalizedWord);
  };

  // const modsWithTag = useMemo(() => {
  //   if (count === 0) return [];

  //   return modpack.filter((mod) => {
  //     // Special case for Common Infected variants
  //     if (category === 'Infected' && mod.tags.includes('Common Infected')) {
  //       const normalizedTitle = normalizeText(mod.title);
  //       if (hasCompleteWord(normalizedTitle, 'ceda')) {
  //         if (!mod.addedTags.includes('ceda')) {
  //           console.error('FIXING : ', mod);
  //           // mod.addedTags = mod.addedTags.filter(
  //           //   (tag) => tag !== 'Common Infected'
  //           // ); // Removes 'Common Infected'
  //           // mod.addedTags.push('CEDA Worker Infected');
  //         }
  //         return true;
  //       }
  //     }

  //     // Check if it's already explicitly tagged
  //     if (mod.addedTags.includes(tag)) return true;
  //     return false;

  //     // Generic title-based matching
  //     // return hasCompleteWord(normalizedTitle, tag);
  //   });
  // }, [modpack, tag, category, count]);

  const previewImage = useMemo(() => {
    const modWithImage = modsWithTag.find((mod) => mod.preview_url);
    return modWithImage?.preview_url || '/art.jpg';
  }, [modsWithTag]);

  const handleClick = (e) => {
    e.preventDefault();
    if (!hasTag) {
      onTagSearch(tag);
    } else {
      onCardClick(tag);
    }
  };

  return (
    <div
      className={`tag-card ${hasTag ? 'has-tag' : 'missing-tag'} ${
        isExpanded ? 'flipped' : ''
      }`}
      onClick={handleClick}
    >
      <div className="tag-card-inner">
        {/* Front of card */}
        <div className="tag-card-front">
          <div className="tag-image-container">
            <LazyImage src={previewImage} alt={tag} className="tag-image" />
          </div>
          <div className="tag-info">
            <h4>{tag}</h4>
            <p className={`status ${hasTag ? 'added' : 'missing'}`}>
              {hasTag ? 'Added' : 'Missing'}
            </p>
            {hasTag && (
              <div className="mod-count">
                <p className="count">Count: {count}</p>
                {count > 1 && (
                  <span
                    className="warning-icon"
                    title="Multiple mods with this tag"
                  >
                    ⚠
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Back of card */}
        {hasTag && (
          <div className="tag-card-back">
            <div className="tag-card-back-content">
              <h5>Mods with {tag}:</h5>
              <ul>
                {modsWithTag.map((mod) => (
                  <li key={mod.id}>
                    <a
                      href={mod.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {mod.title}
                    </a>
                    <div>
                      <button onClick={() => editMod(mod)}>Edit</button>
                      <button
                        className="remove-button"
                        onClick={(e) => removeFromModpack(mod.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(TagCard);
