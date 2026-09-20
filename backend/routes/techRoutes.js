const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { associateCard, getDevicesStatus, unblockCard } = require('../controllers/techController');


router.use(authMiddleware, roleMiddleware('TECHNICIAN', 'ADMIN'));

router.post('/associate-card', associateCard);
router.get('/devices', getDevicesStatus);
router.post('/unblock-card', unblockCard);
module.exports = router;
