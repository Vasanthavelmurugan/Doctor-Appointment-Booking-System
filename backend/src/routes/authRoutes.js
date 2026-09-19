const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyAuth } = require('../middleware/auth');

router.post('/register', authController.registerPatient);
router.post('/login', authController.login);
router.get('/profile', verifyAuth, authController.getProfile);
router.get('/demo-accounts', authController.getDemoAccounts);

module.exports = router;
