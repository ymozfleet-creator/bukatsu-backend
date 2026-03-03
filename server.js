const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const sgMail = require('@sendgrid/mail');

const app = express();
const PORT = process.env.PORT || 3001;

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@mycoach-myteam.com';
const FROM_NAME = process.env.FROM_NAME || '部勝（ブカツ）';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://myteam-mycoach.web.app,http://localhost:5000').split(',');

app.use(express.json({ limit: '1mb' }));
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) { callback(null, true); }
    else { callback(new Error('CORS not allowed')); }
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

if (SENDGRID_API_KEY) { sgMail.setApiKey(SENDGRID_API_KEY); }

app.post('/api/ai/chat', async (req, res) => {
  if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  try {
    const { messages, system, max_tokens } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) return res.status(400).json({ error: 'messages is required' });
    const body = { model: 'claude-sonnet-4-20250514', max_tokens: Math.min(max_tokens || 1000, 4096), messages: messages.slice(-20) };
    if (system) body.system = system.slice(0, 2000);
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'AI API error' });
    const text = (data.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n');
    res.json({ text, usage: data.usage });
  } catch (err) { console.error('[AI Proxy] Error:', err.message); res.status(500).json({ error: 'AI proxy internal error' }); }
});

app.post('/api/email/send', async (req, res) => {
  if (!SENDGRID_API_KEY) return res.status(500).json({ error: 'SENDGRID_API_KEY not configured' });
  try {
    const { to, toName, subject, body } = req.body;
    if (!to || !subject || !body) return res.status(400).json({ error: 'to, subject, body are required' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return res.status(400).json({ error: 'Invalid email address' });
    const msg = {
      to: toName ? { email: to, name: toName } : to,
      from: { email: FROM_EMAIL, name: FROM_NAME },
      subject: subject.slice(0, 200),
      html: `<div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px"><div style="text-align:center;padding:20px 0;border-bottom:2px solid #0ea5e9"><h1 style="font-size:20px;color:#1e3256;margin:0">部勝（ブカツ）</h1></div><div style="padding:30px 0;font-size:15px;line-height:1.8;color:#333">${toName ? '<p>' + toName + ' 様</p>' : ''}${body.replace(/\n/g, '<br>')}</div><div style="border-top:1px solid #e5e7eb;padding:20px 0;font-size:12px;color:#9ca3af;text-align:center"><p>このメールは部勝（ブカツ）から自動送信されています。</p></div></div>`,
    };
    await sgMail.send(msg);
    res.json({ success: true, to, subject });
  } catch (err) { console.error('[Email] Error:', err.message); res.status(500).json({ error: 'Email send failed' }); }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', services: { ai: !!ANTHROPIC_API_KEY, email: !!SENDGRID_API_KEY }, uptime: process.uptime() });
});

app.use((req, res) => { res.status(404).json({ error: 'Not found' }); });

app.listen(PORT, () => {
  console.log(`[部勝 Backend] Running on port ${PORT}`);
  console.log(`  AI: ${ANTHROPIC_API_KEY ? '✅' : '❌'}  Email: ${SENDGRID_API_KEY ? '✅' : '❌'}`);
});
