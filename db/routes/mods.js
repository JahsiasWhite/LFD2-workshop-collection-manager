const express = require('express');
const router = express.Router();

// In db/routes/mods.js
router.get('/mods', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const {
      page = 1,
      limit = 5,
      search = '',
      tag = '',
      sortBy = 'subscriptionsDesc',
    } = req.query;

    const skip = (page - 1) * limit;

    // Build query based on search parameters
    const query = {};
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    if (tag) {
      query.tags = tag;
    }

    // Mods are always sorted
    let sortConfig = {};
    switch (sortBy) {
      case 'subscriptionsDesc':
        sortConfig = { subscriptions: -1 };
        break;
      case 'subscriptionsAsc':
        sortConfig = { subscriptions: 1 };
        break;
      case 'titleAsc':
        sortConfig = { title: 1 };
        break;
      case 'titleDesc':
        sortConfig = { title: -1 };
        break;
      case 'fileSize':
        sortConfig = { file_size: -1 };
        break;
      default:
        sortConfig = { subscriptions: -1 };
    }

    // Get total count for pagination
    const total = await db.collection('mods').countDocuments(query);

    console.error(sortConfig);
    const mods = await db
      .collection('mods')
      .find(query)
      // .sort(sortConfig)
      .skip(skip)
      .limit(limit)
      .toArray();

    res.json({
      mods,
      total,
      hasMore: total > skip + mods.length,
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to fetch mods' });
  }
});

// Add this new endpoint to your existing router
// router.post('/mods/batch', async (req, res) => {
//   try {
//     const db = req.app.locals.db;
//     const { modIds } = req.body;

//     // Validate input
//     // if (!Array.isArray(modIds)) {
//     //   return res.status(400).json({ error: 'modIds must be an array' });
//     // }
//     // Validate input
//     if (!modIds || typeof modIds[Symbol.iterator] !== 'function') {
//       return res.status(400).json({ error: 'modIds must be iterable' });
//     }
//     const modIdsArray = Array.from(modIds).map((id) => id.toString());
//     if (modIdsArray.length === 0) {
//       return res.json({ mods: [], total: 0 });
//     }

//     // Convert strings to ObjectId if you're using MongoDB ObjectIds
//     // const { ObjectId } = require('mongodb');
//     // const objectIds = modIds.map(id => new ObjectId(id));

//     const mods = await db
//       .collection('mods')
//       .find({ _id: { $in: modIdsArray } })
//       .toArray();

//     res.json({
//       mods,
//       total: mods.length,
//     });
//   } catch (error) {
//     console.error('Database error:', error);
//     res.status(500).json({ error: 'Failed to fetch mods batch' });
//   }
// });

module.exports = router;
