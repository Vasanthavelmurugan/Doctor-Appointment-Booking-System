const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { verifyAuth, requireRole } = require('../middleware/auth');

router.get('/', doctorController.getAllDoctors);
router.get('/:id', doctorController.getDoctorById);
router.get('/:id/slots', doctorController.getDoctorSlots);
router.post('/:id/slots', verifyAuth, requireRole(['doctor', 'admin']), doctorController.setDoctorSlots);
router.put('/:id', verifyAuth, requireRole(['doctor', 'admin']), doctorController.updateDoctorProfile);

module.exports = router;
