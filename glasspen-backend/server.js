const express = require('express');
const fetch = (...args) => import('node-fetch').then(mod => mod.default(...args));
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const OPENROUTER_API_KEY = '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';

// Common AI request handler
const handleAIRequest = async (req, res, instruction) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Invalid input text.' });
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://yourproject.com',
        'X-Title': 'GlassPen AI'
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: [
          { 
            role: 'system', 
            content: instruction 
          },
          { role: 'user', content: text }
        ]
      })
    });

    // Handle non-200 responses from OpenRouter
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    // FIXED: Removed extra dot in optional chaining
    const reply = data?.choices[0]?.message?.content;
    
    if (!reply) {
      throw new Error('No content in OpenRouter response');
    }
    
    res.json({ summary: reply });

  } catch (err) {
    console.error('❌ API error:', err);
    res.status(500).json({ error: err.message || 'Internal server error.' });
  }
};

// Separate endpoints
app.post('/summarize', (req, res) => {
  handleAIRequest(req, res, 'You are a helpful assistant that summarizes web content concisely.');
});

app.post('/explain', (req, res) => {
  handleAIRequest(req, res, 'You are a helpful assistant that explains concepts in an educational manner.');
});

app.listen(3000, () => {
  console.log('🟢 Backend running at http://localhost:3000');
});
