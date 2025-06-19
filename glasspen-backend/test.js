const fetch = (...args) => import('node-fetch').then(mod => mod.default(...args));

// Test summary
fetch('http://localhost:3000/summarize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: 'The mitochondrion is the powerhouse of the cell.' })
})
.then(res => res.json())
.then(data => console.log('✅ Summary Response:', data))
.catch(err => console.error('❌ Summary Error:', err));

// Test explanation
fetch('http://localhost:3000/explain', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: 'The mitochondrion is the powerhouse of the cell.' })
})
.then(res => res.json())
.then(data => console.log('✅ Explanation Response:', data))
.catch(err => console.error('❌ Explanation Error:', err));
