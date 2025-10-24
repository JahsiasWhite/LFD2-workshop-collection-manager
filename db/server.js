const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config');
const { createProxyMiddleware } = require('http-proxy-middleware');
const modsRouter = require('./routes/mods');

const app = express();

// CORS configuration
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// MongoDB routes
app.use('/api/db', modsRouter);
// Pass supabase to routes that need it
// app.use('/mods', modsRoutes(supabase));

async function startServer() {
  const db = await connectDB();
  app.locals.db = db;

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
