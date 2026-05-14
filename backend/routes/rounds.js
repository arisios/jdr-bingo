const express = require('express');
const { getDb } = require('../database/db');
const { adminMiddleware } = require('../middleware/auth');
const { broadcast, getCount } = require('../ws-manager');
const router = express.Router();

router.get('/active', (req, res) => {
  const db = getDb();
  const round = db.prepare("SELECT * FROM rounds WHERE status='active' ORDER BY id DESC LIMIT 1").get();
  if (!round) return res.json({ round: null });
  const drawn = db.prepare('SELECT number FROM drawn_numbers WHERE round_id=? ORDER BY drawn_at').all(round.id).map(r => r.number);
  const cardCount = db.prepare('SELECT COUNT(*) as c FROM cards WHERE round_id=?').get(round.id).c;
  res.json({ round, drawn, cardCount, online: getCount() });
});

router.get('/', adminMiddleware, (req, res) => {
  res.json({ rounds: getDb().prepare('SELECT * FROM rounds ORDER BY created_at DESC').all() });
});

router.post('/', adminMiddleware, (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Nome da rodada é obrigatório' });
  const db = getDb();
  const active = db.prepare("SELECT id FROM rounds WHERE status='active'").get();
  if (active) return res.status(400).json({ error: 'Já existe uma rodada ativa. Encerre-a primeiro.' });
  const result = db.prepare("INSERT INTO rounds (name, status) VALUES (?, 'active')").run(name.trim());
  const round = db.prepare('SELECT * FROM rounds WHERE id=?').get(result.lastInsertRowid);
  broadcast({ type: 'round_started', round });
  res.status(201).json({ round });
});

router.patch('/:id/finish', adminMiddleware, (req, res) => {
  const db = getDb();
  const round = db.prepare('SELECT * FROM rounds WHERE id=?').get(parseInt(req.params.id));
  if (!round) return res.status(404).json({ error: 'Rodada não encontrada' });
  db.prepare("UPDATE rounds SET status='finished', finished_at=CURRENT_TIMESTAMP WHERE id=?").run(round.id);
  broadcast({ type: 'round_finished', roundId: round.id });
  res.json({ success: true });
});

module.exports = router;
