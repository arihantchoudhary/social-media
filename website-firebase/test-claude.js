// test-claude.js
require('dotenv').config();
const axios = require('axios');

async function testClaudeAPI() {
  try {
    console.log("Testing Claude API connection...");
    
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("ERROR: No API key found in environment variables");
      console.log("Create a .env file with ANTHROPIC_API_KEY=your_api_key");
      return false;
    }

    console.log("API Key detected ✓");
    
    // Simple test query
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: "claude-3-haiku-20240307",
        max_tokens: 100,
        messages: [
          {
            role: "user",
            content: "Find semantically related terms to 'space' from this list: astronomy, politics, wellness, planets"
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        }
      }
    );
    
    console.log("✅ API Response received:");
    console.log(response.data.content[0].text);
    console.log("\nAPI integration is working correctly!");
    return true;
  } catch (error) {
    console.error("❌ API Test Failed:", error.message);
    if (error.response) {
      console.error("Error Details:", error.response.data);
    }
    return false;
  }
}

testClaudeAPI();