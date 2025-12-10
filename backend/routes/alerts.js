const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get alerts for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { is_read, limit = 50 } = req.query;
    let query = `SELECT a.*, g.name as geofence_name, u.username, u.full_name
                 FROM alerts a
                 LEFT JOIN geofences g ON a.geofence_id = g.id
                 LEFT JOIN users u ON a.user_id = u.id
                 WHERE a.user_id = $1`;
    const params = [req.user.id];

    if (is_read !== undefined) {
      query += ` AND a.is_read = $${params.length + 1}`;
      params.push(is_read === 'true');
    }

    query += ` ORDER BY a.created_at DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));

    const [alerts] = await pool.execute(query, params);

    res.json({ alerts });
  } catch (error) {
    console.error('Get alerts error:', error);
    // Return empty array instead of error if table doesn't exist or other DB issues
    if (error.code === 'ER_NO_SUCH_TABLE' || error.code === 'ER_BAD_FIELD_ERROR' || error.code === '42P01') { // 42P01 is Postgres undefined_table
      return res.json({ alerts: [] });
    }
    res.status(500).json({ error: 'Failed to get alerts', details: error.message });
  }
});

// Get all alerts (admin only)
router.get('/all', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { is_read, limit = 100 } = req.query;
    let query = `SELECT a.*, g.name as geofence_name, u.username, u.full_name
                 FROM alerts a
                 LEFT JOIN geofences g ON a.geofence_id = g.id
                 LEFT JOIN users u ON a.user_id = u.id
                 WHERE 1=1`;
    const params = [];

    if (is_read !== undefined) {
      query += ` AND a.is_read = $${params.length + 1}`;
      params.push(is_read === 'true');
    }

    query += ` ORDER BY a.created_at DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));

    const [alerts] = await pool.execute(query, params);

    res.json({ alerts });
  } catch (error) {
    console.error('Get all alerts error:', error);
    res.status(500).json({ error: 'Failed to get alerts' });
  }
});

// Mark alert as read
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if alert belongs to user (or user is admin)
    const [alerts] = await pool.execute(
      'SELECT user_id FROM alerts WHERE id = $1',
      [id]
    );

    if (alerts.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    if (alerts[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    await pool.execute(
      'UPDATE alerts SET is_read = TRUE WHERE id = $1',
      [id]
    );

    res.json({ message: 'Alert marked as read' });
  } catch (error) {
    console.error('Mark alert read error:', error);
    res.status(500).json({ error: 'Failed to mark alert as read' });
  }
});

// Delete alert
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if alert belongs to user (or user is admin)
    const [alerts] = await pool.execute(
      'SELECT user_id FROM alerts WHERE id = $1',
      [id]
    );

    if (alerts.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    if (alerts[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    await pool.execute('DELETE FROM alerts WHERE id = $1', [id]);

    res.json({ message: 'Alert deleted successfully' });
  } catch (error) {
    console.error('Delete alert error:', error);
    res.status(500).json({ error: 'Failed to delete alert' });
  }
});

module.exports = router;
