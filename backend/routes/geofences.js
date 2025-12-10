const express = require('express');
const pool = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Create a new geofence
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, description, center_latitude, center_longitude, radius_meters } = req.body;

    if (!name || !center_latitude || !center_longitude || !radius_meters) {
      return res.status(400).json({
        error: 'Name, center coordinates, and radius are required'
      });
    }

    // Validate coordinates
    if (center_latitude < -90 || center_latitude > 90 ||
      center_longitude < -180 || center_longitude > 180) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    if (radius_meters <= 0) {
      return res.status(400).json({ error: 'Radius must be positive' });
    }

    const [result] = await pool.execute(
      `INSERT INTO geofences (name, description, center_latitude, center_longitude, radius_meters, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [name, description || null, center_latitude, center_longitude, radius_meters, req.user.id]
    );

    const [geofences] = await pool.execute(
      'SELECT * FROM geofences WHERE id = $1',
      [result[0].id]
    );

    res.status(201).json({
      message: 'Geofence created successfully',
      geofence: geofences[0]
    });
  } catch (error) {
    console.error('Create geofence error:', error);
    res.status(500).json({ error: 'Failed to create geofence' });
  }
});

// Get all geofences
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [geofences] = await pool.execute(
      `SELECT g.*, u.username as created_by_username 
       FROM geofences g
       LEFT JOIN users u ON g.created_by = u.id
       WHERE g.is_active = TRUE
       ORDER BY g.created_at DESC`
    );

    res.json({ geofences });
  } catch (error) {
    console.error('Get geofences error:', error);
    res.status(500).json({ error: 'Failed to get geofences' });
  }
});

// Get a specific geofence
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [geofences] = await pool.execute(
      `SELECT g.*, u.username as created_by_username 
       FROM geofences g
       LEFT JOIN users u ON g.created_by = u.id
       WHERE g.id = $1`,
      [id]
    );

    if (geofences.length === 0) {
      return res.status(404).json({ error: 'Geofence not found' });
    }

    res.json({ geofence: geofences[0] });
  } catch (error) {
    console.error('Get geofence error:', error);
    res.status(500).json({ error: 'Failed to get geofence' });
  }
});

// Update a geofence
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, center_latitude, center_longitude, radius_meters, is_active } = req.body;

    // Check if geofence exists
    const [existing] = await pool.execute('SELECT id FROM geofences WHERE id = $1', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Geofence not found' });
    }

    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push(`name = $${params.length + 1}`);
      params.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${params.length + 1}`);
      params.push(description);
    }
    if (center_latitude !== undefined && center_longitude !== undefined) {
      if (center_latitude < -90 || center_latitude > 90 ||
        center_longitude < -180 || center_longitude > 180) {
        return res.status(400).json({ error: 'Invalid coordinates' });
      }
      updates.push(`center_latitude = $${params.length + 1}`, `center_longitude = $${params.length + 2}`);
      params.push(center_latitude, center_longitude);
    }
    if (radius_meters !== undefined) {
      if (radius_meters <= 0) {
        return res.status(400).json({ error: 'Radius must be positive' });
      }
      updates.push(`radius_meters = $${params.length + 1}`);
      params.push(radius_meters);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${params.length + 1}`);
      params.push(is_active);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);

    await pool.execute(
      `UPDATE geofences SET ${updates.join(', ')} WHERE id = $${params.length}`,
      params
    );

    const [geofences] = await pool.execute('SELECT * FROM geofences WHERE id = $1', [id]);

    res.json({
      message: 'Geofence updated successfully',
      geofence: geofences[0]
    });
  } catch (error) {
    console.error('Update geofence error:', error);
    res.status(500).json({ error: 'Failed to update geofence' });
  }
});

// Delete a geofence
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute('DELETE FROM geofences WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Geofence not found' });
    }

    res.json({ message: 'Geofence deleted successfully' });
  } catch (error) {
    console.error('Delete geofence error:', error);
    res.status(500).json({ error: 'Failed to delete geofence' });
  }
});

// Assign user to geofence
router.post('/:id/users/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id, userId } = req.params;
    const { alert_on_entry = true, alert_on_exit = true } = req.body;

    // Check if geofence and user exist
    const [geofences] = await pool.execute('SELECT id FROM geofences WHERE id = $1', [id]);
    const [users] = await pool.execute('SELECT id FROM users WHERE id = $1', [userId]);

    if (geofences.length === 0) {
      return res.status(404).json({ error: 'Geofence not found' });
    }
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    await pool.execute(
      `INSERT INTO user_geofences (user_id, geofence_id, alert_on_entry, alert_on_exit) 
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, geofence_id) DO UPDATE 
       SET alert_on_entry = EXCLUDED.alert_on_entry, alert_on_exit = EXCLUDED.alert_on_exit`,
      [userId, id, alert_on_entry, alert_on_exit]
    );

    res.json({ message: 'User assigned to geofence successfully' });
  } catch (error) {
    console.error('Assign user error:', error);
    res.status(500).json({ error: 'Failed to assign user to geofence' });
  }
});

// Remove user from geofence
router.delete('/:id/users/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id, userId } = req.params;

    const [result] = await pool.execute(
      'DELETE FROM user_geofences WHERE geofence_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    res.json({ message: 'User removed from geofence successfully' });
  } catch (error) {
    console.error('Remove user error:', error);
    res.status(500).json({ error: 'Failed to remove user from geofence' });
  }
});

// Get users assigned to a geofence
router.get('/:id/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if geofence exists
    const [geofences] = await pool.execute('SELECT id FROM geofences WHERE id = ?', [id]);
    if (geofences.length === 0) {
      return res.status(404).json({ error: 'Geofence not found' });
    }

    const [users] = await pool.execute(
      `SELECT ug.user_id, ug.alert_on_entry, ug.alert_on_exit, ug.created_at,
              u.username, u.full_name, u.email
       FROM user_geofences ug
       INNER JOIN users u ON ug.user_id = u.id
       WHERE ug.geofence_id = $1
       ORDER BY u.username`,
      [id]
    );

    res.json({ users });
  } catch (error) {
    console.error('Get geofence users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

module.exports = router;

