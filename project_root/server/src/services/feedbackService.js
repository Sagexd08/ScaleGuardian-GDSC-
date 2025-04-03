const logger = require('../utils/logger');
const mongoose = require('mongoose');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Constants for feedback types and confidence thresholds
const FEEDBACK_TYPES = {
  AGREE: 'agree',
  DISAGREE: 'disagree',
  NEUTRAL: 'neutral'
};

const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.85,
  MEDIUM: 0.65,
  LOW: 0.40
};

// Model schema for feedback storage (assuming MongoDB is used)
const FeedbackSchema = new mongoose.Schema({
  id: { type: String, default: () => uuidv4(), unique: true },
  contentId: { type: String, required: true, index: true },
  content: { type: String, required: true },
  feedback: { 
    type: String, 
    required: true, 
    enum: Object.values(FEEDBACK_TYPES)
  },
  metadata: {
    userId: String,
    contentType: String,
    moderationSource: String,
    originalClassification: String,
    confidence: Number,
    timestamp: { type: Date, default: Date.now }
  },
  learningOutcome: {
    newClassification: String,
    adjustmentMade: Boolean,
    confidenceChange: Number
  },
  processed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Initialize model if it doesn't exist
let Feedback;
try {
  Feedback = mongoose.model('Feedback');
} catch (error) {
  Feedback = mongoose.model('Feedback', FeedbackSchema);
}

/**
 * Processes user feedback on content moderation
 * @param {string} content - The content being reviewed
 * @param {Object} metadata - Additional metadata about the content
 * @param {string} metadata.userId - ID of the user providing feedback
 * @param {string} metadata.contentType - Type of content (text, image, video)
 * @param {string} metadata.contentId - Unique identifier for the content
 * @param {string} metadata.moderationSource - Source of initial moderation decision
 * @param {string} metadata.originalClassification - Initial classification
 * @param {number} metadata.confidence - Confidence score of initial classification
 * @param {string} feedback - User feedback ('agree', 'disagree', or 'neutral')
 * @returns {Promise<Object>} - Result of the feedback processing
 */
async function processFeedback(content, metadata, feedback) {
  if (!content) {
    throw new Error('Content is required for feedback processing');
  }
  
  if (!metadata || !metadata.contentId) {
    throw new Error('Content ID is required in metadata');
  }
  
  if (!Object.values(FEEDBACK_TYPES).includes(feedback)) {
    throw new Error(`Invalid feedback type. Must be one of: ${Object.values(FEEDBACK_TYPES).join(', ')}`);
  }

  const feedbackId = uuidv4();
  logger.info(`[${feedbackId}] Processing ${feedback} feedback for content ID: ${metadata.contentId}`);
  
  try {
    // Step 1: Store the feedback in database
    const feedbackEntry = await storeFeedback(content, metadata, feedback, feedbackId);
    
    // Step 2: Analyze feedback impact on moderation system
    const analysisResult = await analyzeFeedbackImpact(feedbackEntry);
    
    // Step 3: Send feedback to machine learning service for model improvement
    const mlUpdateResult = await updateMachineLearningModel(feedbackEntry, analysisResult);
    
    // Step 4: Update analytics metrics
    await updateAnalytics(feedbackEntry, analysisResult);
    
    // Step 5: Mark feedback as processed
    await markFeedbackAsProcessed(feedbackEntry.id, mlUpdateResult);
    
    logger.info(`[${feedbackId}] Feedback processing completed successfully`);
    
    return {
      success: true,
      feedbackId: feedbackEntry.id,
      message: 'Feedback processed successfully',
      impact: getImpactSummary(analysisResult),
      modelUpdated: mlUpdateResult.modelUpdated
    };
  } catch (error) {
    const errorId = uuidv4();
    logger.error(`[${feedbackId}] Error processing feedback [${errorId}]:`, error);
    
    // Record the error but don't expose internal details to client
    await recordProcessingError(feedbackId, error, errorId);
    
    throw new Error(`Failed to process feedback. Reference ID: ${errorId}`);
  }
}

/**
 * Stores feedback in the database
 * @param {string} content - Content being moderated
 * @param {Object} metadata - Content metadata
 * @param {string} feedback - User feedback
 * @param {string} feedbackId - Unique identifier for this feedback
 * @returns {Promise<Object>} - Stored feedback entry
 */
async function storeFeedback(content, metadata, feedback, feedbackId) {
  try {
    const feedbackData = {
      id: feedbackId,
      contentId: metadata.contentId,
      content: content,
      feedback: feedback,
      metadata: {
        userId: metadata.userId || 'anonymous',
        contentType: metadata.contentType || 'text',
        moderationSource: metadata.moderationSource || 'automated',
        originalClassification: metadata.originalClassification || 'unknown',
        confidence: metadata.confidence || 0,
        timestamp: new Date()
      }
    };
    
    const feedbackEntry = new Feedback(feedbackData);
    await feedbackEntry.save();
    
    logger.debug(`[${feedbackId}] Feedback stored in database`);
    return feedbackEntry;
  } catch (error) {
    logger.error(`[${feedbackId}] Error storing feedback:`, error);
    throw new Error('Failed to store feedback data');
  }
}

/**
 * Analyzes the impact of user feedback on the moderation system
 * @param {Object} feedbackEntry - The stored feedback entry
 * @returns {Promise<Object>} - Analysis results
 */
async function analyzeFeedbackImpact(feedbackEntry) {
  try {
    // Extract needed information
    const { feedback, metadata } = feedbackEntry;
    const { originalClassification, confidence } = metadata;
    
    // Determine the impact level based on feedback type and original confidence
    let impactLevel = 'low';
    let confidenceAdjustment = 0;
    let requiresReview = false;
    
    if (feedback === FEEDBACK_TYPES.DISAGREE) {
      // Disagreement has higher impact when original confidence was high
      if (confidence > CONFIDENCE_THRESHOLDS.HIGH) {
        impactLevel = 'high';
        confidenceAdjustment = -0.15;
        requiresReview = true;
      } else if (confidence > CONFIDENCE_THRESHOLDS.MEDIUM) {
        impactLevel = 'medium';
        confidenceAdjustment = -0.1;
        requiresReview = false;
      } else {
        confidenceAdjustment = -0.05;
      }
    } else if (feedback === FEEDBACK_TYPES.AGREE) {
      // Agreement reinforces the model's decision
      if (confidence < CONFIDENCE_THRESHOLDS.MEDIUM) {
        // Low confidence agreements are more impactful for learning
        impactLevel = 'medium';
        confidenceAdjustment = 0.1;
      } else {
        confidenceAdjustment = 0.05;
      }
    }
    
    // Check if this feedback is part of a pattern
    const similarFeedbackCount = await countSimilarFeedback(feedbackEntry);
    
    if (similarFeedbackCount > 5) {
      impactLevel = impactLevel === 'low' ? 'medium' : 'high';
      requiresReview = true;
    }
    
    logger.debug(`[${feedbackEntry.id}] Feedback impact analysis completed: ${impactLevel} impact`);
    
    return {
      impactLevel,
      confidenceAdjustment,
      requiresReview,
      similarFeedbackCount,
      recommendedAction: getRecommendedAction(impactLevel, feedback, originalClassification)
    };
  } catch (error) {
    logger.error(`[${feedbackEntry.id}] Error analyzing feedback impact:`, error);
    throw new Error('Failed to analyze feedback impact');
  }
}

/**
 * Counts similar feedback entries in the database
 * @param {Object} feedbackEntry - The current feedback entry
 * @returns {Promise<number>} - Count of similar feedback entries
 */
async function countSimilarFeedback(feedbackEntry) {
  try {
    const { contentId, feedback, metadata } = feedbackEntry;
    const { originalClassification } = metadata;
    
    // Look for feedback with same classification and feedback type
    const count = await Feedback.countDocuments({
      contentId: { $ne: contentId }, // Not the same content
      feedback: feedback,
      'metadata.originalClassification': originalClassification,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    });
    
    return count;
  } catch (error) {
    logger.warn(`[${feedbackEntry.id}] Error counting similar feedback:`, error);
    return 0; // Return 0 to avoid blocking the main process
  }
}

/**
 * Determines recommended action based on impact analysis
 * @param {string} impactLevel - Level of impact
 * @param {string} feedback - User feedback
 * @param {string} originalClassification - Original content classification
 * @returns {string} - Recommended action
 */
function getRecommendedAction(impactLevel, feedback, originalClassification) {
  if (impactLevel === 'high' && feedback === FEEDBACK_TYPES.DISAGREE) {
    return `Review moderation policy for "${originalClassification}" content`;
  } else if (impactLevel === 'medium') {
    return 'Monitor similar content for pattern recognition';
  } else {
    return 'No immediate action required';
  }
}

/**
 * Sends feedback to machine learning service for model improvement
 * @param {Object} feedbackEntry - The feedback entry
 * @param {Object} analysisResult - Result of impact analysis
 * @returns {Promise<Object>} - ML update result
 */
async function updateMachineLearningModel(feedbackEntry, analysisResult) {
  try {
    const { impactLevel, confidenceAdjustment } = analysisResult;
    
    // For demonstration, we'll simulate ML API call
    // In a real implementation, this would call an actual ML service
    
    // Only update model for medium and high impact feedback
    if (impactLevel === 'low') {
      logger.debug(`[${feedbackEntry.id}] Skipping ML model update due to low impact`);
      return { 
        modelUpdated: false,
        reason: 'Low impact feedback'
      };
    }
    
    // Simulate API call to ML service
    /* 
    const mlServiceResponse = await axios.post('https://api.ml-service.example/update', {
      contentType: feedbackEntry.metadata.contentType,
      content: feedbackEntry.content,
      currentClassification: feedbackEntry.metadata.originalClassification,
      userFeedback: feedbackEntry.feedback,
      confidenceAdjustment: confidenceAdjustment
    });
    */
    
    // Simulate response for now
    const mlUpdateSuccess = Math.random() > 0.1; // 90% success rate simulation
    
    if (mlUpdateSuccess) {
      logger.info(`[${feedbackEntry.id}] Machine learning model updated successfully`);
      
      // Update the feedback entry with learning outcome
      await Feedback.updateOne(
        { id: feedbackEntry.id },
        { 
          $set: {
            'learningOutcome': {
              newClassification: feedbackEntry.metadata.originalClassification,
              adjustmentMade: true,
              confidenceChange: confidenceAdjustment
            }
          }
        }
      );
      
      return {
        modelUpdated: true,
        adjustmentMade: confidenceAdjustment !== 0
      };
    } else {
      logger.warn(`[${feedbackEntry.id}] Failed to update machine learning model`);
      return {
        modelUpdated: false,
        reason: 'ML service error'
      };
    }
  } catch (error) {
    logger.error(`[${feedbackEntry.id}] Error updating ML model:`, error);
    return {
      modelUpdated: false,
      reason: 'Internal error'
    };
  }
}

/**
 * Updates analytics metrics based on feedback
 * @param {Object} feedbackEntry - The feedback entry
 * @param {Object} analysisResult - Result of impact analysis
 * @returns {Promise<void>}
 */
async function updateAnalytics(feedbackEntry, analysisResult) {
  try {
    // In a real implementation, this might update a time-series database
    // or send metrics to a monitoring service like Prometheus
    
    // For demonstration, we'll just log the analytics update
    logger.debug(`[${feedbackEntry.id}] Updating analytics metrics`);
    
    // Simulate analytics update success
    return {
      updated: true
    };
  } catch (error) {
    logger.warn(`[${feedbackEntry.id}] Error updating analytics:`, error);
    // Don't throw error to prevent blocking main process
    return {
      updated: false
    };
  }
}

/**
 * Marks feedback as processed in the database
 * @param {string} feedbackId - ID of the feedback entry
 * @param {Object} mlUpdateResult - Result of machine learning update
 * @returns {Promise<void>}
 */
async function markFeedbackAsProcessed(feedbackId, mlUpdateResult) {
  try {
    await Feedback.updateOne(
      { id: feedbackId },
      { 
        $set: {
          processed: true,
          updatedAt: new Date(),
          'learningOutcome.modelUpdated': mlUpdateResult.modelUpdated
        }
      }
    );
    
    logger.debug(`[${feedbackId}] Feedback marked as processed`);
  } catch (error) {
    logger.error(`[${feedbackId}] Error marking feedback as processed:`, error);
    throw new Error('Failed to update feedback status');
  }
}

/**
 * Records an error during feedback processing
 * @param {string} feedbackId - ID of the feedback entry
 * @param {Error} error - The error that occurred
 * @param {string} errorId - Unique ID for this error
 * @returns {Promise<void>}
 */
async function recordProcessingError(feedbackId, error, errorId) {
  try {
    // In a real implementation, this might store errors in a dedicated collection
    logger.error(`[${feedbackId}] Processing error ${errorId}: ${error.message}`);
    
    // Update feedback entry with error information
    await Feedback.updateOne(
      { id: feedbackId },
      { 
        $set: {
          processingError: {
            errorId: errorId,
            message: error.message,
            timestamp: new Date()
          }
        }
      }
    );
  } catch (secondaryError) {
    // Log but don't throw, as we're already in an error handler
    logger.error(`[${feedbackId}] Failed to record processing error:`, secondaryError);
  }
}

/**
 * Creates a user-friendly summary of the feedback impact
 * @param {Object} analysisResult - Result of impact analysis
 * @returns {Object} - Impact summary
 */
function getImpactSummary(analysisResult) {
  const { impactLevel, recommendedAction } = analysisResult;
  
  return {
    level: impactLevel,
    action: recommendedAction,
    description: getImpactDescription(impactLevel)
  };
}

/**
 * Returns a description based on impact level
 * @param {string} impactLevel - Impact level (low, medium, high)
 * @returns {string} - Impact description
 */
function getImpactDescription(impactLevel) {
  switch (impactLevel) {
    case 'high':
      return 'This feedback significantly affects our moderation system and will be prioritized for review.';
    case 'medium':
      return 'This feedback provides valuable insights for improving our moderation system.';
    case 'low':
    default:
      return 'Thank you for your feedback. It helps us maintain quality moderation.';
  }
}

/**
 * Retrieves feedback statistics for a specific content type
 * @param {string} contentType - Type of content
 * @param {number} days - Number of days to look back
 * @returns {Promise<Object>} - Feedback statistics
 */
async function getFeedbackStats(contentType, days = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const stats = await Feedback.aggregate([
      {
        $match: {
          'metadata.contentType': contentType,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$feedback',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Convert to more readable format
    const formattedStats = {
      agree: 0,
      disagree: 0,
      neutral: 0,
      total: 0
    };
    
    stats.forEach(stat => {
      formattedStats[stat._id] = stat.count;
      formattedStats.total += stat.count;
    });
    
    return formattedStats;
  } catch (error) {
    logger.error(`Error retrieving feedback stats for ${contentType}:`, error);
    throw new Error('Failed to retrieve feedback statistics');
  }
}

module.exports = {
  processFeedback,
  getFeedbackStats,
  FEEDBACK_TYPES
};
