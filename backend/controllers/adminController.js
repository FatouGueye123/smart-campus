// ============================================================================
// Actions de l'administrateur : audit, recharge manuelle, gestion des accès
// ============================================================================
const pool = require('../config/db');

// GET /api/admin/audit
// Retourne les transactions récentes + les anomalies non traitées
async function getAuditLog(req, res) {
  try {
    const transactions = await pool.query(
      `SELECT t.id, c.uid, u.full_name AS student, t.service, t.amount,
              t.status, t.risk_score, t.created_at
       FROM transactions t
       JOIN cards c ON c.id = t.card_id
       LEFT JOIN users u ON u.id = c.user_id
       ORDER BY t.created_at DESC
       LIMIT 100`
    );

    const fraud = await pool.query(
      `SELECT f.id, f.reason, f.reviewed, t.id AS transaction_id, c.uid,
              u.full_name AS student, t.created_at
       FROM fraud_logs f
       JOIN transactions t ON t.id = f.transaction_id
       JOIN cards c ON c.id = t.card_id
       LEFT JOIN users u ON u.id = c.user_id
       WHERE f.reviewed = FALSE
       ORDER BY f.created_at DESC`
    );

    res.json({ transactions: transactions.rows, pendingFraudAlerts: fraud.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}

// POST /api/admin/recharge
// Body : { uid, amount }
async function manualRecharge(req, res) {
  const { uid, amount } = req.body;
  if (!uid || !amount || amount <= 0) {
    return res.status(400).json({ error: 'uid et amount (positif) sont requis.' });
  }

  try {
    const result = await pool.query(
      `UPDATE cards SET balance = balance + $1
       WHERE uid = $2
       RETURNING id, uid, balance`,
      [amount, uid]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Carte introuvable.' });
    }
    res.json({ message: `Recharge de ${amount} FCFA effectuée.`, card: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}

// POST /api/admin/users/:id/access
// Body : { isActive: boolean } -> active ou désactive un compte
async function updateUserAccess(req, res) {
  const { id } = req.params;
  const { isActive } = req.body;

  try {
    const result = await pool.query(
      `UPDATE users SET is_active = $1 WHERE id = $2
       RETURNING id, full_name, email, role, is_active`,
      [isActive, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }
    res.json({ message: 'Accès mis à jour.', user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}

// GET /api/admin/users
async function listUsers(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, full_name, email, role, is_active, created_at
       FROM users ORDER BY created_at DESC`
    );
    res.json({ users: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}

module.exports = { getAuditLog, manualRecharge, updateUserAccess, listUsers };
