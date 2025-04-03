const logger = require('../utils/logger');
const Content = require('../models/Content');

/**
 * Ingests content and stores it in the database
 * @param {string} content - The content to ingest
 * @param {Object} metadata - Additional metadata about the content
 * @returns {Promise<Object>} - Result of the ingestion process
 */
async function ingestContent(content, metadata) {
  try {
    logger.info(`Ingesting content: ${content.substring(0, 50)}...`);

    // Create a new Content document
    const newContent = new Content({
      content,
      metadata
    });

    // Save the content to the database
    const savedContent = await newContent.save();

    const ingestionResult = {
      success: true,
      message: 'Content ingested successfully',
      contentId: savedContent._id
    };

    return ingestionResult;
  } catch (error) {
    logger.error('Error ingesting content:', error);
    throw new Error('Failed to ingest content');
  }
}

module.exports = {
  ingestContent
};
