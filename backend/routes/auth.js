const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { findUserByLogin } = require('../../../../shared/users-db');
const { JWT_SECRET } = require('../middleware/auth');
const router = express.Router();
router.post('/login', (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) return res.status(400).json({ error: 'Preencha todos os campos' });
  const user = findUserByLogin(identifier);
  if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Credenciais incorretas' });
  const token = jwt.sign({ id: user.id, instagram: user.instagram, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, instagram: user.instagram, name: user.name, role: user.role } });
});
module.exports = router;
