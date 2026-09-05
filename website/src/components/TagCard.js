import React, { useEffect, useMemo, useRef, useState } from 'react';
import LazyImage from './LazyImage';

import './TagCard.css';

const FALLBACK_ART = '/art.jpg';

const useGridColumnCount = (gridRef) => {
  const [columns, setColumns] = useState(1);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return undefined;

    const update = () => {
      const template = getComputedStyle(el).gridTemplateColumns.trim();
      if (!template || template === 'none') {
        setColumns(1);
        return;
      }
      setColumns(Math.max(1, template.split(/\s+/).length));
    };

    const observer = new ResizeObserver(update);
    observer.observe(el);
    update();

    return () => observer.disconnect();
  }, [gridRef]);

  return columns;
};

const TagCard = ({
  tag,
  count,
  modpack,
  onCardClick,
  isExpanded,
  onTagSearch,
}) => {
  const hasTag = count > 0;
  const expanded = hasTag && isExpanded;

  const modsWithTag = useMemo(() => {
    return count > 0
      ? modpack.filter((mod) => mod.addedTags.includes(tag))
      : [];
  }, [modpack, tag, count]);

  const previewImage = useMemo(() => {
    if (!hasTag) return FALLBACK_ART;
    return (
      modsWithTag.find((mod) => mod.preview_url)?.preview_url || FALLBACK_ART
    );
  }, [hasTag, modsWithTag]);

  const handleClick = (e) => {
    e.preventDefault();
    if (!hasTag) {
      onTagSearch(tag);
    } else {
      onCardClick(tag);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e);
    }
  };

  return (
    <div
      className={`tag-card ${hasTag ? 'has-tag' : 'missing-tag'}${
        expanded ? ' is-expanded' : ''
      }`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-expanded={hasTag ? expanded : undefined}
      aria-label={`${tag}, ${hasTag ? 'Added' : 'Missing'}`}
    >
      <div className="tag-card-face">
        <div className="tag-image-container">
          <LazyImage src={previewImage} alt="" className="tag-image" />
        </div>
        <div className="tag-info">
          <h4>{tag}</h4>
          <div className="tag-info-meta">
            <p className={`status ${hasTag ? 'added' : 'missing'}`}>
              {hasTag ? 'Added' : 'Missing'}
            </p>
            {hasTag && (
              <p
                className={`count${count > 1 ? ' count-warn' : ''}`}
                title={count > 1 ? 'Multiple mods with this tag' : undefined}
              >
                {count} {count === 1 ? 'mod' : 'mods'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const TagCardDetail = ({ tag, modpack, removeFromModpack, editMod }) => {
  const modsWithTag = useMemo(
    () => modpack.filter((mod) => (mod.addedTags || []).includes(tag)),
    [modpack, tag]
  );

  const handleAction = (e, action) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  return (
    <div className="tag-card-detail" role="region" aria-label={`${tag} mods`}>
      <ul>
        {modsWithTag.map((mod) => (
          <li key={mod.id} className="tag-card-mod">
            {mod.preview_url ? (
              <LazyImage
                src={mod.preview_url}
                alt=""
                className="tag-card-mod-thumb"
              />
            ) : (
              <div className="tag-card-mod-thumb is-empty" />
            )}
            <div className="tag-card-mod-info">
              {mod.url ? (
                <a href={mod.url} target="_blank" rel="noopener noreferrer">
                  {mod.title}
                </a>
              ) : (
                <span>{mod.title}</span>
              )}
            </div>
            <div className="tag-card-mod-actions">
              <button
                type="button"
                onClick={(e) => handleAction(e, () => editMod(mod))}
              >
                Edit
              </button>
              <button
                type="button"
                className="remove-button"
                onClick={(e) =>
                  handleAction(e, () => removeFromModpack(mod.id))
                }
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export const TagCardGrid = ({
  tags,
  tagCounts,
  modpack,
  expandedCard,
  onCardClick,
  onTagSearch,
  removeFromModpack,
  editMod,
}) => {
  const gridRef = useRef(null);
  const columns = useGridColumnCount(gridRef);

  const expandedIndex = expandedCard ? tags.indexOf(expandedCard) : -1;
  const detailAfterIndex =
    expandedIndex >= 0
      ? Math.min(
          tags.length - 1,
          Math.ceil((expandedIndex + 1) / columns) * columns - 1
        )
      : -1;

  return (
    <div className="tag-grid" ref={gridRef}>
      {tags.map((tag, index) => (
        <React.Fragment key={tag}>
          <TagCard
            tag={tag}
            count={tagCounts[tag] || 0}
            modpack={modpack}
            onCardClick={onCardClick}
            isExpanded={expandedCard === tag}
            onTagSearch={onTagSearch}
          />
          {index === detailAfterIndex ? (
            <TagCardDetail
              tag={expandedCard}
              modpack={modpack}
              removeFromModpack={removeFromModpack}
              editMod={editMod}
            />
          ) : null}
        </React.Fragment>
      ))}
    </div>
  );
};

export default React.memo(TagCard);
