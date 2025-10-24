const express = require('express');
const router = express.Router();

router.get('/mods', async (req, res) => {
  try {
    const supabase = req.app.locals.db;
    const {
      page = 1,
      limit = 5,
      search = '',
      tag = '',
      sortBy = 'subscriptionsDesc',
    } = req.query;

    const offset = (page - 1) * limit;

    // Build base query
    let query = supabase.from('workshop_items').select('*', { count: 'exact' });

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    if (tag) {
      query = query.contains('tags', [tag]); // assuming tags is a JSON array column
    }

    // Sorting
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

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: mods, count: total, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      return res.status(500).json({ error: 'Failed to fetch mods' });
    }

    res.json({
      mods,
      total,
      hasMore: total > offset + mods.length,
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
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
      .select('*')
      .in('id', modIdsArray);

    if (error) {
      console.error('Supabase query error:', error);
      return res.status(500).json({ error: 'Failed to fetch mods batch' });
    }

    res.json({
      mods,
      total: mods.length,
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
