/**
 * Model loader module for downloading and initializing TensorFlow.js models
 */

// Store model metadata for version control
const MODEL_VERSION = 'v1.0.0';
const MODEL_UPDATE_URL = 'https://api.contentmod.example.com/model/latest';

// Maximum number of retries for model loading
const MAX_RETRIES = 3;

/**
 * Load the detection model and tokenizer
 * @returns {Promise<Object>} The loaded model and tokenizer
 */
export async function loadDetectionModel() {
  // Ensure TensorFlow.js is available
  if (typeof tf === 'undefined') {
    await loadTensorFlowJS();
  }
  
  // Check if we have the latest model info
  const modelInfo = await getModelInfo();
  
  // Load model from cache or download
  const model = await loadModel(modelInfo);
  
  // Load tokenizer
  const tokenizer = await loadTokenizer(modelInfo);
  
  return { model, tokenizer };
}

/**
 * Dynamically load TensorFlow.js
 * @returns {Promise<void>}
 */
async function loadTensorFlowJS() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.18.0';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load TensorFlow.js'));
    document.head.appendChild(script);
  });
}

/**
 * Get model information including version and URLs
 * @returns {Promise<Object>} Model metadata
 */
async function getModelInfo() {
  // Check if we have cached model info
  const cachedInfo = await getCachedModelInfo();
  
  // If we have fresh cached info, use it
  if (cachedInfo && !isModelInfoExpired(cachedInfo)) {
    return cachedInfo;
  }
  
  try {
    // Fetch latest model info from server
    const response = await fetch(MODEL_UPDATE_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch model info: ${response.status}`);
    }
    
    const modelInfo = await response.json();
    
    // Cache the model info
    await cacheModelInfo(modelInfo);
    
    return modelInfo;
  } catch (error) {
    console.error('Error fetching model info:', error);
    
    // Fall back to cached info even if expired, or use default
    return cachedInfo || getDefaultModelInfo();
  }
}

/**
 * Check if the model info cache is expired
 * @param {Object} info - Cached model info
 * @returns {boolean} True if expired
 */
function isModelInfoExpired(info) {
  if (!info.timestamp) return true;
  
  const now = Date.now();
  const cacheTime = new Date(info.timestamp).getTime();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  return (now - cacheTime) > maxAge;
}

/**
 * Get cached model info from storage
 * @returns {Promise<Object|null>}
 */
async function getCachedModelInfo() {
  return new Promise(resolve => {
    chrome.storage.local.get(['modelInfo'], result => {
      resolve(result.modelInfo || null);
    });
  });
}

/**
 * Cache model info to storage
 * @param {Object} modelInfo - Model metadata to cache
 * @returns {Promise<void>}
 */
async function cacheModelInfo(modelInfo) {
  // Add timestamp to the info
  const infoToCache = {
    ...modelInfo,
    timestamp: new Date().toISOString()
  };
  
  return new Promise(resolve => {
    chrome.storage.local.set({modelInfo: infoToCache}, resolve);
  });
}

/**
 * Get default model info as fallback
 * @returns {Object} Default model configuration
 */
function getDefaultModelInfo() {
  return {
    version: MODEL_VERSION,
    modelUrl: 'https://storage.googleapis.com/contentmod-models/detection_model/model.json',
    tokenizerUrl: 'https://storage.googleapis.com/contentmod-models/detection_model/tokenizer.json',
    timestamp: new Date().toISOString()
  };
}

/**
 * Load the model from cache or download with retry mechanism
 * @param {Object} modelInfo - Model metadata
 * @param {number} [retryCount=0] - Current retry count
 * @returns {Promise<tf.LayersModel>} TensorFlow.js model
 */
async function loadModel(modelInfo, retryCount = 0) {
  try {
    // Try to load from IndexedDB cache first
    const cachedModel = await tf.loadLayersModel('indexeddb://content-detection-model');
    
    // Check if model is current version
    const modelVersion = await getModelVersion(cachedModel);
    if (modelVersion === modelInfo.version) {
      console.log('Using cached model:', modelVersion);
      return cachedModel;
    }
    
    console.log('Cached model outdated, downloading new version');
    // Clear cache and download new model
    await tf.io.removeModel('indexeddb://content-detection-model');
    return await downloadModel(modelInfo);
  } catch (error) {
    console.warn(`Model loading failed (attempt ${retryCount + 1}):`, error);
    if (retryCount < MAX_RETRIES) {
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      return loadModel(modelInfo, retryCount + 1);
    } else {
      console.error('Max retries reached, model loading failed.');
      throw error; // Propagate the error
    }
  }
}

/**
 * Get model version from model metadata
 * @param {tf.LayersModel} model - The loaded model
 * @returns {Promise<string>} Model version
 */
async function getModelVersion(model) {
  if (!model.metadata) return 'unknown';
  return model.metadata.version || 'unknown';
}

/**
 * Download model from server
 * @param {Object} modelInfo - Model metadata
 * @returns {Promise<tf.LayersModel>} Downloaded model
 */
async function downloadModel(modelInfo) {
  // Load the model
  const model = await tf.loadLayersModel(modelInfo.modelUrl);
  
  // Save metadata
  model.metadata = { version: modelInfo.version };
  
  // Save to IndexedDB for future use
  await model.save('indexeddb://content-detection-model');
  
  return model;
}

/**
 * Load tokenizer for text processing with retry mechanism
 * @param {Object} modelInfo - Model metadata
 * @param {number} [retryCount=0] - Current retry count
 * @returns {Promise<Object>} Tokenizer object
 */
async function loadTokenizer(modelInfo, retryCount = 0) {
  try {
    // Try to load from cache first
    const cachedTokenizer = await getCachedTokenizer();

    if (cachedTokenizer && cachedTokenizer.version === modelInfo.version) {
      console.log('Using cached tokenizer:', cachedTokenizer.version);
      return createTokenizer(cachedTokenizer);
    }

    // Download new tokenizer
    console.log('Downloading tokenizer');
    return await downloadTokenizer(modelInfo);
  } catch (error) {
    console.warn(`Tokenizer loading failed (attempt ${retryCount + 1}):`, error);
    if (retryCount < MAX_RETRIES) {
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      return loadTokenizer(modelInfo, retryCount + 1);
    } else {
      console.error('Max retries reached, tokenizer loading failed.');
      throw error; // Propagate the error
    }
  }
}

/**
 * Get cached tokenizer from storage
 * @returns {Promise<Object|null>}
 */
async function getCachedTokenizer() {
  return new Promise(resolve => {
    chrome.storage.local.get(['tokenizer'], result => {
      resolve(result.tokenizer || null);
    });
  });
}

/**
 * Download tokenizer from server
 * @param {Object} modelInfo - Model metadata
 * @returns {Promise<Object>} Tokenizer object
 */
async function downloadTokenizer(modelInfo) {
  // Fetch tokenizer data
  const response = await fetch(modelInfo.tokenizerUrl);

  if (!response.ok) {
    throw new Error(`Failed to download tokenizer: ${response.status}`);
  }

  const tokenizerData = await response.json();

  // Add version information
  tokenizerData.version = modelInfo.version;

  // Cache for future use
  await cacheTokenizer(tokenizerData);

  // Create and return tokenizer
  return createTokenizer(tokenizerData);
}

/**
 * Cache tokenizer to storage
 * @param {Object} tokenizerData - Tokenizer data to cache
 * @returns {Promise<void>}
 */
async function cacheTokenizer(tokenizerData) {
  return new Promise(resolve => {
    chrome.storage.local.set({tokenizer: tokenizerData}, resolve);
  });
}

/**
 * Create tokenizer object from data
 * @param {Object} tokenizerData - Tokenizer configuration
 * @returns {Object} Tokenizer with tokenize methods
 */
function createTokenizer(tokenizerData) {
  return {
    wordIndex: tokenizerData,
    tokenize: function(text) {
      // Basic tokenizer implementation
      const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
      return words.map(word => this.wordIndex[word] || 0);
    },
    // Get tokenizer version
    get version() {
      return tokenizerData.version;
    }
  };
}

/**
 * Check if models need updating
 * @returns {Promise<boolean>} True if updates are available
 */
export async function checkForModelUpdates() {
  try {
    // Get current model info
    const currentInfo = await getCachedModelInfo();
    if (!currentInfo) return true; // No models, definitely need update
    
    // Fetch latest model info
    const response = await fetch(MODEL_UPDATE_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to check for updates: ${response.status}`);
    }
    
    const latestInfo = await response.json();
    
    // Compare versions
    return latestInfo.version !== currentInfo.version;
  } catch (error) {
    console.error('Error checking for model updates:', error);
    return false; // On error, don't trigger update
  }
}

/**
 * Calculate model storage usage
 * @returns {Promise<Object>} Storage info in bytes
 */
export async function getModelStorageInfo() {
  return new Promise(resolve => {
    chrome.storage.local.getBytesInUse(null, bytesInUse => {
      resolve({
        totalBytes: bytesInUse,
        formattedSize: formatBytes(bytesInUse)
      });
    });
  });
}

/**
 * Format bytes to human-readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size (KB, MB, etc.)
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
}

// Export additional functions for testing
export {
  loadModel,
  loadTokenizer,
  getModelInfo,
  loadTensorFlowJS,
  getCachedTokenizer,
  downloadTokenizer,
  createTokenizer
};
