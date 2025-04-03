/**
 * gemini.js - Google Gemini API integration for content moderation
 * 
 * This module handles communication with the Gemini API for analyzing and
 * moderating web content in real-time.
 */

// Configuration constants
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
const DEFAULT_API_KEY = ''; // Should be provided by the user in extension settings

// Cache for moderation results to reduce API usage
const moderationCache = new Map();
const CACHE_MAX_SIZE = 100;
const CACHE_TTL = 3600000; // 1 hour in milliseconds

/**
 * Content moderation result object.
 * @typedef {Object} ModerationResult
 * @property {boolean} isHarmful - Whether the content contains harmful elements
 * @property {Object} categories - Specific category results
 * @property {string} explanation - Detailed explanation of the moderation decision
 * @property {number} timestamp - When the result was generated
 */

/**
 * Initialize the Gemini integration.
 * @param {Object} config - Configuration options
 * @param {string} config.apiKey - Gemini API key
 * @returns {Object} Gemini API controller
 */
export function initializeGemini(config = {}) {
  const apiKey = config.apiKey || getStoredApiKey();

  if (!apiKey) {
    console.warn('Gemini API key not provided. Content moderation will not function.');
  }

  return {
    /**
     * Analyze content for potentially harmful elements.
     * @param {string} content - Text content to analyze
     * @returns {Promise<ModerationResult>} Moderation result
     */
    analyzeContent: async (content) => {
      // Skip empty content
      if (!content || content.trim() === '') {
        return createEmptyResult();
      }

      // Check cache first
      const cacheKey = hashContent(content);
      if (moderationCache.has(cacheKey)) {
        const cachedResult = moderationCache.get(cacheKey);
        if (Date.now() - cachedResult.timestamp < CACHE_TTL) {
          return cachedResult;
        }
        moderationCache.delete(cacheKey);
      }

      try {
        const result = await requestModeration(content, apiKey);
        
        // Cache the result
        if (moderationCache.size >= CACHE_MAX_SIZE) {
          // Remove oldest entry if cache is full
          const oldestKey = moderationCache.keys().next().value;
          moderationCache.delete(oldestKey);
        }
        moderationCache.set(cacheKey, result);
        
        return result;
      } catch (error) {
        console.error('Gemini moderation error:', error);
        return {
          isHarmful: false,
          categories: {},
          explanation: 'Error occurred during content analysis.',
          error: error.message,
          timestamp: Date.now()
        };
      }
    },

    /**
     * Get the current API key status.
     * @returns {Object} Status information
     */
    getApiStatus: () => {
      return {
        hasApiKey: !!apiKey,
        isConfigured: !!apiKey
      };
    },

    /**
     * Update the Gemini API key.
     * @param {string} newApiKey - New API key to use
     * @returns {boolean} Success status
     */
    updateApiKey: (newApiKey) => {
      if (newApiKey && typeof newApiKey === 'string') {
        storeApiKey(newApiKey);
        return true;
      }
      return false;
    },

    /**
     * Clear the moderation cache.
     */
    clearCache: () => {
      moderationCache.clear();
    }
  };
}

/**
 * Make a request to the Gemini API for content moderation.
 * @param {string} content - Content to moderate
 * @param {string} apiKey - Gemini API key
 * @returns {Promise<ModerationResult>} Moderation result
 * @private
 */
async function requestModeration(content, apiKey) {
  const requestBody = {
    contents: [{
      parts: [{
        text: `Please moderate the following content and identify if it contains harmful, offensive, or inappropriate material. Provide a detailed analysis of any problematic content found, categorizing issues as: hate speech, violence, sexual content, harassment, or other harmful content. If the content is safe, indicate that as well.\n\nContent to moderate:\n${content}`
      }]
    }],
    generationConfig: {
      temperature: 0.2,
      topP: 0.8,
      topK: 40
    }
  };

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return processGeminiResponse(data, content);
}

/**
 * Process the Gemini API response and extract moderation results.
 * @param {Object} response - Raw API response
 * @param {string} originalContent - The original content that was moderated
 * @returns {ModerationResult} Processed moderation result
 * @private
 */
function processGeminiResponse(response, originalContent) {
  if (!response.candidates || !response.candidates[0]?.content?.parts) {
    throw new Error('Unexpected API response format');
  }

  const textParts = response.candidates[0].content.parts
    .filter(part => part.text)
    .map(part => part.text);

  const fullText = textParts.join(' ');
  
  // Analyze the response to determine if content is harmful
  const harmfulKeywords = [
    'harmful', 'offensive', 'inappropriate', 'hate speech', 
    'violence', 'sexual content', 'harassment'
  ];
  
  const isHarmful = harmfulKeywords.some(keyword => 
    fullText.toLowerCase().includes(keyword)
  );

  // Extract categories (simplified implementation)
  const categories = {
    hateSpeech: fullText.toLowerCase().includes('hate speech'),
    violence: fullText.toLowerCase().includes('violence'),
    sexualContent: fullText.toLowerCase().includes('sexual content'),
    harassment: fullText.toLowerCase().includes('harassment'),
    other: fullText.toLowerCase().includes('other harmful content')
  };

  return {
    isHarmful,
    categories,
    explanation: fullText,
    originalContent: originalContent.substring(0, 100) + '...', // Store preview of original content
    timestamp: Date.now()
  };
}

/**
 * Create a hash for content to use as cache key.
 * @param {string} content - Content to hash
 * @returns {string} Hash string
 * @private
 */
function hashContent(content) {
  // Simple hash function for caching
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString();
}

/**
 * Create an empty moderation result.
 * @returns {ModerationResult} Empty result
 * @private
 */
function createEmptyResult() {
  return {
    isHarmful: false,
    categories: {},
    explanation: 'No content to analyze.',
    timestamp: Date.now()
  };
}

/**
 * Get the stored API key from extension storage.
 * @returns {string|null} Stored API key or null
 * @private
 */
function getStoredApiKey() {
  // Implementation depends on browser extension API
  // This is a placeholder that should be replaced with actual implementation
  if (typeof chrome !== 'undefined' && chrome.storage) {
    // Chrome extension storage implementation
    return new Promise((resolve) => {
      chrome.storage.sync.get(['geminiApiKey'], (result) => {
        resolve(result.geminiApiKey || '');
      });
    });
  } else if (typeof browser !== 'undefined' && browser.storage) {
    // Firefox extension storage implementation
    return browser.storage.sync.get('geminiApiKey')
      .then(result => result.geminiApiKey || '');
  }
  
  // Fallback to localStorage for development
  return localStorage.getItem('geminiApiKey') || '';
}

/**
 * Store API key in extension storage.
 * @param {string} apiKey - API key to store
 * @private
 */
function storeApiKey(apiKey) {
  // Implementation depends on browser extension API
  // This is a placeholder that should be replaced with actual implementation
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.sync.set({ geminiApiKey: apiKey });
  } else if (typeof browser !== 'undefined' && browser.storage) {
    browser.storage.sync.set({ geminiApiKey: apiKey });
  } else {
    // Fallback to localStorage for development
    localStorage.setItem('geminiApiKey', apiKey);
  }
}

// Export the module
export default {
  initializeGemini
};