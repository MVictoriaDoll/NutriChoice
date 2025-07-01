import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config(); // o con path si está fuera del `server`


const API_KEY = process.env.GOOGLE_API_KEY;

if (!API_KEY) {
  console.error('❌ GOOGLE_API_KEY is missing from environment variables');
  process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

const body = {
  contents: [{
    parts: [{
      text: "Say hello in Spanish."
    }]
  }]
};

fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
})
  .then(res => res.json())
  .then(json => {
    console.log('✅ Google AI Response:', JSON.stringify(json, null, 2));
  })
  .catch(err => {
    console.error('❌ Error using Google API:', err);
  });
