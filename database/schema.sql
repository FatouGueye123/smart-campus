-- ============================================================================
-- SMART CAMPUS — Schéma de base de données PostgreSQL
-- ============================================================================
-- Crée les tables nécessaires au fonctionnement complet du système :
-- utilisateurs (3 rôles), cartes étudiantes, transactions, journal de fraude
-- et bornes ESP32 (pour le diagnostic technicien).
-- ============================================================================

CREATE TYPE user_role AS ENUM ('STUDENT', 'TECHNICIAN', 'ADMIN');
CREATE TYPE card_status AS ENUM ('ACTIVE', 'BLOCKED', 'UNASSIGNED');
CREATE TYPE transaction_status AS ENUM ('OK', 'FRAUDE', 'REFUSE');

-- ---------------------------------------------------------------------------
-- Utilisateurs
-- ---------------------------------------------------------------------------
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    full_name       VARCHAR(120)  NOT NULL,
    email           VARCHAR(160)  NOT NULL UNIQUE,
    password_hash   VARCHAR(255)  NOT NULL,
    role            user_role     NOT NULL DEFAULT 'STUDENT',
    is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Cartes étudiantes (RFID/NFC)
-- ---------------------------------------------------------------------------
CREATE TABLE cards (
    id              SERIAL PRIMARY KEY,
    uid             VARCHAR(32)   NOT NULL UNIQUE,      -- UID physique de la puce RFID
    user_id         INTEGER       REFERENCES users(id) ON DELETE SET NULL,
    balance         NUMERIC(10,2) NOT NULL DEFAULT 0,   -- porte-monnaie électronique (FCFA)
    status          card_status   NOT NULL DEFAULT 'UNASSIGNED',
    issued_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    last_scanned_at TIMESTAMPTZ
);

CREATE INDEX idx_cards_user_id ON cards(user_id);

-- ---------------------------------------------------------------------------
-- Bornes / lecteurs ESP32 (pour le diagnostic technicien)
-- ---------------------------------------------------------------------------
CREATE TABLE devices (
    id              SERIAL PRIMARY KEY,
    device_name     VARCHAR(80)   NOT NULL,
    location        VARCHAR(120)  NOT NULL,
    api_key         VARCHAR(64)   NOT NULL UNIQUE,
    is_online       BOOLEAN       NOT NULL DEFAULT FALSE,
    last_seen_at    TIMESTAMPTZ
);

-- ---------------------------------------------------------------------------
-- Transactions (paiements, accès)
-- ---------------------------------------------------------------------------
CREATE TABLE transactions (
    id              SERIAL PRIMARY KEY,
    card_id         INTEGER       NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    device_id       INTEGER       REFERENCES devices(id) ON DELETE SET NULL,
    service         VARCHAR(40)   NOT NULL,             -- restaurant | bibliotheque | transport | photocopie
    amount          NUMERIC(10,2) NOT NULL DEFAULT 0,
    balance_after   NUMERIC(10,2) NOT NULL,
    status          transaction_status NOT NULL,
    risk_score      NUMERIC(4,3)  NOT NULL DEFAULT 0,   -- score [0-1] calculé par le module IA
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_card_id ON transactions(card_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- ---------------------------------------------------------------------------
-- Journal de fraude (détails des anomalies détectées par l'IA)
-- ---------------------------------------------------------------------------
CREATE TABLE fraud_logs (
    id              SERIAL PRIMARY KEY,
    transaction_id  INTEGER       NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    reason          VARCHAR(160)  NOT NULL,
    reviewed        BOOLEAN       NOT NULL DEFAULT FALSE,
    reviewed_by     INTEGER       REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fraud_logs_reviewed ON fraud_logs(reviewed);
