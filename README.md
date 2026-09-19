<<<<<<< HEAD
# 🏥 CarePulse - Doctor Appointment Booking System

A clean, responsive, and role-based Doctor Appointment Booking System built with **React**, **Node.js (Express)**, and **MySQL** (with dual-engine local fallback for zero-friction evaluation).

---

## 🌟 Key Features

### 1. 👤 Patient Portal
- **Registration & Profiles:** Register with full name, age, gender, contact number, email, address, and medical background/allergies.
- **Doctor Discovery:** Filter specialists by department (*Cardiology, Dermatology, Pediatrics, Orthopedics, Neurology, General Medicine*) or search by physician name.
- **Interactive Slot Booking:** View dynamic 30-minute time slots for any chosen date. Prevents double-booking with real-time slot availability checks.
- **Appointment Cancellation:** Cancel upcoming consultations with a reason; automatically notifies the doctor and clinic.
- **Appointment History:** View past visits, doctor notes, prescriptions, and status badges (`Scheduled`, `Completed`, `Cancelled`).
- **Reminders & Alerts:** In-app notification center alerts patients of bookings and upcoming consultations within 24–48 hours.

### 2. 🩺 Doctor Portal
- **Clinical Queue:** Real-time dashboard showing today's and upcoming patient appointments with age, gender, contact info, and symptoms.
- **Consultation Management:** Mark consultations as `Completed` and record clinical notes, diagnostic remarks, or prescriptions.
- **Schedule & Availability Controls:** Custom weekly working hours (e.g. Monday 09:00–13:00, Wednesday 14:00–18:00) with custom slot durations.
- **Doctor Cancellations:** Cancel appointments in case of medical emergencies with recorded notification to patients.

### 3. 🛡️ Administrator Dashboard
- **Real-Time KPIs:** Total Appointments, Active Scheduled, Completed Visits, Cancellations, Total Patients, and Practicing Doctors.
- **Master Appointment Management:** View, search, filter, update, or cancel any appointment across the entire hospital.
- **Doctor Roster & Onboarding:** Add new physicians with their specialization, consultation rates, credentials, and weekly slots.
- **Patient Directory:** Complete database of registered patients with contact details, addresses, and visit counts.

### 4. ⚡ Quick Demo Switcher
- One-click role buttons in the top navigation bar allow instant switching between **Admin**, **Doctors**, and **Patients** without needing to retype passwords.

---

## 🛠️ Technical Stack

- **Frontend:** React 18, Vite, Lucide Icons, Plus Jakarta Sans typography, custom responsive CSS design system.
- **Backend:** Node.js, Express, JWT Authentication, bcryptjs password hashing.
- **Database:** MySQL (relational schema with foreign keys, indexes, and cascades) + automatic local SQLite dual-adapter for out-of-the-box evaluation.

---

## 🚀 Quick Start (Turnkey)

Node.js (v20+) has been configured on the system.

