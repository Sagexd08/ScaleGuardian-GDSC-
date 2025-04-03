const express = require('express');
const contentRoutes = require('./routes/contentRoutes');
const moderationRoutes = require('./routes/moderationRoutes');
const governanceRoutes = require('./routes/governanceRoutes');
const { authenticateJWT } = require('../middleware/auth');
const config = require('../utils/config');

const router = express.Router();

// API version
const API_PREFIX = `/v1`;

// Public routes (no authentication required)
router.get('/', (req, res) => {
  res.json({
    name: 'Content Moderation API',
    version: config.API_VERSION,
    status: 'operational'
  });
});

// Content analysis routes - some endpoints are public, others require auth
router.use(`${API_PREFIX}/content`, contentRoutes);

// Protected routes (authentication required)
router.use(`${API_PREFIX}/moderation`, authenticateJWT, moderationRoutes);
router.use(`${API_PREFIX}/governance`, authenticateJWT, governanceRoutes);

// Documentation route
router.get(`${API_PREFIX}/docs`, (req, res) => {
  res.redirect('/docs/api_spec.html');
});

module.exports = router;