const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { findUserByLogin, createUser } = require('../../../../shared/users-db');
const { JWT_SECRET } = require('../middleware/auth');
const router = express.Router();

function makeToken(user) {
  return jwt.sign(
    { id: user.id, instagram: user.instagram, name: user.name, role: user.role },
    JWT_SECRET, { expiresIn: '7d' }
  );
}

router.post('/login', (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) return res.status(400).json({ error: 'Preencha todos os campos' });
  const user = findUserByLogin(identifier);
  if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Credenciais incorretas' });
  res.json({ token: makeToken(user), user: { id: user.id, instagram: user.instagram, name: user.name, role: user.role } });
});

router.post('/register', (req, res) => {
  const { name, phone, instagram, password } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Informe seu nome' });
  if (!phone?.trim() && !instagram?.trim()) return res.status(400).json({ error: 'Informe @instagram ou telefone' });
  if (!password || password.length < 6) return res.status(400).json({ error: 'Senha deve ter mínimo 6 caracteres' });
  try {
    const user = createUser({ name: name.trim(), phone: phone?.trim() || null, instagram: instagram?.trim() || null, password });
    res.status(201).json({ token: makeToken(user), user: { id: user.id, instagram: user.instagram, name: user.name, role: user.role } });
  } catch (err) {
    if (err.message?.includes('UNIQUE')) return res.status(400).json({ error: 'Instagram ou telefone já cadastrado' });
    res.status(500).json({ error: 'Erro ao criar conta' });
  }
});

module.exports = router;
