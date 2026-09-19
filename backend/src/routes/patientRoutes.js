const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { verifyAuth, requireRole } = require('../middleware/auth');

router.get('/', verifyAuth, requireRole(['doctor', 'admin']), patientController.getAllPatients);
router.get('/:id', verifyAuth, patientController.getPatientById);
router.put('/:id', verifyAuth, patientController.updatePatientProfile);

module.exports = router;
