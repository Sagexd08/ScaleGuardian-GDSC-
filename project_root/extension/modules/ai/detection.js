/**
 * AI content detection module for local content analysis
 * Uses TensorFlow.js for browser-based inference
 */

// TensorFlow.js is loaded from CDN in the extension
let model = null;
let tokenizer = null;
let modelLoading = false;

/**
 * Load the detection model and tokenizer
 * @returns {Promise<void>}
 */
export async function loadModel() {
  if (model !== null) return;
  if (modelLoading) {
    // Wait for the existing loading operation to complete
    while (modelLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return;
  }
  
  modelLoading = true;
  
  try {
    // Import the model loader module
    const modelLoader = await import('../utils/modelLoader.js');
    
    // Load model and tokenizer
    const result = await modelLoader.loadDetectionModel();
    model = result.model;
    tokenizer = result.tokenizer;
    
    console.log('AI detection model loaded successfully');
  } catch (error) {
    console.error('Failed to load AI detection model:', error);
    throw error;
  } finally {
    modelLoading = false;
  }
}

/**
 * Detects potentially problematic content using local AI model
 * @param {string} content - Text content to analyze
 * @returns {Promise<Object>} - Detection results with confidence scores
 */
export async function detectContent(content) {
  // Load model if not already loaded
  if (model === null) {
    try {
      await loadModel();
    } catch (error) {
      return {
        isFlagged: false,
        confidence: 0,
        categories: [],
        error: 'Model loading failed'
      };
    }
  }
  
  // Preprocess the content
  const processedText = preprocessText(content);
  
  try {
    // Tokenize the text
    const tokenized = tokenizer.tokenize(processedText);
    
    // Ensure we don't exceed the model's maximum sequence length
    const MAX_LENGTH = 512;
    const truncatedTokens = tokenized.slice(0, MAX_LENGTH);
    
    // Create tensor for model input
    const inputTensor = tf.tensor2d([truncatedTokens], [1, truncatedTokens.length]);
    
    // Run inference
    const predictions = await model.predict(inputTensor);
    
    // Get results
    const results = await processResults(predictions);
    
    // Cleanup
    inputTensor.dispose();
    predictions.dispose();
    
    return results;
  } catch (error) {
    console.error('Content detection error:', error);
    return {
      isFlagged: false,
      confidence: 0,
      categories: [],
      error: error.message
    };
  }
}

/**
 * Preprocess text before analysis
 * @param {string} text - Raw input text
 * @returns {string} - Preprocessed text
 */
function preprocessText(text) {
  // Limit text length to prevent processing extremely long content
  const MAX_CHARS = 5000;
  let processedText = text.substring(0, MAX_CHARS);
  
  // Basic preprocessing
  processedText = processedText
    .replace(/\s+/g, ' ')  // Normalize whitespace
    .trim();
  
  return processedText;
}

/**
 * Process model prediction results
 * @param {Tensor} predictions - Model output tensor
 * @returns {Promise<Object>} - Structured results
 */
async function processResults(predictions) {
  // Convert tensor to array
  const predictionArray = await predictions.array();
  const scores = predictionArray[0];
  
  // Category names (must match the model's output classes)
  const categories = [
    'misinformation',
    'hate_speech',
    'adult_content',
    'violent_content',
    'harassment',
    'spam'
  ];
  
  // Find categories exceeding threshold
  const THRESHOLD = 0.5;
  const detectedCategories = [];
  let maxScore = 0;
  
  for (let i = 0; i < categories.length; i++) {
    const score = scores[i];
    if (score > THRESHOLD) {
      detectedCategories.push(categories[i]);
    }
    maxScore = Math.max(maxScore, score);
  }
  
  return {
    isFlagged: detectedCategories.length > 0,
    confidence: maxScore,
    categories: detectedCategories,
    allScores: categories.reduce((obj, cat, i) => {
      obj[cat] = scores[i];
      return obj;
    }, {})
  };
}

/**
 * Determine if the model should be loaded based on user settings
 * @returns {Promise<boolean>}
 */
export async function shouldPreloadModel() {
  return new Promise(resolve => {
    chrome.storage.sync.get(['config'], result => {
      const config = result.config || {};
      resolve(config.preloadModel !== false); // Default to true
    });
  });
}

// Check if we should preload the model
shouldPreloadModel().then(shouldPreload => {
  if (shouldPreload) {
    // Preload model with a slight delay to not block extension startup
    setTimeout(() => {
      loadModel().catch(err => console.error('Preload failed:', err));
    }, 2000);
  }
});
