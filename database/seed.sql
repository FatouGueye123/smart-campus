-- ============================================================================
-- SMART CAMPUS — Jeux de données de démonstration
-- ============================================================================
-- Mots de passe en clair (pour la démo uniquement) -> voir README
--   admin@campus.edu       : Admin#2026
--   tech@campus.edu        : Tech#2026
--   awa.diop@campus.edu    : Student#2026
--
-- Les hachages ci-dessous sont générés avec bcrypt (10 rounds).
-- Pour régénérer : node backend/scripts/hash.js "MotDePasse"
-- ============================================================================

INSERT INTO users (full_name, email, password_hash, role) VALUES
('Admin Système',   'admin@campus.edu',    '$2b$10$GA7mUa.c0IdP9Dh1VPhrOuLiBJHYmSVIpb8zK3ri24mfc4rJq1Iuy', 'ADMIN'),
('Technicien Réseau','tech@campus.edu',    '$2b$10$AGn1QT1jvaOch0aYXq6va.2.OW8G2DNSS3hcNZRL8g37JGYsZ8G9O', 'TECHNICIAN'),
('Awa Diop',        'awa.diop@campus.edu', '$2b$10$nwBfHIVyM/gfAPfiX0iMju/OBMg9ipRcvN6cI49oW6PUC522TELDW', 'STUDENT'),
('Moussa Fall',     'moussa.fall@campus.edu','$2b$10$nwBfHIVyM/gfAPfiX0iMju/OBMg9ipRcvN6cI49oW6PUC522TELDW', 'STUDENT');

-- Cartes RFID associées (les UID correspondent à celles simulées sur Wokwi)
INSERT INTO cards (uid, user_id, balance, status) VALUES
('A1B2C3D4', (SELECT id FROM users WHERE email = 'awa.diop@campus.edu'),    10000, 'ACTIVE'),
('11223344', (SELECT id FROM users WHERE email = 'moussa.fall@campus.edu'),  5500, 'ACTIVE'),
('DEADBEEF', NULL, 0, 'UNASSIGNED');

-- Borne de démonstration (celle simulée sur Wokwi)
INSERT INTO devices (device_name, location, api_key, is_online) VALUES
('Borne-Wokwi-01', 'Restaurant universitaire', 'demo-device-key-please-change', TRUE);
