const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db/pool');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await pool.query(
      'SELECT * FROM operators WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const operator = result.rows[0];
    const validPassword = await bcrypt.compare(password, operator.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: operator.id, email: operator.email, role: operator.role },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '24h' }
    );
    
    res.json({ 
      token,
      operator: {
        id: operator.id,
        email: operator.email,
        name: operator.name,
        role: operator.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;