require('dotenv').config();

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Comprehensive mapping of emotions to emojis
const emojiToneMap = {
  joy: "😂", excitement: "🤩", sadness: "😭", anger: "😡", fear: "😱", 
  surprise: "😲", trust: "🤝", disgust: "🤢", anticipation: "⏳", 
  serenity: "😌", love: "😍", anxiety: "😰", embarrassment: "😳", 
  confusion: "🤔", relief: "😅", guilt: "😔", pride: "😎", 
  admiration: "👏", boredom: "🥱", nostalgia: "🥹", determination: "💪", 
  curiosity: "🧐", happiness: "😊", sarcasm: "🙃", confidence: "😤",
  tiredness: "😴", awkwardness: "😬", shock: "😧", frustration: "🤬", 
  inspiration: "🌟", gratefulness: "🙏", loneliness: "😢", flirtiness: "😉", 
  hesitation: "😕", euphoria: "🫠", panic: "😵", celebration: "🎉", 
  selflove: "💖", amusement: "🤣", cold: "🥶", wonder: "🤯"
};

const emojiToMemes = {
  "😂": [
    "/laugh.jpeg", // Local fallback image
    "https://i.imgflip.com/30b1gx.jpg", // DiCaprio laughing
    "https://i.pinimg.com/originals/df/11/22/df1122bc16c03e254dfc7960307f46e6.jpg", // Brahmanandam laughing face
    "https://i.imgflip.com/4ptpox.jpg", // Brahmi comedy expression
    "https://pbs.twimg.com/media/E8K_H0LVkAUPehP.jpg" // Jethalal laughing (TMKOC)
  ],
  "😭": [
    "sad.jpeg", // Local fallback image
    "https://i.imgflip.com/1bgxj.jpg", // Crying Jordan
    "https://i.pinimg.com/originals/6e/7a/b5/6e7ab5b8c0f4dc25d0b44c8dad21a0dc.jpg", // Brahmanandam crying
    "https://i.pinimg.com/564x/5a/01/d0/5a01d0079bf61a537fee58089bfc2c89.jpg", // Brahmanandam sad expression
    "https://img.mensxp.com/media/content/2022/Sep/vicky-kaushal-bollywood-actor-crying-memes9_6312fa7c2e131.jpeg" // Vicky Kaushal crying
  ],
  "😡": [
    "angry.jpeg", // Local fallback image
    "https://i.imgflip.com/1bh0.jpg", // Angry Arthur
    "https://i.pinimg.com/736x/22/26/b7/2226b7ea7d0fa66750894715d97a7393.jpg", // Angry Allu Arjun
    "https://i.pinimg.com/originals/7e/a5/28/7ea5286de1ec51dd48e0874c79130c1f.jpg" // Nana Patekar angry
  ],
  "🤔": [
    "thinking.jpeg", // Local fallback image
    "https://i.imgflip.com/1bgw.jpg", // Thinking guy
    "https://i.imgflip.com/1bhf.jpg", // Futurama Fry
    "https://i.pinimg.com/736x/e4/a9/a8/e4a9a8f9d52fe48b90a983c90e21eb41.jpg", // Confused Brahmanandam
    "https://i.pinimg.com/originals/c0/d5/71/c0d571ecda9e360e99115d33c31fa429.jpg" // Jethalal confused
  ],
  "😱": [
    "scared.jpeg", // Local fallback image
    "https://i.imgflip.com/1bgxj.jpg", // Home Alone
    "https://letsplaymes.com/wp-content/uploads/2021/05/Shocked-Brahmanandam-meme-template-768x768.jpg", // Shocked Brahmanandam
    "https://i.pinimg.com/564x/eb/30/07/eb300707f05c9deee97e18e37c916aaa.jpg" // Akshay Kumar shocked
  ],
  "😲": [
    "surprised.jpeg", // Local fallback image
    "https://i.imgflip.com/1bgw.jpg", // Surprised Pikachu
    "https://starsunfolded.com/wp-content/uploads/2021/09/Brahmanandams-surprised-expression.jpg", // Surprised Brahmanandam
    "https://i.pinimg.com/originals/4a/f4/9b/4af49b9f815b10c7ec4d42a52c5a17d4.jpg" // Shocked Indian reaction
  ],
  "😎": [
    "cool.jpeg", // Local fallback image
    "https://i.imgflip.com/26am.jpg", // Deal with it
    "https://i.pinimg.com/736x/4a/7d/12/4a7d1253ace002c5e6236275e2451e4c.jpg", // Cool Brahmanandam
    "https://pbs.twimg.com/media/EU0FgJyUMAAdlDZ.jpg" // Cool Rajinikanth
  ],
  "😅": [
    "awkward.jpeg", // Local fallback image
    "https://i.imgflip.com/1h7in3.jpg", // Awkward smile
    "https://i.pinimg.com/originals/eb/c9/52/ebc952ce141f31a46cb5b3a0c7675fdb.jpg", // Nervous Brahmanandam
    "https://i.pinimg.com/originals/91/2b/12/912b1273099e98f9582544a6e9c669ee.jpg" // Paresh Rawal (Babu Rao) nervous
  ],
  "🤬": [
    "furious.jpeg", // Local fallback image
    "https://i.imgflip.com/1bh0.jpg", // Hulk smash
    "https://i.pinimg.com/736x/92/b2/73/92b273777b87fd93c59bff2bd3f5fb69.jpg", // Furious Brahmanandam
    "https://im.indiatimes.in/content/2023/Jul/amrish-puri_64a6a9d5bac3d.jpg" // Amrish Puri angry
  ],
  "😊": [
    "happy.jpeg", // Local fallback image
    "https://i.imgflip.com/1bgw.jpg", // Wholesome Keanu
    "https://i.pinimg.com/originals/39/7c/e4/397ce47995a17cd83f739f811e4f36b3.jpg", // Happy Brahmanandam
    "https://www.pinkvilla.com/images/2023-07/1689233117_5f85f85bb6e8d68bafa8e5c1ebe16209b744f05ad8f4e.jpg" // SRK happy
  ],
  "default": [
    "default.jpeg", // Local fallback image
    "https://i.imgflip.com/1bgw.jpg", // Default meme
    "https://i.pinimg.com/736x/77/be/88/77be88ab12c7cdcabd3ac7b6c1385093.jpg", // Default Brahmanandam
    "https://i.pinimg.com/736x/df/11/22/df1122bc16c03e254dfc7960307f46e6.jpg" // Default Indian meme
  ]
};
  
