// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'toggle') {
    // Handle toggle action if needed
    sendResponse({ success: true });
  }
  return true;
}); 