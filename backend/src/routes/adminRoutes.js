const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyAuth, requireRole } = require('../middleware/auth');

// All admin routes require 'admin' role
router.use(verifyAuth, requireRole(['admin']));

router.get('/stats', adminController.getDashboardStats);
router.post('/doctors', adminController.createDoctor);
router.delete('/doctors/:id', adminController.deleteDoctor);

module.exports = router;
