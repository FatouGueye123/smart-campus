const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {
  getAuditLog,
  manualRecharge,
  updateUserAccess,
  listUsers,
  listCards,
} = require('../controllers/adminController');

router.use(authMiddleware, roleMiddleware('ADMIN'));

router.get('/audit', getAuditLog);
router.post('/recharge', manualRecharge);
router.get('/users', listUsers);
router.post('/users/:id/access', updateUserAccess);
router.get('/cards', listCards);

module.exports = router;