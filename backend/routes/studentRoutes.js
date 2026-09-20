const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { getCard, getHistory, blockCard } = require('../controllers/studentController');

router.use(authMiddleware, roleMiddleware('STUDENT'));

router.get('/card', getCard);
router.get('/history', getHistory);
router.post('/block', blockCard);

module.exports = router;
