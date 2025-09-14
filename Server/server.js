const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./db');
require('dotenv').config();
const authenticate = require('./authMiddleware');
const app = express();
app.use(cors());
app.use(express.json());


function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

// 📝 Signup Route
app.post('/auth/signup', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, created_at`,
      [username, email, hash]
    );

    const user = result.rows[0];
    const token = generateToken(user);

    res.status(201).json({ user, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📝 Login Route
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT id, username, email, password_hash FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    delete user.password_hash;
    const token = generateToken(user);

    res.json({ user, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/todos', authenticate, async (req, res) => {
  const { title, description } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO todos (user_id, title, description, completed)
       VALUES ($1, $2, $3, false)
       RETURNING *`,
      [req.user.id, title, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/todos/:id', authenticate, async (req, res) => {
  const { title, description, completed } = req.body;
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE todos 
       SET title=$1, description=$2, completed=$3
       WHERE id=$4 AND user_id=$5
       RETURNING *`,
      [title, description, completed, id, req.user.id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Todo not found or unauthorized' });

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log(err);
  }
});

// 🗑️ Delete Todo
app.delete('/todos/:id', authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM todos WHERE id=$1 AND user_id=$2 RETURNING *',
      [id, req.user.id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Todo not found or unauthorized' });

    res.json({ message: 'Todo deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
