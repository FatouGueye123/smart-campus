// ============================================================================
// Actions du technicien : association carte <-> étudiant, diagnostic bornes
// ============================================================================
const pool = require('../config/db');

// POST /api/technician/associate-card
// Body : { uid, email }
async function associateCard(req, res) {
  const { uid, email } = req.body;
  if (!uid || !email) {
    return res.status(400).json({ error: 'uid et email sont requis.' });
  }

  try {
    const user = await pool.query('SELECT id, full_name FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      return res.status(404).json({ error: "Aucun étudiant trouvé avec cet email." });
    }

    const card = await pool.query('SELECT id FROM cards WHERE uid = $1', [uid]);
    let result;
    if (card.rows.length === 0) {
      // Nouvelle carte inconnue -> on l'enregistre
      result = await pool.query(
        `INSERT INTO cards (uid, user_id, balance, status)
         VALUES ($1, $2, 0, 'ACTIVE')
         RETURNING id, uid, status`,
        [uid, user.rows[0].id]
      );
    } else {
      result = await pool.query(
        `UPDATE cards SET user_id = $1, status = 'ACTIVE'
         WHERE uid = $2
         RETURNING id, uid, status`,
        [user.rows[0].id, uid]
      );
    }

    res.json({
      message: `Carte ${uid} associée à ${user.rows[0].full_name}.`,
      card: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}

// GET /api/technician/devices
// Diagnostic des bornes ESP32 : statut en ligne + dernière activité
async function getDevicesStatus(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, device_name, location, is_online, last_seen_at
       FROM devices
       ORDER BY device_name`
    );
    res.json({ devices: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}
// POST /api/technician/unblock-card
// Body : { uid }
async function unblockCard(req, res) {
  const { uid } = req.body;
  if (!uid) {
    return res.status(400).json({ error: 'uid est requis.' });
  }
  try {
    const result = await pool.query(
      `UPDATE cards SET status = 'ACTIVE' WHERE uid = $1
       RETURNING id, uid, status`,
      [uid]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Carte introuvable.' });
    }
    res.json({ message: `Carte ${uid} réactivée.`, card: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}
module.exports = { associateCard, getDevicesStatus, unblockCard };