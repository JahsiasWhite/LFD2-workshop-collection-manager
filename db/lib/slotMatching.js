const path = require('path');
const { pathToFileURL } = require('url');

let cached;

function loadSlotMatching() {
  if (!cached) {
    const matchingUrl = pathToFileURL(
      path.join(__dirname, '../../website/src/utils/slotMatching.js')
    ).href;
    const tagsUrl = pathToFileURL(
      path.join(__dirname, '../../website/src/constants/tags.js')
    ).href;
    cached = Promise.all([import(matchingUrl), import(tagsUrl)]).then(
      ([matching, tags]) => ({
        modSuggestsMissingSlot: matching.modSuggestsMissingSlot,
        normalizeText: matching.normalizeText,
        getTagVariations: tags.getTagVariations,
        customTags: tags.customTags,
      })
    );
  }
  return cached;
}

module.exports = { loadSlotMatching };
