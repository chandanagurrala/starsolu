// DOM Elements
const chatContainer = document.getElementById("chat-container");
const chatMessages = document.getElementById("chat-messages");
const welcomeScreen = document.getElementById("welcome-screen");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const typingIndicator = document.getElementById("typing-indicator");
const chatHistory = document.getElementById("chat-history");
const newChatBtn = document.getElementById("new-chat-btn");
const themeToggleIcon = document.getElementById("theme-toggle-icon");
const themeToggle = document.querySelector(".theme-toggle");

// API endpoint - You can switch between local and remote endpoints
// Use "/api/chat" for local development or proxy setup
// Use the full URL for direct remote access
const API_URL = "/api/chat"; // Using relative path for better compatibility
const HISTORY_API_URL = "/api/history";

// State management
let currentChatId = null;
let isProcessing = false;
let darkMode = localStorage.getItem("darkMode") === "true";

// Default meme images for fallback by emotion
const fallbackMemes = {
  "😂": "laugh.jpeg",
  "😭": "sad.jpeg",
  "😡": "angry.jpeg",
  "🤔": "thinking.jpeg",
  "😱": "scared.jpeg",
  "😲": "surprised.jpeg",
  "😎": "cool.jpeg",
  "😅": "awkward.jpeg",
  "🤬": "furious.jpeg",
  "😊": "happy.jpeg",
  "default": "default.jpeg"
};

// Apply dark mode if enabled
if (darkMode) {
  document.body.classList.add("dark-theme");
  themeToggleIcon.classList.remove("fa-moon");
  themeToggleIcon.classList.add("fa-sun");
}

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
  // Auto-resize textarea
  userInput.addEventListener("input", autoResizeTextarea);
  
  // Enable/disable send button based on input
  userInput.addEventListener("input", () => {
    sendButton.disabled = userInput.value.trim().length === 0;
  });
  
  // Send message on Enter key (except with Shift key)
  userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && !sendButton.disabled) {
      e.preventDefault();
      sendMessage();
    }
  });
  
  // Send button click handler
  sendButton.addEventListener("click", sendMessage);
  
  // Theme toggle handler
  themeToggle.addEventListener("click", toggleTheme);
  
  // New chat button handler
  newChatBtn.addEventListener("click", startNewChat);
  
  // Load chat history
  loadChatHistory();

  // Create images folder structure if not exists
  checkImageFolderStructure();
});

// Function to check if the image folder structure exists
function checkImageFolderStructure() {
  const testImage = new Image();
  testImage.onload = () => console.log("Image folder structure exists");
  testImage.onerror = () => console.warn("Please create the image folder structure for local memes");
  testImage.src = fallbackMemes.default;
}

// Handle image errors - try alternative images when one fails
function handleImageError(img, emoji) {
  console.log(`Image load failed: ${img.src}`);
  
  // Extract current URL path to check which image is failing
  const currentPath = img.src.split('/').pop();
  
  // If there's a data-alt-urls attribute, try the next URL in it
  if (img.dataset.altUrls) {
    const altUrls = JSON.parse(img.dataset.altUrls);
    const currentIndex = altUrls.findIndex(url => url.includes(currentPath));
    
    if (currentIndex >= 0 && currentIndex < altUrls.length - 1) {
      // Try next image in the array
      console.log(`Trying next image: ${altUrls[currentIndex + 1]}`);
      img.src = altUrls[currentIndex + 1];
      return;
    }
  }
  
  // If we've exhausted all alternatives or there are none, use the emoji-based fallback
  const detectedEmoji = emoji || "default";
  const fallbackUrl = fallbackMemes[detectedEmoji] || fallbackMemes.default;
  
  console.log(`Using fallback meme for ${detectedEmoji}: ${fallbackUrl}`);
  img.src = fallbackUrl;
  img.alt = "Meme";
  
  // If even the fallback fails, show a generic error
  img.onerror = function() {
    this.onerror = null;
    this.src = 'placeholder-meme.png';
    this.alt = 'Meme not available';
  };
}

