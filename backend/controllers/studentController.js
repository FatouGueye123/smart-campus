// ============================================================================
// Actions disponibles pour un étudiant connecté : solde, historique, blocage
// ============================================================================
const pool = require('../config/db');

// GET /api/student/card
async function getCard(req, res) {
  try {
    const result = await pool.query(
      'SELECT id, uid, balance, status, last_scanned_at FROM cards WHERE user_id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Aucune carte associée à ce compte." });
    }
    res.json({ card: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}

// GET /api/student/history
async function getHistory(req, res) {
  try {
    const card = await pool.query('SELECT id FROM cards WHERE user_id = $1', [req.user.id]);
    if (card.rows.length === 0) {
      return res.status(404).json({ error: "Aucune carte associée à ce compte." });
    }
    const cardId = card.rows[0].id;

    const history = await pool.query(
      `SELECT service, amount, balance_after, status, risk_score, created_at
       FROM transactions
       WHERE card_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [cardId]
    );
    res.json({ history: history.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}

// POST /api/student/block
// Permet à l'étudiant de bloquer sa carte immédiatement (perte, vol, doute).
async function blockCard(req, res) {
  try {
    const result = await pool.query(
      `UPDATE cards SET status = 'BLOCKED'
       WHERE user_id = $1
       RETURNING id, uid, status`,
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Aucune carte associée à ce compte." });
    }
    res.json({ message: 'Carte bloquée avec succès.', card: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}

module.exports = { getCard, getHistory, blockCard };
