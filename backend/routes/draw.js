const express = require('express');
const { getDb } = require('../database/db');
const { drawRandom, getColumn, TOTAL_NUMBERS } = require('../bingo');
const { adminMiddleware } = require('../middleware/auth');
const { broadcast } = require('../ws-manager');
const router = express.Router();

router.post('/', adminMiddleware, (req, res) => {
  const { mode = 'auto', number } = req.body;
  const db = getDb();
  const round = db.prepare("SELECT * FROM rounds WHERE status='active' ORDER BY id DESC LIMIT 1").get();
  if (!round) return res.status(400).json({ error: 'Nenhuma rodada ativa' });

  const drawn = db.prepare('SELECT number FROM drawn_numbers WHERE round_id=?').all(round.id).map(r => r.number);
  const drawnSet = new Set(drawn);

  let num;
  if (mode === 'manual') {
    num = parseInt(number);
    if (!num || num < 1 || num > TOTAL_NUMBERS) return res.status(400).json({ error: `Número deve ser entre 1 e ${TOTAL_NUMBERS}` });
    if (drawnSet.has(num)) return res.status(400).json({ error: 'Número já sorteado' });
  } else {
    num = drawRandom(drawnSet);
    if (!num) return res.status(400).json({ error: 'Todos os números já foram sorteados' });
  }

  db.prepare('INSERT INTO drawn_numbers (round_id, number) VALUES (?, ?)').run(round.id, num);
  const allDrawn = [...drawn, num];
  const column = getColumn(num);

  broadcast({ type: 'number_drawn', number: num, column, drawn: allDrawn, total: TOTAL_NUMBERS });
  res.json({ number: num, column, drawn: allDrawn });
});

router.get('/drawn', (req, res) => {
  const db = getDb();
  const round = db.prepare("SELECT * FROM rounds WHERE status='active' ORDER BY id DESC LIMIT 1").get();
  if (!round) return res.json({ drawn: [], round: null });
  const drawn = db.prepare('SELECT number, drawn_at FROM drawn_numbers WHERE round_id=? ORDER BY drawn_at').all(round.id);
  res.json({ drawn: drawn.map(d => d.number), round });
});

module.exports = router;
