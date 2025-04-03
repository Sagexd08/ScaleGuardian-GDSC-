const express = require('express');
const { check, validationResult } = require('express-validator');
const { authenticateJWT, optionalAuth } = require('../../middleware/auth');
const ingestionService = require('../../services/ingestionService');
const aiProcessingService = require('../../services/aiProcessingService');
const feedbackService = require('../../services/feedbackService');
const Content = require('../../models/Content');
const logger = require('../../utils/logger');

const router = express.Router();

/**
 * @route POST /analyze
 * @desc Analyze content for moderation
 * @access Public (rate limited)
 */
router.post('/analyze', [
  check('content').notEmpty().withMessage('Content is required'),
  check('contentType').isIn(['text', 'image', 'video', 'audio']).withMessage('Valid content type is required'),
  check('source').notEmpty().withMessage('Source is required'),
  optionalAuth
], async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'validation_error',
      message: 'Validation failed',
      details: errors.array() 
    });
  }

  try {
    // Log the request
    logger.info('Content analysis request received', {
      contentType: req.body.contentType,
      source: req.body.source,
      userId: req.user?.id || 'anonymous'
    });

    // Process and analyze the content
    const contentId = await ingestionService.processContent(req.body);
    const analysis = await aiProcessingService.analyzeContent(contentId, req.body.content);

    // Store the analysis result in database
    await Content.findByIdAndUpdate(contentId, {
      analysis: analysis.scores,
      recommendation: analysis.recommendation,
      confidence: analysis.confidence,
      metadata: analysis.metadata || {}
    });
    
    // Store the analysis result
    await ingestionService.storeAnalysisResult(contentId, analysis);

    return res.status(200).json({
      contentId,
      analysis: analysis.scores,
      recommendation: analysis.recommendation,
      confidence: analysis.confidence,
      metadata: analysis.metadata || {}
    });
  } catch (error) {
    logger.error('Error analyzing content', { error: error.message });
    return res.status(500).json({
      error: 'server_error',
      message: 'Failed to analyze content'
    });
  }
});

/**
 * @route GET /status/:contentId
 * @desc Get content moderation status
 * @access Public
 */
router.get('/status/:contentId', async (req, res) => {
  try {
    const { contentId } = req.params;
    // Get content status from database
    const contentStatus = await Content.findById(contentId);
    
    if (!contentStatus) {
      return res.status(404).json({
        error: 'not_found',
        message: 'Content not found'
      });
    }
    
    return res.status(200).json(contentStatus);
  } catch (error) {
    logger.error('Error getting content status', { 
      error: error.message,
      contentId: req.params.contentId
    });
    
    return res.status(500).json({
      error: 'server_error',
      message: 'Failed to retrieve content status'
    });
  }
});

/**
 * @route POST /moderate
 * @desc Apply moderation action to content
 * @access Protected
 */
router.post('/moderate', [
  authenticateJWT,
  check('contentId').notEmpty().withMessage('Content ID is required'),
  check('action').isIn(['approve', 'flag', 'remove', 'restrict']).withMessage('Valid action is required'),
  check('reason').notEmpty().withMessage('Reason is required'),
  check('logToBlockchain').isBoolean().optional()
], async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'validation_error',
      message: 'Validation failed',
      details: errors.array() 
    });
  }

  try {
    const { contentId, action, reason, moderatorNotes, logToBlockchain } = req.body;
    const userId = req.user.id;
    
    // Apply moderation action
    const result = await ingestionService.applyModeration(
      contentId, 
      action, 
      reason, 
      userId,
      { 
        notes: moderatorNotes,
        logToBlockchain: logToBlockchain === true
      }
    );
    
    return res.status(200).json({
      success: true,
      contentId,
      action,
      ...result
    });
  } catch (error) {
    logger.error('Error applying moderation', { 
      error: error.message,
      contentId: req.body.contentId,
      action: req.body.action
    });
    
    if (error.message === 'Content not found') {
      return res.status(404).json({
        error: 'not_found',
        message: 'Content not found'
      });
    }
    
    return res.status(500).json({
      error: 'server_error',
      message: 'Failed to apply moderation action'
    });
  }
});