// Define mock responses globally so they can be accessed from any scope
const mockResponses = [
  "That's an interesting question! I think the answer depends on several factors, but generally speaking, it's good to consider multiple perspectives.",
  "Based on my understanding, this is a complex topic with no single correct answer. It's worth exploring different viewpoints!",
  "I'd recommend taking a step-by-step approach to solve this problem. First, break it down into smaller parts, then tackle each one systematically.",
  "That's actually quite funny when you think about it! The unexpected juxtaposition creates humor.",
  "I understand this might be challenging. Remember that persistence is key, and it's okay to ask for help when needed.",
  "Wow, that's a fascinating question! The possibilities are endless, and it's exciting to think about the implications.",
  "I'm sorry to hear that. It's natural to feel this way sometimes, and acknowledging your emotions is an important first step.",
  "That's a great observation! You've spotted something many people miss.",
  "I'm afraid I don't have enough information to provide a complete answer, but I'd be happy to help if you can share more details."
];

// Extract emoji from AI response
function extractEmoji(text) {
  const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;
  const matches = text.match(emojiRegex);
  
  if (matches && matches.length > 0) {
    const lastEmoji = matches[matches.length - 1];
    return Object.keys(emojiToMemes).includes(lastEmoji) ? lastEmoji : "default";
  }
  return "default";
}

// Function to analyze text and identify emotional tone
async function analyzeTextTone(text) {
  // Basic keyword-based emotion detection
  const emotionKeywords = {
    "joy": ["happy", "joy", "laugh", "funny", "delighted", "amused", "pleased"],
    "sadness": ["sad", "unhappy", "crying", "depressed", "sorry", "disappointed"],
    "anger": ["angry", "upset", "mad", "furious", "annoyed", "irritated"],
    "fear": ["afraid", "scared", "terrified", "worried", "anxious", "nervous"],
    "surprise": ["surprised", "shocked", "amazed", "astonished", "unexpected"],
    "confusion": ["confused", "puzzled", "unsure", "uncertain", "don't understand"],
    "excitement": ["excited", "thrilled", "enthusiastic", "eager", "looking forward"],
    "determination": ["determined", "resolute", "committed", "focused", "persistent"],
    "relief": ["relief", "phew", "relaxed", "calm", "better now"],
    "gratitude": ["thankful", "grateful", "appreciate", "thanks", "thank you"],
    "curiosity": ["curious", "interested", "wonder", "intriguing", "fascinating"],
    "confidence": ["confident", "sure", "certain", "positive", "without doubt"]
  };

  // Convert text to lowercase for better matching
  const lowercaseText = text.toLowerCase();
  
  // Count emotion keyword matches
  const emotionCounts = {};
  for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
    emotionCounts[emotion] = 0;
    for (const keyword of keywords) {
      if (lowercaseText.includes(keyword)) {
        emotionCounts[emotion]++;
      }
    }
  }
  
  // Find the dominant emotion
  let dominantEmotion = "default";
  let maxCount = 0;
  for (const [emotion, count] of Object.entries(emotionCounts)) {
    if (count > maxCount) {
      maxCount = count;
      dominantEmotion = emotion;
    }
  }
  
  // Map the dominant emotion to an emoji
  return emojiToneMap[dominantEmotion] || "😊";
}

