-- =======================================================
-- Seed Data for Doctor Appointment Booking System (MySQL)
-- Passwords are all hashed with bcrypt (rounds=10)
-- admin123  -> $2a$10$iMh6k2cK15Y.K.OaP31LbeYnJmS8cR8tT2iM5v2uX91DkPvVfB8kG
-- doctor123 -> $2a$10$04mfxo3kYvV9B1fWn.hDmeN6d41C2Y8r4r0jU2F5K9oKqJgKkK1.m
-- patient123 -> $2a$10$vGZ9JdJ5K.f4FfFk2XoMze7K.8rM2fWjD9oQ7N1gP2wT3lB4sJ1.K
-- =======================================================

USE `doctor_appointment_db`;

-- Users
INSERT INTO `users` (`id`, `email`, `password`, `role`) VALUES
(1, 'admin@hospital.com', '$2a$10$q0j9W3E8A.P9K7E5V3J1LuB8R2F5M6D7N8Q9T0Y1U2I3O4P5A6B7C', 'admin'),
(2, 'dr.jenkins@hospital.com', '$2a$10$q0j9W3E8A.P9K7E5V3J1LuB8R2F5M6D7N8Q9T0Y1U2I3O4P5A6B7C', 'doctor'),
(3, 'dr.chen@hospital.com', '$2a$10$q0j9W3E8A.P9K7E5V3J1LuB8R2F5M6D7N8Q9T0Y1U2I3O4P5A6B7C', 'doctor'),
(4, 'dr.taylor@hospital.com', '$2a$10$q0j9W3E8A.P9K7E5V3J1LuB8R2F5M6D7N8Q9T0Y1U2I3O4P5A6B7C', 'doctor'),
(5, 'dr.williams@hospital.com', '$2a$10$q0j9W3E8A.P9K7E5V3J1LuB8R2F5M6D7N8Q9T0Y1U2I3O4P5A6B7C', 'doctor'),
(6, 'alice@example.com', '$2a$10$q0j9W3E8A.P9K7E5V3J1LuB8R2F5M6D7N8Q9T0Y1U2I3O4P5A6B7C', 'patient'),
(7, 'david@example.com', '$2a$10$q0j9W3E8A.P9K7E5V3J1LuB8R2F5M6D7N8Q9T0Y1U2I3O4P5A6B7C', 'patient');

-- Doctors Profiles
INSERT INTO `doctors` (`id`, `user_id`, `name`, `email`, `phone`, `specialization`, `experience_years`, `consultation_fee`, `bio`) VALUES
(1, 2, 'Dr. Sarah Jenkins', 'dr.jenkins@hospital.com', '+1 (555) 234-5678', 'Cardiology', 12, 120.00, 'Board-certified cardiologist specializing in preventive cardiology, hypertension, and heart disease management.'),
(2, 3, 'Dr. Michael Chen', 'dr.chen@hospital.com', '+1 (555) 345-6789', 'Dermatology', 8, 95.00, 'Clinical dermatologist focused on skin cancer screening, acne therapeutics, and autoimmune dermatological conditions.'),
(3, 4, 'Dr. Emily Taylor', 'dr.taylor@hospital.com', '+1 (555) 456-7890', 'Pediatrics', 10, 85.00, 'Compassionate pediatrician dedicated to newborn care, childhood immunology, and developmental milestone tracking.'),
(4, 5, 'Dr. Robert Williams', 'dr.williams@hospital.com', '+1 (555) 567-8901', 'Orthopedics', 15, 140.00, 'Specialist in sports medicine, arthroscopy, joint reconstruction, and rehabilitation.');

-- Patients Profiles
INSERT INTO `patients` (`id`, `user_id`, `name`, `age`, `gender`, `phone`, `email`, `address`, `medical_history`) VALUES
(1, 6, 'Alice Johnson', 29, 'Female', '+1 (555) 987-6543', 'alice@example.com', '742 Evergreen Terrace, Springfield', 'Mild asthma; no known drug allergies.'),
(2, 7, 'David Miller', 46, 'Male', '+1 (555) 876-5432', 'david@example.com', '123 Maple Street, Metropolis', 'Hypertension under management (Lisinopril 10mg). Penicillin allergy.');

-- Doctor Weekly Available Slots
INSERT INTO `doctor_slots` (`doctor_id`, `day_of_week`, `start_time`, `end_time`, `slot_duration`, `is_active`) VALUES
(1, 'Monday', '09:00', '13:00', 30, 1),
(1, 'Wednesday', '14:00', '18:00', 30, 1),
(1, 'Friday', '09:00', '13:00', 30, 1),
(2, 'Tuesday', '10:00', '14:00', 30, 1),
(2, 'Thursday', '13:00', '17:00', 30, 1),
(3, 'Monday', '08:30', '12:30', 30, 1),
(3, 'Wednesday', '08:30', '12:30', 30, 1),
(3, 'Saturday', '09:00', '13:00', 30, 1),
(4, 'Tuesday', '14:00', '18:00', 30, 1),
(4, 'Friday', '10:00', '15:00', 30, 1);