/**
 * @route POST /report
 * @desc Report content for moderation
 * @access Public (rate limited)
 */
router.post('/report', [
  check('content').notEmpty().withMessage('Content is required'),
  check('contentType').isIn(['text', 'image', 'video', 'audio']).withMessage('Valid content type is required'),
  check('source').notEmpty().withMessage('Source is required'),
  check('reason').notEmpty().withMessage('Reason for report is required'),
  optionalAuth
], async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'validation_error',
      message: 'Validation failed',
      details: errors.array() 
    });
  }

  try {
    const reporterId = req.user?.id || 'anonymous';
    
    // Process the report
    const reportResult = await ingestionService.processReport({
      ...req.body,
      reporterId
    });
    
    // Analyze content using AI processing service
    const analysisResult = await aiProcessingService.analyzeContent(reportResult.contentId, req.body.content);
    
    // Update the content with analysis result in database
    await Content.findByIdAndUpdate(reportResult.contentId, {
      isFlagged: analysisResult.recommendation === 'flag' || analysisResult.recommendation === 'remove',
      categories: analysisResult.metadata?.categories || [],
      confidence: analysisResult.confidence
    });
    
    // Process feedback if reason is provided
    if (req.body.reason) {
      await feedbackService.processFeedback(
        reportResult.contentId,
        {
          source: req.body.source,
          contentType: req.body.contentType,
          reporterId
        },
        {
          type: 'report',
          reason: req.body.reason,
          details: req.body.details || ''
        }
      );
    }
    
    return res.status(200).json({
      success: true,
      reportId: reportResult.reportId,
      contentId: reportResult.contentId,
      status: 'submitted'
    });
  } catch (error) {
    logger.error('Error reporting content', { error: error.message });
    return res.status(500).json({
      error: 'server_error',
      message: 'Failed to submit content report'
    });
  }
});

/**
 * @route POST /feedback
 * @desc Submit feedback about content moderation
 * @access Public (rate limited)
 */
router.post('/feedback', [
  check('contentId').notEmpty().withMessage('Content ID is required'),
  check('feedbackType').isIn(['disagree', 'agree', 'suggestion', 'other']).withMessage('Valid feedback type is required'),
  check('comment').optional(),
  optionalAuth
], async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'validation_error',
      message: 'Validation failed',
      details: errors.array() 
    });
  }

  try {
    const userId = req.user?.id || 'anonymous';
    const { contentId, feedbackType, comment } = req.body;
    
    // Get content metadata from database
    const contentStatus = await Content.findById(contentId);
    
    if (!contentStatus) {
      return res.status(404).json({
        error: 'not_found',
        message: 'Content not found'
      });
    }
    
    // Process the feedback
    const feedbackResult = await feedbackService.processFeedback(
      contentId,
      {
        source: contentStatus.source,
        contentType: contentStatus.contentType,
        userId
      },
      {
        type: feedbackType,
        comment: comment || '',
        timestamp: new Date().toISOString()
      }
    );
    
    // Update feedback count in database
    await Content.findByIdAndUpdate(contentId, {
      $inc: { feedbackCount: 1 },
      $push: { 
        feedbackHistory: {
          type: feedbackType,
          userId,
          timestamp: new Date().toISOString()
        }
      }
    });
    
    return res.status(200).json({
      success: true,
      feedbackId: feedbackResult.feedbackId,
      contentId,
      status: 'received'
    });
  } catch (error) {
    logger.error('Error submitting feedback', { error: error.message });
    return res.status(500).json({
      error: 'server_error',
      message: 'Failed to submit feedback'
    });
  }
});

module.exports = router;