// Function to get response from Google Gemini API
async function getGeminiResponse(message) {
  try {
    // Define the correct API endpoint based on latest Gemini API version
    const apiEndpoint = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent';
    
    // Set up the request body using the correct format for the API
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `Answer the following question in a helpful and detailed way: "${message}"`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 300,
        topP: 0.95,
        topK: 40
      }
    };
    
    console.log(`Sending request to Gemini API with message: "${message}"`);
    
    // Make the API request with the API key from environment variables
    const response = await axios.post(
      `${apiEndpoint}?key=${process.env.GOOGLE_API_KEY}`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Received response from Gemini API');
    
    // Extract the text from the response
    if (response.data.candidates && 
        response.data.candidates.length > 0 && 
        response.data.candidates[0].content && 
        response.data.candidates[0].content.parts &&
        response.data.candidates[0].content.parts.length > 0) {
      // Return the text from the response
      return response.data.candidates[0].content.parts[0].text;
    }
    
    console.error('Unexpected response format from Gemini API:', JSON.stringify(response.data, null, 2));
    throw new Error('Unexpected response format from Gemini API');
  } catch (error) {
    console.error('Gemini API Error:', error.message);
    if (error.response) {
      console.error('API Response Data:', JSON.stringify(error.response.data, null, 2));
      console.error('API Response Status:', error.response.status);
      console.error('API Response Headers:', error.response.headers);
    }
    throw new Error('Failed to get response from Gemini API: ' + (error.response?.data?.error?.message || error.message));
  }
}

// AI Chat endpoint with Google Gemini API
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  
  if (!message || message.trim().length === 0) {
    return res.status(400).json({ error: "Message cannot be empty" });
  }
  
  try {
    let aiReply;
    
    // Check if Google API key is set
    if (process.env.GOOGLE_API_KEY) {
      console.log('Using Google Gemini API for message:', message);
      try {
        aiReply = await getGeminiResponse(message);
        console.log('Got Gemini response:', aiReply.substring(0, 50) + '...');
      } catch (geminiError) {
        console.error("Gemini API error:", geminiError.message);
        // Fall back to mock responses if Gemini API fails
        console.log('Falling back to mock response due to Gemini API error');
        aiReply = mockResponses[Math.floor(Math.random() * mockResponses.length)];
      }
    } else {
      // Use mock responses if no API key is available
      console.log('Using mock response (no Google API key found)');
      aiReply = mockResponses[Math.floor(Math.random() * mockResponses.length)];
    }
    
    // Analyze the emotional tone of the response
    const emoji = await analyzeTextTone(aiReply);
    
    // Get a random meme URL for the detected emotion
    const memeKey = Object.keys(emojiToMemes).includes(emoji) ? emoji : "default";
    const memes = emojiToMemes[memeKey];
    const memeUrl = memes[Math.floor(Math.random() * memes.length)];
    
    // Log the processed chat
    console.log('✅ Chat processed:', { 
      message, 
      aiReply: aiReply.substring(0, 50) + '...', 
      emoji, 
      memeUrl 
    });

    res.json({ 
      answer: aiReply, 
      emoji, 
      meme: memeUrl,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("ChatBot Error:", err.message);
    
    if (err.response && err.response.status === 429) {
      return res.status(429).json({ error: "Rate limit exceeded. Please try again later." });
    } else if (err.response && err.response.data) {
      return res.status(err.response.status).json({ error: err.response.data.error?.message || "AI service error" });
    } else if (err.code === 'ECONNREFUSED') {
      return res.status(503).json({ error: "Service unavailable. Please try again later." });
    } else {
      return res.status(500).json({ error: "Something went wrong: " + err.message });
    }
  }
});

// Get emotion list with emojis and memes
app.get('/api/emotions', (req, res) => {
  const emotions = Object.entries(emojiToneMap).map(([tone, emoji]) => ({
    tone,
    emoji,
    memes: emojiToMemes[emoji] || emojiToMemes["default"]
  }));
  res.json({ emotions });
});

// Get chat history (mock data for now)
app.get("/api/history", (req, res) => {
  // Return empty array instead of database results
  res.json([]);
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", version: "1.0.1" });
});

// Default route
app.get('/', (req, res) => {
  res.send("🌟 StarSolu AI Meme Chat Backend API is running...");
});

// Serve frontend for any other route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(port, async () => {
  console.log(`🚀 StarSolu AI Meme Chat server running on http://localhost:${port}`);
  console.log(`💡 Make sure your frontend is configured to use: http://localhost:${port}/api/chat`);
  
  // Display AI provider configuration status
  if (process.env.GOOGLE_API_KEY) {
    console.log('🔑 Using Google Gemini API for chat responses');
  } else {
    console.log('🔔 No Google API key found - using mock responses for testing');
    console.log('💡 TIP: Add GOOGLE_API_KEY to your .env file to use the Gemini API');
  }
});