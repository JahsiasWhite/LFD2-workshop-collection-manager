const express = require('express');
const router = express.Router();
const {
  parseMissingSlots,
  fetchMatchedModsPage,
} = require('../lib/missingSlotQuery');

function isTimeoutError(error) {
  const message = (error?.message || '').toLowerCase();
  return (
    error?.name === 'AbortError' ||
    message.includes('abort') ||
    message.includes('timeout') ||
    message.includes('timed out')
  );
}

function sendDatabaseError(res, error) {
  console.error('Supabase query error:', error);
  const timedOut = isTimeoutError(error);
  return res.status(503).json({
    error: timedOut
      ? 'The mod database took too long to respond. It may be down or overloaded.'
      : 'The mod database is currently unavailable. Please try again in a moment.',
    code: timedOut ? 'DATABASE_TIMEOUT' : 'DATABASE_UNAVAILABLE',
  });
}

const MOD_LIST_COLUMNS =
  'id, title, tags, subscriptions, file_size, preview_url, url';
const MAX_PAGE_SIZE = 250;
// Keep in sync with website/src/constants/tags.js mapFilterTags
const MAP_FILTER_TAGS = ['Campaigns', 'Survival'];

function isTruthyQuery(value) {
  if (value == null || value === '') return false;
  const normalized = String(value).toLowerCase();
  return normalized !== '0' && normalized !== 'false' && normalized !== 'no';
}

function buildModsQuery(supabase, { search, tag, sortBy, hideMaps }) {
  let query = supabase.from('workshop_items').select(MOD_LIST_COLUMNS);

  if (search) {
    query = query.ilike('title', `%${search}%`);
  }

  if (tag) {
    query = query.contains('tags', [tag]);
  }

  if (hideMaps) {
    query = query.not('tags', 'ov', `{${MAP_FILTER_TAGS.join(',')}}`);
  }

  switch (sortBy) {
    case 'subscriptionsAsc':
      query = query.order('subscriptions', { ascending: true });
      break;
    case 'subscriptionsDesc':
      query = query.order('subscriptions', { ascending: false });
      break;
    case 'titleAsc':
      query = query.order('title', { ascending: true });
      break;
    case 'titleDesc':
      query = query.order('title', { ascending: false });
      break;
    case 'fileSize':
      query = query.order('file_size', { ascending: false });
      break;
    default:
      query = query.order('subscriptions', { ascending: false });
  }

  return query.order('id', { ascending: true });
}

router.get('/mods', async (req, res) => {
  try {
    const supabase = req.app.locals.db;
    const {
      page = 1,
      limit = 20,
      offset: offsetQuery = '',
      search = '',
      tag = '',
      sortBy = 'subscriptionsDesc',
      hideMaps = '',
      missingSlots: missingSlotsQuery = '',
    } = req.query;

    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(limit, 10) || 20));
    const parsedOffset = parseInt(offsetQuery, 10);
    const rangeStart =
      Number.isFinite(parsedOffset) && parsedOffset >= 0
        ? parsedOffset
        : (pageNumber - 1) * pageSize;

    const missingSlots = parseMissingSlots(missingSlotsQuery);
    const hideMapsOnly = isTruthyQuery(hideMaps);
    const buildQuery = () =>
      buildModsQuery(supabase, { search, tag, sortBy, hideMaps: hideMapsOnly });

    if (missingSlots.length > 0) {
      const result = await fetchMatchedModsPage({
        buildQuery,
        pageSize,
        scanOffset: rangeStart,
        missingSlots,
      });

      if (result.error) {
        return sendDatabaseError(res, result.error);
      }

      return res.json(result);
    }

    const { data: mods, error } = await buildQuery().range(
      rangeStart,
      rangeStart + pageSize - 1
    );

    if (error) {
      return sendDatabaseError(res, error);
    }

    const rows = mods || [];

    res.json({
      mods: rows,
      hasMore: rows.length === pageSize,
      nextOffset: rangeStart + rows.length,
    });
  } catch (error) {
    if (isTimeoutError(error)) {
      return sendDatabaseError(res, error);
    }
    console.error('Server error:', error);
    res.status(500).json({
      error: 'Something went wrong while loading mods.',
      code: 'INTERNAL_ERROR',
    });
  }
});

router.post('/mods/batch', async (req, res) => {
  try {
    const supabase = req.app.locals.db;
    const { modIds } = req.body;

    if (!modIds || typeof modIds[Symbol.iterator] !== 'function') {
      return res.status(400).json({ error: 'modIds must be iterable' });
    }

    const modIdsArray = Array.from(modIds).map((id) => id.toString());
    if (modIdsArray.length === 0) {
      return res.json({ mods: [], total: 0 });
    }

    const { data: mods, error } = await supabase
      .from('workshop_items')
      .select(MOD_LIST_COLUMNS)
      .in('id', modIdsArray);

    if (error) {
      return sendDatabaseError(res, error);
    }

    const rows = mods || [];

    res.json({
      mods: rows,
      total: rows.length,
    });
  } catch (error) {
    if (isTimeoutError(error)) {
      return sendDatabaseError(res, error);
    }
    console.error('Server error:', error);
    res.status(500).json({
      error: 'Something went wrong while loading mods.',
      code: 'INTERNAL_ERROR',
    });
  }
});

module.exports = router;
