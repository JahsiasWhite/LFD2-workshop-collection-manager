import { getTagVariations, workshopMapTags } from '../constants/tags.js';

export const normalizeText = (text) =>
  text
    .toLowerCase()
    .replace(/[-_]/g, ' ')
    .replace(/[()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const extractParentheticals = (title) => {
  const matches = [];
  const regex = /\(([^)]+)\)/g;
  let match;
  while ((match = regex.exec(title)) !== null) {
    matches.push(normalizeText(match[1]));
  }
  return matches;
};

const splitParentheticalTokens = (paren) =>
  paren
    .split(/\s*(?:&|,|\/|\+|\band\b)\s*/i)
    .map((token) => token.trim())
    .filter(Boolean);

const compactText = (text) => normalizeText(text).replace(/[^a-z0-9]/g, '');

const tokensMatch = (a, b) => {
  const normA = normalizeText(a);
  const normB = normalizeText(b);
  if (!normA || !normB) return false;
  if (normA === normB) return true;
  if (containsPhrase(normA, normB) || containsPhrase(normB, normA)) return true;

  const compactA = compactText(a);
  const compactB = compactText(b);
  return (
    compactA.length >= 3 &&
    compactB.length >= 3 &&
    compactA === compactB
  );
};

const parentheticalMatchesVariation = (token, variation) => {
  if (!tokensMatch(token, variation)) return false;

  const normToken = normalizeText(token);
  const normVariation = normalizeText(variation);
  if (!normVariation.includes(' ')) return true;
  if (normToken === normVariation) return true;
  return compactText(token) === compactText(variation);
};

const stripParentheticals = (title) =>
  title.replace(/\([^)]*\)/g, ' ');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const containsWholeWord = (text, word) => {
  if (!text || !word) return false;
  const regex = new RegExp(`(?:^|\\s)${escapeRegex(word)}(?:\\s|$)`, 'i');
  return regex.test(text);
};

const containsPhrase = (text, phrase) => {
  if (!text || !phrase) return false;
  const normalizedPhrase = normalizeText(phrase);
  if (!normalizedPhrase) return false;

  if (normalizedPhrase.includes(' ')) {
    return text.includes(normalizedPhrase);
  }

  return containsWholeWord(text, normalizedPhrase);
};

const getSlotKeywords = (slot) => {
  const normalized = normalizeText(slot);
  const withoutParens = normalized.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
  const insideParens = normalized.match(/\(([^)]+)\)/)?.[1]?.trim();

  const keywords = new Set();
  if (withoutParens.length >= 3) keywords.add(withoutParens);
  withoutParens.split(' ').forEach((word) => {
    if (word.length >= 3) keywords.add(word);
  });
  if (insideParens && insideParens.length >= 2) keywords.add(insideParens);

  return [...keywords];
};

const matchesVariation = (slot, mod) => {
  const variations = getTagVariations(slot);
  const normalizedTitle = normalizeText(stripParentheticals(mod.title));
  const normalizedTags = (mod.tags || []).map(normalizeText);
  const parentheticalTokens = extractParentheticals(mod.title).flatMap(
    splitParentheticalTokens
  );

  return variations.some((variation) => {
    const normalizedVariation = normalizeText(variation);
    if (normalizedVariation.length < 3) return false;

    if (containsPhrase(normalizedTitle, normalizedVariation)) return true;
    if (
      normalizedTags.some((tag) => containsPhrase(tag, normalizedVariation))
    ) {
      return true;
    }

    return parentheticalTokens.some((token) =>
      parentheticalMatchesVariation(token, normalizedVariation)
    );
  });
};

const matchesParenthetical = (slot, parentheticals) => {
  if (parentheticals.length === 0) return false;

  const slotNorm = normalizeText(slot);
  const slotBase = slotNorm.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
  const slotWords = slotBase.split(' ').filter(Boolean);
  const isMultiWordSlot = slotWords.length > 1;

  return parentheticals.some((paren) => {
    if (paren === slotNorm || paren === slotBase) return true;

    // Multi-word slots (e.g. "Boomer Bile") must not match a single parenthetical
    // word that is only one part of the name (e.g. "(Boomer)" → Boomer, not Bile).
    if (isMultiWordSlot) {
      if (containsPhrase(paren, slotNorm) || containsPhrase(paren, slotBase)) {
        return true;
      }
      if (paren.includes(' ') && containsPhrase(slotBase, paren)) {
        return true;
      }

      const tokens = splitParentheticalTokens(paren);
      const keywords = getSlotKeywords(slot);
      const insideParens = slotNorm.match(/\(([^)]+)\)/)?.[1]?.trim();
      return tokens.some((token) =>
        keywords.some((keyword) => {
          if (!tokensMatch(token, keyword)) return false;
          if (keyword.includes(' ')) {
            return (
              normalizeText(token) === normalizeText(keyword) ||
              compactText(token) === compactText(keyword)
            );
          }
          return (
            keyword === slotBase ||
            keyword === slotNorm ||
            keyword === insideParens
          );
        })
      );
    }

    const keywords = getSlotKeywords(slot);

    if (keywords.some((keyword) => paren === keyword)) return true;

    if (
      keywords.some(
        (keyword) =>
          keyword.includes(' ') &&
          keyword.length >= 4 &&
          containsWholeWord(paren, keyword)
      )
    ) {
      return true;
    }

    if (paren.length >= 3 && containsWholeWord(slotBase, paren)) return true;

    if (containsPhrase(paren, slotNorm) || containsPhrase(paren, slotBase)) {
      // Single-word slots should not match a modifier in a multi-word parenthetical
      // (e.g. "(Fire Axe)" → Axe, not Fire).
      if (paren.includes(' ')) {
        const parenWords = paren.split(' ').filter(Boolean);
        const isLastWord = parenWords[parenWords.length - 1] === slotBase;
        const isLongFirstWord =
          parenWords[0] === slotBase && slotBase.length >= 5;
        if (!isLastWord && !isLongFirstWord) return false;
      }
      return true;
    }

    return false;
  });
};