### Option A: Run Full Application (Port 5000)
From the project root (`doctor-appointment-system`):
```bash
npm start
```
Open **[http://localhost:5000](http://localhost:5000)** in your browser.
This serves both the **REST API** (`/api/*`) and the built **React Frontend** in a single process.

### Option B: Run in Full Development Mode (Vite Hot Reload)
In Terminal 1 (Backend):
```bash
cd backend
npm run dev
```
In Terminal 2 (Frontend with Vite HMR):
```bash
cd frontend
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser. Requests to `/api` are automatically proxied to port 5000.

---

## 🗄️ MySQL Database Setup (Optional)

The application is natively designed for **MySQL** using `mysql2/promise`. If MySQL is not running, it automatically and seamlessly falls back to local SQLite so you can test immediately.

To connect your own MySQL server:

1. Open your MySQL client (MySQL Workbench, phpMyAdmin, or MySQL CLI) and run:
   ```sql
   CREATE DATABASE IF NOT EXISTS doctor_appointment_db;
   ```
2. Import the schema and seed data:
   ```bash
   mysql -u root -p doctor_appointment_db < backend/database/schema.sql
   mysql -u root -p doctor_appointment_db < backend/database/seed.sql
   ```
3. Update `backend/.env`:
   ```env
   PORT=5000
   DB_TYPE=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=doctor_appointment_db
   JWT_SECRET=super-secret-doctor-appointment-key-2026
   ```
4. Start the backend: `npm start`.

---

## 🔑 Demo Accounts & Pre-Configured Credentials

You can use the **DEMO QUICK-LOGIN** bar at the top of the web UI or log in manually with any of these pre-seeded accounts:

| Role | Name | Email | Password | Details |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Hospital Admin | `admin@hospital.com` | `admin123` | Full dashboard access, doctor onboarding & appointment oversight |
| **Doctor** | Dr. Sarah Jenkins | `dr.jenkins@hospital.com` | `doctor123` | Cardiology Specialist ($120/visit, 12 yrs exp) |
| **Doctor** | Dr. Michael Chen | `dr.chen@hospital.com` | `doctor123` | Dermatology Specialist ($95/visit, 8 yrs exp) |
| **Doctor** | Dr. Emily Taylor | `dr.taylor@hospital.com` | `doctor123` | Pediatrics Specialist ($85/visit, 10 yrs exp) |
| **Doctor** | Dr. Robert Williams | `dr.williams@hospital.com` | `doctor123` | Orthopedics Specialist ($140/visit, 15 yrs exp) |
| **Patient**| Alice Johnson | `alice@example.com` | `patient123` | Female, 29 yrs, upcoming appointment scheduled |
| **Patient**| David Miller | `david@example.com` | `patient123` | Male, 46 yrs, completed visit history |

---

## 📡 REST API Reference

### Authentication
- `POST /api/auth/register` — Register a new patient account
- `POST /api/auth/login` — Authenticate user (returns JWT token and profile)
- `GET  /api/auth/profile` — Fetch currently authenticated user profile
- `GET  /api/auth/demo-accounts` — List pre-seeded demo user logins

### Doctors
- `GET  /api/doctors` — List all doctors (supports `?specialization=` and `?search=`)
- `GET  /api/doctors/:id` — Get doctor details and active slots
- `GET  /api/doctors/:id/slots` — Get weekly available slot definitions
- `POST /api/doctors/:id/slots` — Set doctor availability slots *(Doctor or Admin)*
- `PUT  /api/doctors/:id` — Update doctor profile *(Doctor or Admin)*

### Patients
- `GET  /api/patients` — List registered patients *(Doctor or Admin)*
- `GET  /api/patients/:id` — Get patient profile and appointment history
- `PUT  /api/patients/:id` — Update patient profile

### Appointments
- `GET  /api/appointments/slots?doctor_id=&date=` — Calculate open/booked 30-min time slots
- `GET  /api/appointments` — Fetch appointments (scoped by role: patient, doctor, admin)
- `POST /api/appointments/book` — Book appointment (with collision & double-booking checks)
- `PUT  /api/appointments/:id/cancel` — Cancel appointment with recorded reason
- `PUT  /api/appointments/:id/status` — Mark completed & add clinical notes *(Doctor or Admin)*

### Notifications & Reminders
- `GET  /api/notifications` — Fetch in-app notifications and reminder alerts
- `PUT  /api/notifications/:id/read` — Mark notification(s) as read
- `POST /api/notifications/check-reminders` — Trigger upcoming 24-48h appointment reminder scan

### Admin
- `GET    /api/admin/stats` — Real-time metrics (appointments by status, total counts)
- `POST   /api/admin/doctors` — Onboard new doctor
- `DELETE /api/admin/doctors/:id` — Remove doctor from roster

---

## 🧪 Automated Testing

An automated integration test suite is included that tests all 11 core functionalities end-to-end:
```bash
npm test
```
Tests verified:
1. System Health Check (`/api/health`)
2. Administrator Authentication & JWT validation
3. Patient Authentication & profile scoping
4. Doctor listing and specialization filters
5. Patient registration with input validation
6. Available time slot computation
7. Appointment booking with notification generation
8. Double-booking collision prevention (returns HTTP 409 Conflict)
9. In-app reminder notification creation
10. Appointment cancellation with status update
11. Admin dashboard metrics computation
=======
# Doctor-Appointment-Booking-System
>>>>>>> 044c07356c307ded197ac0a815b85d46f07cad02
