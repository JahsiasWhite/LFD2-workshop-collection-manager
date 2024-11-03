import React, { useState, useEffect, memo, useMemo } from 'react';
import LazyImage from './LazyImage';

const TagCard = memo(
  ({ tag, count, category, modpack, onCardClick, isExpanded }) => {
    const hasTag = count > 0;
    // const isExpanded = expandedCard === tag;
    const backgroundImage = `/logo192.png`;
    console.error(tag);

    // Use useMemo for expensive operations
    const modsWithTag = useMemo(() => {
      return count > 0
        ? modpack.filter((mod) => mod.addedTags.includes(tag))
        : [];
    }, [modpack, tag, count]);
    // Find the first mod with a preview image for this tag
    const previewImage = useMemo(() => {
      const modWithImage = modsWithTag.find((mod) => mod.preview_url);
      return modWithImage?.preview_url || null;
    }, [modsWithTag]);

    return (
      <div
        className={`tag-card ${hasTag ? 'has-tag' : 'missing-tag'} ${
          isExpanded ? 'expanded' : ''
        }`}
        onClick={() => onCardClick(tag)}
      >
        <div className="tag-card-content">
          {previewImage && (
            // <img src={previewImage} alt={tag} className="tag-image" />
            <LazyImage src={previewImage} alt={tag} className="tag-image" />
          )}
          <div className="tag-info">
            <h4>{tag}</h4>
            <p className={`status ${hasTag ? 'added' : 'missing'}`}>
              {hasTag ? 'Added' : 'Missing'}
            </p>
            {hasTag ? <p className="count">Count: {count}</p> : ''}
          </div>
        </div>
        {hasTag && (
          <div className="tag-card-details">
            <h5>Mods with this tag:</h5>
            <ul>
              {modpack
                .filter((mod) => mod.tags.includes(tag))
                .map((mod) => (
                  <li key={mod.id}>{mod.title}</li>
                ))}
            </ul>
          </div>
        )}
      </div>
    );
  }
);

export default TagCard;