const matchesTitle = (slot, normalizedTitle) => {
  const slotNorm = normalizeText(slot);
  if (slotNorm.length < 3) return false;

  if (containsPhrase(normalizedTitle, slotNorm)) return true;

  const baseName = slotNorm.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
  return baseName.length >= 4 && containsPhrase(normalizedTitle, baseName);
};

export const getSlotMatch = (mod, slot) => {
  const modTags = mod.tags || [];
  if (modTags.some((tag) => normalizeText(tag) === normalizeText(slot))) {
    return { type: 'tag', label: 'Tagged' };
  }

  if (matchesVariation(slot, mod)) {
    return { type: 'variation', label: 'Name match' };
  }

  const normalizedTitle = normalizeText(stripParentheticals(mod.title));
  const parentheticals = extractParentheticals(mod.title);

  if (matchesParenthetical(slot, parentheticals)) {
    return { type: 'parenthetical', label: 'Title hint' };
  }

  if (matchesTitle(slot, normalizedTitle)) {
    return { type: 'title', label: 'Title match' };
  }

  return null;
};

const isTitleCorroborated = (mod, slot) =>
  containsPhrase(normalizeText(mod.title), normalizeText(slot));

const isSpecificMatch = (mod, slot, match) => {
  if (!match) return false;
  if (match.type === 'variation' || match.type === 'title' || match.type === 'parenthetical') {
    return true;
  }
  if (match.type === 'tag') {
    return isTitleCorroborated(mod, slot);
  }
  return false;
};

const isStrongMatch = (mod, slot, match) => {
  if (!match) return false;
  if (match.type === 'variation') return true;
  if (match.type === 'tag') return isTitleCorroborated(mod, slot);
  return false;
};

export const isMapMod = (mod) =>
  (mod.tags || []).some((tag) => workshopMapTags.has(tag));

export const matchesCategoryName = (mod, categoryName) => {
  const normalizedCategory = normalizeText(categoryName);
  if (normalizedCategory.length < 3) return false;
  return containsPhrase(normalizeText(mod.title), normalizedCategory);
};

export const isWorkshopTagMatch = (mod, slot) => {
  const modTags = (mod.tags || []).map(normalizeText);
  if (modTags.length === 0) return false;

  if (modTags.some((tag) => tag === normalizeText(slot))) return true;

  return getTagVariations(slot).some((variation) => {
    const normalizedVariation = normalizeText(variation);
    if (normalizedVariation.length < 3) return false;
    return modTags.some((tag) => containsPhrase(tag, normalizedVariation));
  });
};

export const getWorkshopTaggedSlots = (mod, slots) =>
  slots.filter((slot) => isWorkshopTagMatch(mod, slot));

