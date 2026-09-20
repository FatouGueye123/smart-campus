// ============================================================================
// Réception des évènements envoyés par les bornes ESP32 (Wokwi ou réel).
// Authentification simple par clé d'appareil (header x-device-key), car un
// microcontrôleur ne gère pas de session JWT comme un utilisateur.
//
// Le module IA anti-fraude est ici simplifié à une heuristique de vélocité
// de scan (cf. hardware/sketch.ino) : en production, ce serait un appel à un
// service de scoring entraîné (Isolation Forest / Random Forest) sur
// l'historique complet des transactions.
// ============================================================================
const pool = require('../config/db');

const PRICES = { restaurant: 1500, bibliotheque: 0, transport: 500, photocopie: 100 };
const REPLAY_WINDOW_MS = 4000; // 2 scans de la même carte en moins de 4s = suspect

// POST /api/hardware/scan
// Body : { uid, service, timestamp }
// Header : x-device-key
async function receiveScan(req, res) {
  const deviceKey = req.headers['x-device-key'];
  const { uid, service, timestamp } = req.body;

  if (!uid || !service) {
    return res.status(400).json({ error: 'uid et service sont requis.' });
  }

  try {
    // 1. Authentifier la borne
    const device = await pool.query('SELECT id FROM devices WHERE api_key = $1', [deviceKey]);
    if (device.rows.length === 0) {
      return res.status(401).json({ error: 'Clé de borne invalide.' });
    }
    const deviceId = device.rows[0].id;
    await pool.query(
      'UPDATE devices SET is_online = TRUE, last_seen_at = NOW() WHERE id = $1',
      [deviceId]
    );

    // 2. Retrouver la carte
    const cardResult = await pool.query('SELECT * FROM cards WHERE uid = $1', [uid]);
    if (cardResult.rows.length === 0) {
      return res.status(404).json({ status: 'REFUSE', message: 'Carte inconnue.' });
    }
    const card = cardResult.rows[0];

    if (card.status === 'BLOCKED') {
      await logTransaction(card.id, deviceId, service, 0, card.balance, 'REFUSE', 0);
      return res.json({ status: 'REFUSE', message: 'Carte bloquée.', balance: card.balance });
    }

    // 3. Score de risque (heuristique de vélocité)
    const lastScan = card.last_scanned_at ? new Date(card.last_scanned_at).getTime() : 0;
    const now = timestamp ? Number(timestamp) : Date.now();
    let riskScore = 0.05 + Math.random() * 0.1;
    if (lastScan && now - lastScan < REPLAY_WINDOW_MS) {
      riskScore = 0.75 + Math.random() * 0.2;
    }
    const suspect = riskScore >= 0.7;

    await pool.query('UPDATE cards SET last_scanned_at = NOW() WHERE id = $1', [card.id]);

    // 4. Décision + transaction
    const price = PRICES[service] ?? 0;
    let status, balanceAfter;

    if (suspect) {
      status = 'FRAUDE';
      balanceAfter = card.balance;
    } else if (price > card.balance) {
      status = 'REFUSE';
      balanceAfter = card.balance;
    } else {
      status = 'OK';
      balanceAfter = Number(card.balance) - price;
      await pool.query('UPDATE cards SET balance = $1 WHERE id = $2', [balanceAfter, card.id]);
    }

    const txId = await logTransaction(card.id, deviceId, service, status === 'OK' ? price : 0, balanceAfter, status, riskScore);

    if (status === 'FRAUDE') {
      await pool.query(
        `INSERT INTO fraud_logs (transaction_id, reason) VALUES ($1, $2)`,
        [txId, 'Scans rapprochés détectés (pattern de type rejeu / clonage)']
      );
    }

    res.json({
      status,
      message: statusMessage(status),
      balance: balanceAfter,
      riskScore: Number(riskScore.toFixed(2)),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}

async function logTransaction(cardId, deviceId, service, amount, balanceAfter, status, riskScore) {
  const result = await pool.query(
    `INSERT INTO transactions (card_id, device_id, service, amount, balance_after, status, risk_score)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [cardId, deviceId, service, amount, balanceAfter, status, riskScore]
  );
  return result.rows[0].id;
}

function statusMessage(status) {
  return { OK: 'Accès autorisé.', FRAUDE: 'Anomalie détectée.', REFUSE: 'Accès refusé.' }[status];
}

module.exports = { receiveScan };
