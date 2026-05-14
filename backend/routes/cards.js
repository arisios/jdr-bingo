const express = require('express');
const { getDb } = require('../database/db');
const { generateCard, hasBingo } = require('../bingo');
const { broadcast } = require('../ws-manager');
const router = express.Router();

router.post('/join', (req, res) => {
  const { playerName } = req.body;
  if (!playerName?.trim()) return res.status(400).json({ error: 'Informe seu nome' });
  const db = getDb();
  const round = db.prepare("SELECT * FROM rounds WHERE status='active' ORDER BY id DESC LIMIT 1").get();
  if (!round) return res.status(400).json({ error: 'Nenhuma rodada ativa no momento' });
  const grid = generateCard();
  const result = db.prepare('INSERT INTO cards (round_id, player_name, numbers) VALUES (?, ?, ?)').run(round.id, playerName.trim(), JSON.stringify(grid));
  const card = db.prepare('SELECT * FROM cards WHERE id=?').get(result.lastInsertRowid);
  card.numbers = JSON.parse(card.numbers);
  const drawn = db.prepare('SELECT number FROM drawn_numbers WHERE round_id=? ORDER BY drawn_at').all(round.id).map(r => r.number);
  res.status(201).json({ card, round, drawn });
});

router.post('/:id/bingo', (req, res) => {
  const db = getDb();
  const card = db.prepare('SELECT * FROM cards WHERE id=?').get(parseInt(req.params.id));
  if (!card) return res.status(404).json({ error: 'Cartela não encontrada' });
  if (card.has_bingo) return res.status(400).json({ error: 'Bingo já registrado' });
  const drawn = db.prepare('SELECT number FROM drawn_numbers WHERE round_id=?').all(card.round_id).map(r => r.number);
  const grid = JSON.parse(card.numbers);
  const drawnSet = new Set(drawn);
  if (!hasBingo(grid, drawnSet)) return res.status(400).json({ error: 'Ainda não tem bingo válido' });
  db.prepare('UPDATE cards SET has_bingo=1 WHERE id=?').run(card.id);
  broadcast({ type: 'bingo_winner', playerName: card.player_name, cardId: card.id, roundId: card.round_id });
  res.json({ success: true, playerName: card.player_name });
});

module.exports = router;
