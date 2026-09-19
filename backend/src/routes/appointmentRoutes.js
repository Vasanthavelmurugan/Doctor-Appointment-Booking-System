const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { verifyAuth } = require('../middleware/auth');

router.get('/slots', appointmentController.getAvailableSlots);
router.get('/', verifyAuth, appointmentController.getAllAppointments);
router.post('/book', verifyAuth, appointmentController.bookAppointment);
router.put('/:id/cancel', verifyAuth, appointmentController.cancelAppointment);
router.put('/:id/status', verifyAuth, appointmentController.updateAppointmentStatus);

module.exports = router;
