const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, '.')));
app.use(express.json());

// Endpoint to call Anthropic API for semantic search
app.post('/api/search', async (req, res) => {
  try {
    const { query, keywords } = req.body;
    
    // Make sure we have an API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(400).json({ 
        error: 'API key not found. Please set ANTHROPIC_API_KEY in .env file.' 
      });
    }
    
    console.log('Searching for related terms to:', query);
    console.log('Available keywords:', keywords);
    
    // Call Anthropic API with improved prompt
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: "claude-3-haiku-20240307",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: `You are a semantic search assistant helping to find related keywords.

I'm searching for: "${query}"

Here are the available keywords in my database:
${keywords.join(', ')}

Please identify keywords from the list that are semantically related to my search query "${query}". Think broadly about the relationship - include direct synonyms, broader/narrower terms, and conceptually related ideas.

For example:
- If I search "space" you might return ["astronomy", "planets", "stars", "NASA"]
- If I search "cooking" you might return ["food", "recipes", "kitchen", "chef"]

Only return keywords that exist in the provided list. Format your response as a JSON array like ["keyword1", "keyword2"]. Include only the array, no explanations.`
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
    
    // Extract the generated content from the response
    const content = response.data.content[0].text;
    console.log('Claude response:', content);
    
    // Parse the JSON array from the response
    let relatedKeywords;
    try {
      relatedKeywords = JSON.parse(content);
    } catch (e) {
      // If direct parsing fails, try to extract the JSON array from the text
      const match = content.match(/\[.*\]/s);
      if (match) {
        relatedKeywords = JSON.parse(match[0]);
      } else {
        throw new Error("Could not parse response from Claude");
      }
    }
    
    res.json({ relatedKeywords });
  } catch (error) {
    console.error('Error calling Anthropic API:', error.message);
    res.status(500).json({ error: 'Failed to process semantic search', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});