export const categorizeSlots = (mod, categories) => {
  const suggested = [];
  const suggestedSet = new Set();
  const byCategory = categories.map((category) => {
    const categoryMatchesTitle = matchesCategoryName(mod, category.category);
    const taggedSlots = getWorkshopTaggedSlots(mod, category.tags);

    const suppressInfectedTitleHints =
      category.category === 'Special Infected' && isMapMod(mod);

    const slots = category.tags.map((slot) => {
      let match = getSlotMatch(mod, slot);
      if (
        suppressInfectedTitleHints &&
        match &&
        (match.type === 'title' || match.type === 'parenthetical')
      ) {
        match = null;
      }
      return { slot, match };
    });

    const hasSpecificCategoryMatch = slots.some((entry) =>
      isSpecificMatch(mod, entry.slot, entry.match)
    );

    if (hasSpecificCategoryMatch) {
      slots.forEach((entry) => {
        if (entry.match && !isSpecificMatch(mod, entry.slot, entry.match)) {
          entry.match = null;
        }
      });
    }

    const strongMatchSlots = new Set(
      slots
        .filter((entry) => isStrongMatch(mod, entry.slot, entry.match))
        .map((entry) => entry.slot)
    );
    const hasStrongCategoryMatch = strongMatchSlots.size > 0;

    slots.forEach((entry) => {
      if (
        hasStrongCategoryMatch &&
        entry.match &&
        !isStrongMatch(mod, entry.slot, entry.match) &&
        !strongMatchSlots.has(entry.slot)
      ) {
        entry.match = null;
      }

      if (entry.match) {
        if (!categoryMatchesTitle) {
          suggested.push(entry);
          suggestedSet.add(entry.slot);
        }
      }
    });

    const sortSlots = (a, b) => {
      if (a.match && !b.match) return -1;
      if (!a.match && b.match) return 1;
      const order = category.tags.indexOf(a.slot) - category.tags.indexOf(b.slot);
      return order !== 0 ? order : a.slot.localeCompare(b.slot);
    };

    const sortedSlots = categoryMatchesTitle
      ? [...slots].sort(sortSlots)
      : [...slots]
          .filter((entry) => !suggestedSet.has(entry.slot) || !entry.match)
          .sort(sortSlots);

    return {
      category: category.category,
      slots: sortedSlots,
      allSlots: category.tags,
      taggedSlots,
      hasSuggestions: slots.some((entry) => entry.match),
      matchesCategory: categoryMatchesTitle,
    };
  });

  const suggestedSlots = [...suggested].sort((a, b) => {
    const priority = { tag: 0, variation: 1, parenthetical: 2, title: 3 };
    return (priority[a.match.type] ?? 9) - (priority[b.match.type] ?? 9);
  });

  const uniqueSuggested = [];
  const seen = new Set();
  suggestedSlots.forEach((entry) => {
    if (!seen.has(entry.slot)) {
      seen.add(entry.slot);
      uniqueSuggested.push(entry);
    }
  });

  const sortedCategories = [...byCategory]
    .filter(
      (category) =>
        category.slots.length > 0 ||
        category.matchesCategory ||
        category.taggedSlots.length > 0
    )
    .sort((a, b) => {
      const aIsExtras = a.category === 'Extras';
      const bIsExtras = b.category === 'Extras';
      if (aIsExtras !== bIsExtras) return aIsExtras ? 1 : -1;

      if (a.matchesCategory && !b.matchesCategory) return -1;
      if (!a.matchesCategory && b.matchesCategory) return 1;

      if (a.hasSuggestions && !b.hasSuggestions) return -1;
      if (!a.hasSuggestions && b.hasSuggestions) return 1;
      return 0;
    });

  return { suggested: uniqueSuggested, categories: sortedCategories };
};

export const buildSlotOccupancyIndex = (modpack, excludeModId = null) => {
  const index = new Map();
  modpack.forEach((entry) => {
    if (entry.id === excludeModId) return;
    (entry.addedTags || []).forEach((slot) => {
      if (!index.has(slot)) index.set(slot, []);
      index.get(slot).push(entry);
    });
  });
  return index;
};

export const getModsForSlot = (modpack, slot, currentModId) =>
  modpack.filter(
    (mod) =>
      mod.id !== currentModId &&
      Array.isArray(mod.addedTags) &&
      mod.addedTags.includes(slot)
  );

export const getAutoAssignedSlots = (mod, categories) =>
  categorizeSlots(mod, categories).suggested.map((entry) => entry.slot);

const matchedSlotsCache = new Map();

const computeAllMatchedSlots = (mod, categories) => {
  const { suggested, categories: categorized } = categorizeSlots(mod, categories);
  const slots = new Set(suggested.map((entry) => entry.slot));
  categorized.forEach((category) => {
    category.slots.forEach((entry) => {
      if (entry.match) slots.add(entry.slot);
    });
  });
  return [...slots];
};

export const getAllMatchedSlots = (mod, categories) => {
  const cacheKey = String(mod.id);
  const cached = matchedSlotsCache.get(cacheKey);
  if (cached) return cached;

  const slots = computeAllMatchedSlots(mod, categories);
  matchedSlotsCache.set(cacheKey, slots);
  return slots;
};

export const modMatchesMissingSlots = (
  mod,
  missingSlots,
  categories,
  { useCache = true } = {}
) => {
  if (missingSlots.length === 0) return false;

  const missingSet = new Set(missingSlots);
  const matched = useCache
    ? getAllMatchedSlots(mod, categories)
    : computeAllMatchedSlots(mod, categories);
  return matched.some((slot) => missingSet.has(slot));
};

export const modSuggestsMissingSlot = (
  mod,
  missingSlots,
  categories,
  { browsingSlot, useCache = true } = {}
) => {
  if (missingSlots.length === 0) return false;

  if (browsingSlot && missingSlots.includes(browsingSlot)) return true;

  return modMatchesMissingSlots(mod, missingSlots, categories, { useCache });
};
