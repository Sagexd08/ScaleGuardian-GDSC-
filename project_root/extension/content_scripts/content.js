/**
 * Content script for AI Content Moderation extension
 * Scans page content and provides visual indicators for moderated content
 */

// Configuration and state
let config = {
  enabled: true,
  moderationLevel: 'medium',
  highlightColor: 'rgba(255, 0, 0, 0.2)',
  showNotifications: true
};

// Tracked elements with moderation data
const moderatedElements = new Map();

// Elements to observe for content changes
const textContainers = [
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'article', 
  'section', 'div', 'span', 'li', 'td', 'blockquote'
];

// Initialize and load configuration
async function initialize() {
  // Get configuration from background script
  chrome.runtime.sendMessage({type: 'GET_CONFIG'}, response => {
    if (response && response.config) {
      config = {...config, ...response.config};
    }
    
    if (config.enabled) {
      setupObserver();
      scanVisibleContent();
    }
  });
  
  // Add context menu for reporting
  setupContextMenu();
}

// Setup mutation observer to detect content changes
function setupObserver() {
  const observer = new MutationObserver(mutations => {
    const relevantMutations = mutations.filter(mutation => {
      // Check if text content changed or elements were added
      return mutation.type === 'characterData' || 
             (mutation.type === 'childList' && mutation.addedNodes.length > 0);
    });
    
    if (relevantMutations.length > 0) {
      scanVisibleContent();
    }
  });
  
  // Start observing body with configuration
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
}

// Scan all visible content on the page
async function scanVisibleContent() {
  // Collect text nodes that match our criteria
  const textElements = [];
  textContainers.forEach(tag => {
    const elements = Array.from(document.querySelectorAll(tag));
    elements.forEach(element => {
      // Ignore already processed elements
      if (!moderatedElements.has(element) && element.textContent.trim().length > 20) {
        textElements.push(element);
      }
    });
  });
  
  // Process elements in batches to avoid freezing the page
  const BATCH_SIZE = 10;
  for (let i = 0; i < textElements.length; i += BATCH_SIZE) {
    const batch = textElements.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(processElement));
    
    // Small delay to keep UI responsive
    if (i + BATCH_SIZE < textElements.length) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
}

// Process a single element for moderation
async function processElement(element) {
  const content = element.textContent.trim();
  
  // Skip short content
  if (content.length < 20) return;
  
  try {
    // Send content to background script for analysis
    const result = await new Promise(resolve => {
      chrome.runtime.sendMessage(
        {type: 'SCAN_CONTENT', content}, 
        resolve
      );
    });
    
    if (result.error) {
      console.error('Scan error:', result.error);
      return;
    }
    
    // Store result with the element
    moderatedElements.set(element, result);
    
    // Apply visual treatment based on moderation result
    if (result.isFlagged && result.confidence > getConfidenceThreshold()) {
      applyModeration(element, result);
    }
  } catch (error) {
    console.error('Processing error:', error);
  }
}

// Apply visual treatment to flagged content
function applyModeration(element, result) {
  // Create a wrapper if needed
  const wrapper = document.createElement('div');
  wrapper.className = 'ai-moderation-wrapper';
  wrapper.style.position = 'relative';
  wrapper.style.display = 'inline-block';
  
  // Create the highlight overlay
  const overlay = document.createElement('div');
  overlay.className = 'ai-moderation-overlay';
  overlay.style.position = 'absolute';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = config.highlightColor;
  overlay.style.pointerEvents = 'none';
  overlay.style.zIndex = '1000';
  
  // Add warning badge
  const badge = document.createElement('div');
  badge.className = 'ai-moderation-badge';
  badge.textContent = '!';
  badge.style.position = 'absolute';
  badge.style.top = '-8px';
  badge.style.right = '-8px';
  badge.style.backgroundColor = '#ff4d4d';
  badge.style.color = 'white';
  badge.style.borderRadius = '50%';
  badge.style.width = '20px';
  badge.style.height = '20px';
  badge.style.display = 'flex';
  badge.style.alignItems = 'center';
  badge.style.justifyContent = 'center';
  badge.style.fontSize = '14px';
  badge.style.fontWeight = 'bold';
  badge.style.zIndex = '1001';
  
  // Add tooltip with detailed information
  badge.title = `Flagged content: ${result.categories.join(', ')}\nConfidence: ${Math.round(result.confidence * 100)}%`;
  
  // Insert elements
  wrapper.appendChild(overlay);
  wrapper.appendChild(badge);
  
  // Replace the original element with our wrapper
  const parent = element.parentNode;
  parent.insertBefore(wrapper, element);
  wrapper.appendChild(element);
  
  // Add click handler to show details
  badge.addEventListener('click', (e) => {
    e.stopPropagation();
    showModerationDetails(element, result);
  });
}

