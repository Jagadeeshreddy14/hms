# 🏢 Smart Hostel / PG Management Platform

A production-quality full-stack web application for managing hostels and PG accommodations.
Built with **React + Tailwind CSS** (frontend) and **Node.js + Express + MongoDB** (backend).

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+  
- MongoDB (local or Atlas)
- npm or yarn

---

### Step 1: Clone and Setup

```bash
git clone <your-repo>
cd hostel-platform
```

---

### Step 2: Setup Backend

```bash
cd backend
npm install
```

Edit `.env` with your MongoDB URI:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hostel_platform
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=7d
NODE_ENV=development
```

**Seed the database** with sample data:
```bash
npm run seed
```

This creates:
- 2 hostel blocks (Boys & Girls)
- 18 rooms
- 5 users (admin, warden, 3 students)
- Sample payments, complaints, visitors

**Start the backend:**
```bash
npm run dev     # Development (with nodemon)
# OR
npm start       # Production
```

Backend runs at: `http://localhost:5000`  
Health check: `http://localhost:5000/api/health`

---

### Step 3: Setup Frontend

```bash
cd ../frontend
npm install
```

Edit `.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

**Start the frontend:**
```bash
npm start
```

Frontend runs at: `http://localhost:3000`

---

## 🔑 Demo Login Credentials

| Role    | Email                  | Password     |
|---------|------------------------|--------------|
| Admin   | admin@hostel.com       | password123  |
| Warden  | warden@hostel.com      | password123  |
| Student | amit@student.com       | password123  |
| Student | neha@student.com       | password123  |
| Student | rahul@student.com      | password123  |

---

## 🐳 Docker Setup (Optional)

```bash
# From project root
docker-compose up --build
```

- Frontend: http://localhost:3000  
- Backend API: http://localhost:5000  
- MongoDB: localhost:27017

---

## 📁 Project Structure

```
hostel-platform/
├── backend/
│   ├── config/
│   │   ├── db.js              # MongoDB connection
│   │   └── seed.js            # Sample data seeder
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── hostelController.js
│   │   ├── roomController.js
│   │   ├── studentController.js
│   │   ├── paymentController.js
│   │   ├── complaintController.js
│   │   ├── visitorController.js
│   │   └── analyticsController.js
│   ├── middleware/
│   │   ├── auth.js            # JWT + RBAC middleware
│   │   └── error.js           # Global error handler
│   ├── models/
│   │   ├── User.js
│   │   ├── Hostel.js
│   │   ├── Room.js
│   │   ├── Student.js
│   │   ├── Payment.js
│   │   ├── Complaint.js
│   │   ├── Visitor.js
│   │   └── Notification.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── hostels.js
│   │   ├── rooms.js
│   │   ├── students.js
│   │   ├── payments.js
│   │   ├── complaints.js
│   │   ├── visitors.js
│   │   ├── analytics.js
│   │   └── notifications.js
│   ├── .env
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/        # Reusable UI components
│   │   │   └── layout/        # Sidebar, Header, DashboardLayout
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── admin/         # Admin pages
│   │   │   ├── warden/        # Warden pages
│   │   │   ├── student/       # Student pages
│   │   │   └── Login.jsx
│   │   ├── services/
│   │   │   └── api.js         # Axios API service layer
│   │   ├── App.jsx
│   │   ├── index.js
│   │   └── index.css
│   ├── .env
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── tailwind.config.js
│   └── package.json
│
└── docker-compose.yml
```

---

## 📡 API Reference

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/auth/login | User login |
| POST | /api/auth/register | Register user |
| GET | /api/auth/me | Get current user |
| PUT | /api/auth/profile | Update profile |

### Hostels
| Method | Route | Access |
|--------|-------|--------|
| GET | /api/hostels | All |
| POST | /api/hostels | Admin |
| PUT | /api/hostels/:id | Admin/Warden |

### Rooms
| Method | Route | Access |
|--------|-------|--------|
| GET | /api/rooms | All |
| POST | /api/rooms | Admin/Warden |
| POST | /api/rooms/:id/allocate | Admin/Warden |
| POST | /api/rooms/:id/vacate | Admin/Warden |

### Students
| Method | Route | Access |
|--------|-------|--------|
| GET | /api/students | Admin/Warden |
| GET | /api/students/me | Student (self) |
| POST | /api/students | Admin |

### Payments
| Method | Route | Access |
|--------|-------|--------|
| GET | /api/payments | Role-filtered |
| POST | /api/payments | Admin/Warden |
| PUT | /api/payments/:id/pay | Admin/Warden |
| GET | /api/payments/analytics | Admin/Warden |

### Complaints
| Method | Route | Access |
|--------|-------|--------|
| GET | /api/complaints | Role-filtered |
| POST | /api/complaints | Student |
| PUT | /api/complaints/:id/status | Admin/Warden |

### Visitors
| Method | Route | Access |
|--------|-------|--------|
| GET | /api/visitors | Role-filtered |
| POST | /api/visitors | All auth |
| PUT | /api/visitors/:id/checkout | Admin/Warden |

### Analytics
| Method | Route | Access |
|--------|-------|--------|
| GET | /api/analytics/dashboard | Admin/Warden |
| GET | /api/analytics/occupancy | Admin/Warden |

---

## 🎯 User Roles & Permissions

### Admin
- Full access to all modules
- Manage hostels, rooms, students
- View analytics & reports
- Manage payments
- Handle complaints

### Warden
- Room allocation management
- Complaint management (update status)
- Visitor approval & checkout
- View payment status
- Hostel reports

### Student
- View room details
- View payment history
- Submit & track complaints
- Register visitors

---

## 🏗️ Architecture

```
React SPA (Port 3000)
    │
    │ REST API calls (JWT Auth)
    ▼
Express.js API (Port 5000)
    │
    │ Mongoose ODM
    ▼
MongoDB (Port 27017)
```

Key design patterns:
- **MVC**: Controllers handle business logic, Models define schema
- **RBAC**: Role-based middleware on every protected route
- **Repository pattern**: API service layer in frontend
- **Context API**: Global auth state management

---

## 🔒 Security Features

- JWT authentication with expiry
- Password hashing with bcryptjs (salt rounds: 10)
- Role-based access control (RBAC)
- Mongoose schema validation
- Global error handling middleware
- CORS configuration

---

## 📈 Future Enhancements

- [ ] Email notifications (SMTP/SendGrid)
- [ ] QR code visitor pass scanning
- [ ] Biometric attendance
- [ ] Mobile app (React Native)
- [ ] Multi-university support
- [ ] Online payment gateway (Razorpay)
- [ ] Document upload (S3/Cloudinary)
- [ ] WebSocket real-time notifications
