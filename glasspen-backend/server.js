const express = require('express');
const fetch = (...args) => import('node-fetch').then(mod => mod.default(...args));
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Use your OpenRouter key here (starts with sk-or-)
const OPENROUTER_API_KEY = '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';

app.post('/summarize', async (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Invalid input text.' });
  }

  console.log('🔹 Request received with text:', text);

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://yourproject.com', // Can be left blank if testing locally
        'X-Title': 'GlassPen AI'
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo', // or 'perplexity/pplx-7b-online'
        messages: [
          { role: 'system', content: 'You are a helpful assistant that summarizes or explains web content.' },
          { role: 'user', content: text }
        ]
      })
    });

    const data = await response.json();
    console.log('🧠 OpenRouter raw response:', JSON.stringify(data, null, 2));

    const reply = data?.choices?.[0]?.message?.content;
    if (!reply) {
      return res.status(500).json({ summary: '❌ No response from OpenRouter.' });
    }

    res.json({ summary: reply });

  } catch (err) {
    console.error('❌ OpenRouter API error:', err);
    res.status(500).json({ error: err.message || 'Internal server error.' });
  }
});

app.listen(3000, () => {
  console.log('🟢 OpenRouter (GPT-3.5) backend running at http://localhost:3000');
});
