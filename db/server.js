// const express = require('express');
// const { connectDB } = require('./config');
// const modsRouter = require('./routes/mods');
// const cors = require('cors');

// const app = express();
// app.use(cors());

// async function startServer() {
//   const db = await connectDB();
//   app.locals.db = db;

//   app.use(express.json());
//   app.use(modsRouter);

//   const PORT = process.env.PORT || 3000;
//   app.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
//   });
// }

// startServer();

// src/server.js
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config');
const { createProxyMiddleware } = require('http-proxy-middleware');
const modsRouter = require('./routes/mods');

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Steam API proxy setup (keep your existing proxy setup)
app.use(
  '/api/steam',
  createProxyMiddleware({
    target: 'https://api.steampowered.com',
    changeOrigin: true,
    pathRewrite: {
      '^/api/steam': '',
    },
  })
);

// MongoDB routes - note the different base path
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
