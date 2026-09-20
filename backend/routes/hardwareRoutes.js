const express = require('express');
const router = express.Router();
const { receiveScan } = require('../controllers/hardwareController');

// Pas de JWT ici : authentification par clé de borne (x-device-key),
// vérifiée directement dans le contrôleur.
router.post('/scan', receiveScan);

module.exports = router;