// Show detailed moderation information
function showModerationDetails(element, result) {
  const modal = document.createElement('div');
  modal.className = 'ai-moderation-modal';
  modal.style.position = 'fixed';
  modal.style.top = '50%';
  modal.style.left = '50%';
  modal.style.transform = 'translate(-50%, -50%)';
  modal.style.backgroundColor = 'white';
  modal.style.padding = '20px';
  modal.style.borderRadius = '8px';
  modal.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
  modal.style.zIndex = '10000';
  modal.style.maxWidth = '600px';
  modal.style.width = '80%';
  
  // Modal content
  modal.innerHTML = `
    <h3 style="margin-top: 0;">Content Moderation Alert</h3>
    <p><strong>Categories:</strong> ${result.categories.join(', ')}</p>
    <p><strong>Confidence:</strong> ${(result.confidence * 100).toFixed(2)}%</p>
    <p><strong>Flagged content:</strong></p>
    <div style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; max-height: 150px; overflow-y: auto;">
      ${element.textContent}
    </div>
    <div style="margin-top: 15px; display: flex; justify-content: space-between;">
      <button id="ai-mod-disagree" style="padding: 8px 16px; background-color: #f5f5f5; border: none; border-radius: 4px; cursor: pointer;">Disagree with Moderation</button>
      <button id="ai-mod-close" style="padding: 8px 16px; background-color: #4285f4; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
    </div>
  `;
  
  // Add to document
  document.body.appendChild(modal);
  
  // Add backdrop
  const backdrop = document.createElement('div');
  backdrop.style.position = 'fixed';
  backdrop.style.top = '0';
  backdrop.style.left = '0';
  backdrop.style.width = '100%';
  backdrop.style.height = '100%';
  backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  backdrop.style.zIndex = '9999';
  document.body.appendChild(backdrop);
  
  // Handle close button
  const closeButton = modal.querySelector('#ai-mod-close');
  closeButton.addEventListener('click', () => {
    document.body.removeChild(modal);
    document.body.removeChild(backdrop);
  });
  
  // Handle disagree button
  const disagreeButton = modal.querySelector('#ai-mod-disagree');
  disagreeButton.addEventListener('click', () => {
    submitFeedback(element.textContent, result, false);
    document.body.removeChild(modal);
    document.body.removeChild(backdrop);
  });
}

// Submit user feedback about moderation
function submitFeedback(content, result, isAgreement) {
  chrome.runtime.sendMessage({
    type: 'REPORT_CONTENT',
    content,
    metadata: {
      url: window.location.href,
      title: document.title,
      moderationResult: result,
      userFeedback: isAgreement ? 'agree' : 'disagree',
      timestamp: new Date().toISOString()
    }
  }, response => {
    if (response.success) {
      showNotification('Feedback submitted successfully');
    } else {
      showNotification('Failed to submit feedback');
    }
  });
}

// Setup context menu for reporting
function setupContextMenu() {
  document.addEventListener('contextmenu', event => {
    const selection = window.getSelection().toString().trim();
    if (selection.length > 10) {
      // Store selection for context menu handler
      window.aiModLastSelection = selection;
    }
  });
}

// Show notification
function showNotification(message) {
  if (!config.showNotifications) return;
  
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.position = 'fixed';
  notification.style.bottom = '20px';
  notification.style.right = '20px';
  notification.style.backgroundColor = '#333';
  notification.style.color = 'white';
  notification.style.padding = '12px 20px';
  notification.style.borderRadius = '4px';
  notification.style.zIndex = '10000';
  notification.style.opacity = '0';
  notification.style.transition = 'opacity 0.3s ease-in-out';
  
  document.body.appendChild(notification);
  
  // Fade in
  setTimeout(() => {
    notification.style.opacity = '1';
  }, 10);
  
  // Remove after delay
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// Get confidence threshold based on moderation level
function getConfidenceThreshold() {
  switch (config.moderationLevel) {
    case 'high': return 0.9;
    case 'low': return 0.7;
    case 'medium':
    default: return 0.8;
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CONFIG_UPDATED') {
    config = {...config, ...message.config};
    
    // Re-scan if enabled state changed
    if (message.config.enabled !== undefined) {
      if (message.config.enabled) {
        setupObserver();
        scanVisibleContent();
      }
    }
    
    sendResponse({success: true});
  }
});

// Start the extension
initialize();