function autoResizeTextarea() {
  // Reset height to auto to get the correct scrollHeight
  userInput.style.height = "auto";
  
  // Set the height to the scrollHeight (content height)
  userInput.style.height = (userInput.scrollHeight) + "px";
  
  // Cap the height at a maximum value
  if (userInput.scrollHeight > 150) {
    userInput.style.height = "150px";
    userInput.style.overflowY = "auto";
  } else {
    userInput.style.overflowY = "hidden";
  }
}

function toggleTheme() {
  darkMode = !darkMode;
  document.body.classList.toggle("dark-theme");
  
  if (darkMode) {
    themeToggleIcon.classList.remove("fa-moon");
    themeToggleIcon.classList.add("fa-sun");
  } else {
    themeToggleIcon.classList.remove("fa-sun");
    themeToggleIcon.classList.add("fa-moon");
  }
  
  localStorage.setItem("darkMode", darkMode);
}

async function sendMessage() {
  if (isProcessing) return;
  
  const message = userInput.value.trim();
  if (!message) return;
  
  // Hide welcome screen if visible
  if (!welcomeScreen.classList.contains("hidden")) {
    welcomeScreen.classList.add("hidden");
  }
  
  // Add user message to UI
  addMessageToUI("user", message);
  
  // Clear input and reset height
  userInput.value = "";
  userInput.style.height = "auto";
  sendButton.disabled = true;
  
  // Show typing indicator
  isProcessing = true;
  showTypingIndicator();
  
  try {
    console.log("Sending request to:", API_URL);
    
    // Send message to API with proper credentials and CORS settings
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        // Add these headers if needed for CORS
        "Accept": "application/json"
      },
      body: JSON.stringify({ message: message }),
      // Include credentials if needed (for cookies, etc.)
      credentials: "include",
      // For CORS preflight requests
      mode: "cors"
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Server response:", response.status, errorText);
      throw new Error(`Server error: ${response.status} - ${errorText || "No error details"}`);
    }
    
    const data = await response.json();
    console.log("Received data:", data);
    
    // Extract values from response
    const responseText = data.answer || "No answer available";
    const emoji = data.emoji || "";
    const memeUrl = data.meme || "";
    const allMemes = data.allMemes || [memeUrl]; // Get all possible meme URLs if available
    const timestamp = new Date().toISOString();
    
    // Add bot message to UI with proper values
    addMessageToUI("bot", `${responseText}`, emoji, memeUrl, allMemes, timestamp);
    
    // Update chat history if this is a new chat
    if (!currentChatId) {
      loadChatHistory();
      // Generate a random ID for this chat session
      currentChatId = Date.now().toString();
    }
    
  } catch (error) {
    console.error("Error sending message:", error);
    
    // More detailed error message based on the type of error
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      addErrorMessage("Failed to connect to the server. Please check your network connection or try again later.");
    } else {
      addErrorMessage(error.message || "Something went wrong. Please try again.");
    }
  } finally {
    // Hide typing indicator
    hideTypingIndicator();
    isProcessing = false;
    
    // Scroll to bottom of chat
    scrollToBottom();
  }
}

function addMessageToUI(type, content, emoji = '', memeUrl = null, allMemes = [], timestamp = null) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `chat-message ${type}-message`;
  
  const formattedTime = timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  // For bot messages, include the emoji separately for better control
  const displayContent = type === "bot" ? `${content} ${emoji}` : content;
  
  let messageBubbleContent = `
    <div class="message-bubble">
      ${displayContent}
    </div>
    <div class="message-timestamp">${formattedTime}</div>
  `;
  
  // Add meme image for bot messages
  if (type === "bot" && memeUrl && memeUrl.trim() !== "") {
    // Store all alternative URLs as a data attribute for fallback
    const altUrlsAttr = allMemes.length > 0 ? 
      `data-alt-urls='${JSON.stringify(allMemes)}'` : '';
    
    // Extract the emoji for fallback selection
    const extractedEmoji = emoji || "default";
    
    messageBubbleContent += `
      <div class="meme-container">
        <img 
          src="${memeUrl}" 
          alt="Response Meme" 
          loading="lazy" 
          ${altUrlsAttr}
          data-emoji="${extractedEmoji}"
          onerror="handleImageError(this, '${extractedEmoji}')" 
        />
      </div>
    `;
  }
  
  messageDiv.innerHTML = messageBubbleContent;
  chatMessages.appendChild(messageDiv);
  
  scrollToBottom();
}

