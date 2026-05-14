const express = require('express');
const cors = require('cors');
const http = require('http');
const rateLimit = require('express-rate-limit');
const { initDb } = require('./database/db');
const wsManager = require('./ws-manager');

const app = express();
const server = http.createServer(app);
wsManager.init(server);

const PORT = process.env.PORT || 3006;
app.set('trust proxy', 1);

const allowedOrigins = [
  'https://bingo.festasjuninasdorio.com',
  'http://localhost:5178',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => (!origin || allowedOrigins.includes(origin)) ? cb(null, true) : cb(new Error('CORS não permitido')),
  credentials: true,
}));
app.use(express.json());

const limiter = rateLimit({ windowMs: 15*60*1000, max: 500, message: { error: 'Muitas requisições.' } });
const authLimiter = rateLimit({ windowMs: 15*60*1000, max: 20, message: { error: 'Muitas tentativas.' } });
app.use('/api', limiter);
app.use('/api/auth/login', authLimiter);

app.use('/api/auth',   require('./routes/auth'));
app.use('/api/rounds', require('./routes/rounds'));
app.use('/api/cards',  require('./routes/cards'));
app.use('/api/draw',   require('./routes/draw'));
app.use('/api/admin',  require('./routes/admin'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'Bingo Juninas do Rio', timestamp: new Date().toISOString() }));
app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada' }));

initDb();
server.listen(PORT, () => console.log(`🎲 Bingo Juninas rodando na porta ${PORT}`));
