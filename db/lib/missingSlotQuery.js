const { loadSlotMatching } = require('./slotMatching');

const SCAN_BATCH = 200;
const MAX_SCAN_BATCHES = 12;

function parseMissingSlots(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.map(String).filter(Boolean);
    }
  } catch {
    // fall through to delimiter split
  }

  return String(value)
    .split('|')
    .map((slot) => slot.trim())
    .filter(Boolean);
}

function buildSearchTerms(missingSlots, getTagVariations, normalizeText) {
  const titleTerms = new Set();
  const tagTerms = new Set();

  missingSlots.forEach((slot) => {
    getTagVariations(slot).forEach((variation) => {
      tagTerms.add(variation);
      const normalized = normalizeText(variation);
      if (normalized.length >= 3) titleTerms.add(normalized);
    });
  });

  return {
    titleTerms: [...titleTerms],
    tagTerms: [...tagTerms],
  };
}

function applyMissingSlotPrefilter(query, titleTerms, tagTerms) {
  // A huge OR list is slower than scanning the ranked feed and matching in JS.
  if (titleTerms.length > 24) return query;

  const parts = [];

  titleTerms.forEach((term) => {
    const escaped = term.replace(/[%_(),]/g, ' ').replace(/\s+/g, ' ').trim();
    if (escaped.length >= 3) {
      parts.push(`title.ilike.%${escaped}%`);
    }
  });

  if (tagTerms.length > 0) {
    const csv = tagTerms
      .map((term) => {
        const cleaned = String(term).replace(/[{}"]/g, '');
        return /[\s,]/.test(cleaned) ? `"${cleaned}"` : cleaned;
      })
      .filter(Boolean)
      .join(',');
    if (csv) parts.push(`tags.ov.{${csv}}`);
  }

  if (parts.length === 0) return query;
  return query.or(parts.join(','));
}

async function fetchMatchedModsPage({
  buildQuery,
  pageSize,
  scanOffset,
  missingSlots,
}) {
  const {
    modSuggestsMissingSlot,
    normalizeText,
    getTagVariations,
    customTags,
  } = await loadSlotMatching();

  const { titleTerms, tagTerms } = buildSearchTerms(
    missingSlots,
    getTagVariations,
    normalizeText
  );

  const matches = [];
  let offset = Math.max(0, scanOffset);
  let sourceExhausted = false;

  for (let batch = 0; batch < MAX_SCAN_BATCHES && matches.length < pageSize; batch += 1) {
    let query = applyMissingSlotPrefilter(buildQuery(), titleTerms, tagTerms);
    query = query.range(offset, offset + SCAN_BATCH - 1);

    const { data, error } = await query;
    if (error) {
      return { error };
    }

    const rows = data || [];
    if (rows.length < SCAN_BATCH) {
      sourceExhausted = true;
    }

    let remainingInBatch = 0;
    for (let index = 0; index < rows.length; index += 1) {
      offset += 1;
      const mod = rows[index];
      if (
        modSuggestsMissingSlot(mod, missingSlots, customTags, {
          useCache: false,
        })
      ) {
        matches.push(mod);
        if (matches.length >= pageSize) {
          remainingInBatch = rows.length - index - 1;
          break;
        }
      }
    }

    const filledPage = matches.length >= pageSize;
    if (filledPage || sourceExhausted) {
      return {
        mods: matches.slice(0, pageSize),
        hasMore: filledPage ? remainingInBatch > 0 || !sourceExhausted : false,
        nextOffset: offset,
      };
    }
  }

  return {
    mods: matches.slice(0, pageSize),
    hasMore: !sourceExhausted,
    nextOffset: offset,
  };
}

module.exports = {
  parseMissingSlots,
  fetchMatchedModsPage,
};
