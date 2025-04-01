/**
 * Background script for the AI Content Moderation extension
 * Handles communication between content scripts and the server
 */

// Initialize extension state
let config = {
  enabled: true,
  moderationLevel: 'medium',
  autoReport: false,
  serverUrl: 'https://api.contentmod.example.com'
};

// Load configuration from storage
chrome.storage.sync.get(['config'], function(result) {
  if (result.config) {
    config = {...config, ...result.config};
  } else {
    // Save default config
    chrome.storage.sync.set({config});
  }
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SCAN_CONTENT') {
    scanContent(message.content)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({error: error.message}));
    return true; // Indicates async response
  } else if (message.type === 'REPORT_CONTENT') {
    reportContent(message.content, message.metadata)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({error: error.message}));
    return true;
  } else if (message.type === 'UPDATE_CONFIG') {
    config = {...config, ...message.config};
    chrome.storage.sync.set({config});
    sendResponse({success: true});
  } else if (message.type === 'GET_CONFIG') {
    sendResponse({config});
  }
});

/**
 * Scans content using local ML model or server API
 * @param {string} content - The content to scan
 * @returns {Promise<Object>} - Analysis results
 */
async function scanContent(content) {
  try {
    // Try local scan first if model is available
    const localDetectionModule = await import('./modules/ai/detection.js');
    const localResult = await localDetectionModule.detectContent(content);
    
    // If confidence is low or model requires server verification
    if (localResult.confidence < 0.8) {
      return await serverScan(content, localResult);
    }
    
    return localResult;
  } catch (error) {
    console.error('Local scan failed, falling back to server:', error);
    return await serverScan(content);
  }
}

/**
 * Sends content to the server for analysis
 * @param {string} content - The content to scan
 * @param {Object} [localResult] - Optional local scan results
 * @returns {Promise<Object>} - Server analysis results
 */
async function serverScan(content, localResult = null) {
  const response = await fetch(`${config.serverUrl}/api/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      content,
      localResult,
      extensionVersion: chrome.runtime.getManifest().version
    })
  });
  
  if (!response.ok) {
    throw new Error(`Server scan failed: ${response.status}`);
  }
  
  return await response.json();
}

/**
 * Reports content to the moderation server
 * @param {string} content - The content being reported
 * @param {Object} metadata - Additional context info
 * @returns {Promise<Object>} - Report submission result
 */
async function reportContent(content, metadata) {
  const response = await fetch(`${config.serverUrl}/api/report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      content,
      metadata,
      timestamp: new Date().toISOString(),
      extensionVersion: chrome.runtime.getManifest().version
    })
  });
  
  if (!response.ok) {
    throw new Error(`Report submission failed: ${response.status}`);
  }
  
  return await response.json();
}

// Handle installation and updates
chrome.runtime.onInstalled.addListener(details => {
  if (details.reason === 'install') {
    // Open onboarding page
    chrome.tabs.create({
      url: 'https://contentmod.example.com/welcome'
    });
  } else if (details.reason === 'update') {
    // Notify about update
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'assets/icons/icon128.png',
      title: 'Extension Updated',
      message: 'AI Content Moderation has been updated to the latest version.'
    });
  }
});