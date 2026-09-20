// ============================================================================
// Pool de connexion PostgreSQL (pg)
// ============================================================================
const { Pool } = require('pg');
require('dotenv').config();

// Si DATABASE_URL est fourni (ex: Neon, Render, Railway), on l'utilise
// directement avec SSL activé. Sinon, on retombe sur les variables séparées
// (utile pour le développement local avec PostgreSQL installé sur la machine).
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
    })
  : new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'smart_campus',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      max: 10,
      idleTimeoutMillis: 30000,
    });

pool.on('error', (err) => {
  console.error('Erreur inattendue du pool PostgreSQL :', err);
});

module.exports = pool;