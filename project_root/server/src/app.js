const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');

const contentRoutes = require('./api/routes/contentRoutes');
const moderationRoutes = require('./api/routes/moderationRoutes');
const governanceRoutes = require('./api/routes/governanceRoutes');

const logger = require('./utils/logger');
const config = require('./utils/config');

const app = express();

// Enable CORS
app.use(cors());

// Set security HTTP headers
app.use(helmet());

// Parse JSON request bodies
app.use(express.json());

// Log HTTP requests
app.use(morgan('combined', { stream: logger.stream }));

// MongoDB Connection
mongoose.connect(config.databaseUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  logger.info('Connected to MongoDB');
})
.catch(err => {
  logger.error('MongoDB connection error:', err);
});

// API Routes
app.use('/api/content', contentRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/governance', governanceRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('AI Content Moderation API');
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start the server
const port = config.port || 3000;
app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});

module.exports = app;
