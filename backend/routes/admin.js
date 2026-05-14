const express = require('express');
const { getDb } = require('../database/db');
const { adminMiddleware } = require('../middleware/auth');
const { getCount } = require('../ws-manager');
const router = express.Router();

router.get('/stats', adminMiddleware, (req, res) => {
  const db = getDb();
  const round = db.prepare("SELECT * FROM rounds WHERE status='active' ORDER BY id DESC LIMIT 1").get();
  const totalRounds = db.prepare('SELECT COUNT(*) as c FROM rounds').get().c;
  const totalCards = db.prepare('SELECT COUNT(*) as c FROM cards').get().c;
  const totalBingos = db.prepare('SELECT COUNT(*) as c FROM cards WHERE has_bingo=1').get().c;
  const cards = round ? db.prepare('SELECT id, player_name, has_bingo FROM cards WHERE round_id=? ORDER BY created_at').all(round.id) : [];
  const drawn = round ? db.prepare('SELECT number FROM drawn_numbers WHERE round_id=? ORDER BY drawn_at DESC').all(round.id).map(r => r.number) : [];
  res.json({ round, cards, drawn, online: getCount(), stats: { totalRounds, totalCards, totalBingos } });
});

module.exports = router;
