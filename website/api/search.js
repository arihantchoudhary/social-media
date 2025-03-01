const axios = require('axios');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { query, keywords } = req.body;
    
    // Make sure we have an API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(400).json({ 
        error: 'API key not found. Please set ANTHROPIC_API_KEY in environment variables.' 
      });
    }
    
    // Call Anthropic API
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
};