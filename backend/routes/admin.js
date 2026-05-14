const express = require('express');
const { getDb } = require('../database/db');
const { adminMiddleware } = require('../middleware/auth');
const { getCount } = require('../ws-manager');
const router = express.Router();

router.get('/stats', adminMiddleware, (req, res) => {
  const db = getDb();

  // Rodada ativa
  const round = db.prepare("SELECT * FROM rounds WHERE status='active' ORDER BY id DESC LIMIT 1").get();
  const drawn = round
    ? db.prepare('SELECT number FROM drawn_numbers WHERE round_id=? ORDER BY drawn_at DESC').all(round.id).map(r => r.number)
    : [];
  const drawnSet = new Set(drawn);

  // Cartelas da rodada ativa com contagem de marcados
  const cards = round
    ? db.prepare('SELECT id, player_name, has_bingo, numbers FROM cards WHERE round_id=? ORDER BY created_at').all(round.id).map(c => {
        const grid = JSON.parse(c.numbers);
        const total = grid.flat().filter(n => n !== 0).length; // 24 números
        const marked = grid.flat().filter(n => n !== 0 && drawnSet.has(n)).length;
        return { id: c.id, player_name: c.player_name, has_bingo: c.has_bingo, marked, total };
      })
    : [];

  // Todas as rodadas com detalhes completos
  const allRounds = db.prepare('SELECT * FROM rounds ORDER BY created_at DESC').all().map(r => {
    const rCards = db.prepare('SELECT player_name, has_bingo FROM cards WHERE round_id=?').all(r.id);
    const rDrawn = db.prepare('SELECT number FROM drawn_numbers WHERE round_id=? ORDER BY drawn_at DESC').all(r.id).map(x => x.number);
    return {
      ...r,
      playerCount: rCards.length,
      drawnCount:  rDrawn.length,
      players:     rCards,
      winners:     rCards.filter(c => c.has_bingo).map(c => c.player_name),
      lastNumbers: rDrawn.slice(0, 10),
    };
  });

  const totalRounds = allRounds.length;
  const totalCards  = db.prepare('SELECT COUNT(*) as c FROM cards').get().c;
  const totalBingos = db.prepare('SELECT COUNT(*) as c FROM cards WHERE has_bingo=1').get().c;

  res.json({ round, cards, drawn, online: getCount(), allRounds, stats: { totalRounds, totalCards, totalBingos } });
});

module.exports = router;
