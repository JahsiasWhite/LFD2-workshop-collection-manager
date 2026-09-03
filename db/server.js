const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config');
const { createProxyMiddleware } = require('http-proxy-middleware');
const modsRouter = require('./routes/mods');
const { loadSlotMatching } = require('./lib/slotMatching');

const app = express();

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      console.warn(`Blocked by CORS: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Steam API proxy setup
// Used to import collections
app.use(
  '/api/steam',
  createProxyMiddleware({
    target: 'https://api.steampowered.com',
    changeOrigin: true,
    pathRewrite: {
      '^/api/steam': '',
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log('Proxying Steam API request:', req.method, req.url);
    },
    onError: (err, req, res) => {
      console.error('Steam API proxy error:', err);
    },
  })
);

// Health check endpoint — pings Supabase so downtime is visible
app.get('/api/health', async (req, res) => {
  const supabase = req.app.locals.db;
  if (!supabase) {
    return res.status(503).json({
      status: 'starting',
      database: 'not_ready',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const { error } = await supabase
      .from('workshop_items')
      .select('id', { count: 'exact', head: true })
      .limit(1);

    if (error) {
      console.error('Health check database error:', error);
      return res.status(503).json({
        status: 'degraded',
        database: 'unavailable',
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      status: 'OK',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'degraded',
      database: 'unavailable',
      timestamp: new Date().toISOString(),
    });
  }
});

// supabase routes
app.use('/api/db', modsRouter);

async function startServer() {
  const db = await connectDB();
  app.locals.db = db;
  await loadSlotMatching();

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