function addErrorMessage(errorText) {
  const messageDiv = document.createElement("div");
  messageDiv.className = "chat-message bot-message";
  
  messageDiv.innerHTML = `
    <div class="message-bubble error-message">
      <i class="fas fa-exclamation-circle"></i> ${errorText}
    </div>
    <div class="message-timestamp">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
  `;
  
  chatMessages.appendChild(messageDiv);
}

function showTypingIndicator() {
  typingIndicator.classList.remove("hidden");
  typingIndicator.classList.add("visible");
  scrollToBottom();
}

function hideTypingIndicator() {
  typingIndicator.classList.remove("visible");
  typingIndicator.classList.add("hidden");
}

function scrollToBottom() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function loadChatHistory() {
  try {
    const response = await fetch(HISTORY_API_URL);
    if (!response.ok) throw new Error("Failed to load chat history");
    
    const history = await response.json();
    
    // Clear current history
    chatHistory.innerHTML = "";
    
    if (history.length === 0) {
      chatHistory.innerHTML = "<p class='no-history'>No previous chats</p>";
      return;
    }
    
    // Group by conversation (using timestamps as approximation)
    const conversations = groupConversations(history);
    
    // Add each conversation to the sidebar
    conversations.forEach((conversation, index) => {
      const firstMessage = conversation[0];
      const truncatedMessage = firstMessage.message.length > 25 
        ? firstMessage.message.substring(0, 25) + "..."
        : firstMessage.message;
      
      const historyItem = document.createElement("div");
      historyItem.className = "chat-history-item";
      historyItem.dataset.chatId = index;
      historyItem.innerHTML = `
        <i class="fas fa-comment"></i> ${truncatedMessage}
      `;
      
      historyItem.addEventListener("click", () => loadConversation(conversation));
      
      chatHistory.appendChild(historyItem);
    });
    
  } catch (error) {
    console.error("Error loading chat history:", error);
    chatHistory.innerHTML = "<p class='no-history'>Failed to load history</p>";
  }
}

function groupConversations(messages) {
  // Simple grouping by time gaps (5 minutes)
  const conversations = [];
  let currentConversation = [];
  
  messages.forEach((message, index) => {
    if (index === 0) {
      currentConversation.push(message);
    } else {
      const currentTime = new Date(message.timestamp).getTime();
      const prevTime = new Date(messages[index - 1].timestamp).getTime();
      
      // If the gap is more than 5 minutes, start a new conversation
      if (currentTime - prevTime > 5 * 60 * 1000) {
        conversations.push(currentConversation);
        currentConversation = [message];
      } else {
        currentConversation.push(message);
      }
    }
  });
  
  if (currentConversation.length > 0) {
    conversations.push(currentConversation);
  }
  
  return conversations;
}

function loadConversation(conversation) {
  // Clear current chat
  chatMessages.innerHTML = "";
  welcomeScreen.classList.add("hidden");
  
  // Add messages to UI
  conversation.forEach(message => {
    // User message
    addMessageToUI("user", message.message);
    
    // Bot response with emoji and meme
    const responseText = message.ai_reply || "No answer available";
    const emoji = message.emoji || "";
    const memeUrl = message.meme_url || "";
    const allMemes = message.all_memes || [memeUrl];
    
    addMessageToUI("bot", responseText, emoji, memeUrl, allMemes, message.timestamp);
  });
  
  scrollToBottom();
}

function startNewChat() {
  // Clear messages and show welcome screen
  chatMessages.innerHTML = "";
  welcomeScreen.classList.remove("hidden");
  
  // Reset current chat ID
  currentChatId = null;
  
  // Focus input field
  userInput.focus();
}

function useExample(exampleText) {
  userInput.value = exampleText;
  userInput.focus();
  sendButton.disabled = false;
  autoResizeTextarea();
}