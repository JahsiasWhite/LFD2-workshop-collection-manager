const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config');
const { createProxyMiddleware } = require('http-proxy-middleware');
const modsRouter = require('./routes/mods');

const app = express();

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [];
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,

    // origin: function (origin, callback) {
    //   // Allow requests with no origin (like curl or mobile apps)
    //   if (!origin) return callback(null, true);
    //   if (allowedOrigins.includes(origin)) return callback(null, true);
    //   return callback(new Error('Not allowed by CORS'));
    // },
    // credentials: true,
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// supabase routes
app.use('/api/db', modsRouter);

async function startServer() {
  const db = await connectDB();
  app.locals.db = db;

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
