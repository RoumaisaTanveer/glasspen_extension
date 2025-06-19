const fetch = (...args) => import('node-fetch').then(mod => mod.default(...args));

fetch('http://localhost:3000/summarize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'Explain this: The mitochondrion is the powerhouse of the cell.'
  })
})
.then(res => res.json())
.then(data => console.log('✅ Response:', data))
.catch(err => console.error('❌ Error:', err));
