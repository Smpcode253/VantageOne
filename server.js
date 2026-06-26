require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
app.use(bodyParser.json());
app.use(express.static(__dirname));

const state = { niches: {}, apiKeys: {} };

async function llm(prompt) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return `Mock autonomous output for ${prompt.slice(0, 50)}...`;
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST', headers: {'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({model: 'llama-3.3-70b-versatile', messages: [{role: 'user', content: prompt}], temperature: 0.2})
  });
  return (await r.json()).choices?.[0]?.message?.content || 'LLM error';
}

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.post('/api/keys', (req, res) => { state.apiKeys = req.body; res.json({status: 'keys stored'}); });

app.post('/api/auto', async (req, res) => {
  const niche = (await llm('Best high-ROI affiliate niche right now')).trim();
  const products = [
    {platform: 'ClickBank', name: 'AI Side Hustle Kit', commission: 47, url: 'https://aff.link/kit'},
    {platform: 'JVZoo', name: 'Warrior Funnel', commission: 67, url: 'https://jvzoo.link/yyy'}
  ];
  const selected = products[0];
  const landing = await llm(`Tailwind HTML landing for ${selected.name} in ${niche}`);
  const funnel = await llm(`Create 3-step funnel for ${selected.name}`);
  const trafficContent = await llm(`Generate ready-to-post organic content for Facebook, YouTube, TikTok promoting ${selected.name}`);
  const results = {conv: 0.034, roi: 2.1};
  const lesson = await llm(`Lesson from this run: ${JSON.stringify(results)}`);
  if (!state.niches[niche]) state.niches[niche] = {runs: [], knowledge: []};
  state.niches[niche].runs.push({niche, selected, landing, funnel, traffic: {organic: trafficContent}, results, lesson});
  state.niches[niche].knowledge.push(lesson);
  res.json({niche, selected, landing, funnel, trafficContent, results, lesson});
});

app.get('/api/dashboard', (req, res) => res.json(state));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`App running on ${PORT}`));