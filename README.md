# GoalFlow — Company Goal Tracking Portal

A full-stack goal setting and tracking system for companies, with role-based access for Employees, Managers, and Admins.

---

## 📁 Folder Structure

```
goal-portal/
├── backend/
│   ├── main.py          # FastAPI app + all endpoints
│   ├── database.py      # SQLAlchemy setup (SQLite)
│   ├── models.py        # DB models: User, Goal, QuarterlyUpdate
│   ├── schemas.py       # Pydantic schemas
│   ├── crud.py          # Database operations
│   ├── seed.py          # Demo data seeder
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── EmployeeDashboard.jsx
│   │   │   ├── GoalForm.jsx
│   │   │   ├── ManagerDashboard.jsx
│   │   │   ├── QuarterlyUpdate.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── components/
│   │   │   ├── Layout.jsx       # Sidebar + nav
│   │   │   └── GoalCard.jsx     # Reusable goal card
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # JWT auth state
│   │   ├── utils/
│   │   │   └── api.js           # Axios instance
│   │   ├── App.jsx              # Routes
│   │   ├── main.jsx
│   │   └── index.css            # Tailwind + custom styles
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── Dockerfile
├── docker-compose.yml
├── start_backend.sh
└── start_frontend.sh
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Python 3.11+
- Node.js 20+

### Terminal 1 — Backend

```bash
cd goal-portal/backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Terminal 2 — Frontend

```bash
cd goal-portal/frontend
npm install
npm run dev
```

### Seed Demo Data

Open your browser and go to **http://localhost:3000/login**

Click the **"🌱 Seed Demo Data"** button on the login page, then log in with any demo account.

---

## 🐳 Docker Deployment

```bash
cd goal-portal
docker-compose up --build
```

App available at **http://localhost:3000**

---

## 👤 Demo Credentials

| Role     | Username  | Password    | State                    |
|----------|-----------|-------------|--------------------------|
| Admin    | admin     | admin123    | Full access              |
| Manager  | manager1  | manager123  | Team review              |
| Employee | john      | emp123      | Goals approved           |
| Employee | jane      | emp123      | Goals pending review     |
| Employee | mike      | emp123      | Goals in draft           |

---

## ✨ Feature Summary

### Employee
- Create up to **8 goals** per cycle
- Each goal: title, description, target, UoM, weightage (min 10%)
- Total weightage across all goals **must equal 100%** before submission
- Submit goals for manager review
- Submit **quarterly achievement updates** (Q1–Q4) on approved goals
- View manager check-in comments

### Manager
- View all team goals with status filters
- **Approve or reject** submitted goals (with rejection reason)
- **Edit** target and weightage before approving
- Add **check-in comments** on quarterly updates

### Admin
- All manager capabilities
- **Unlock** approved/submitted goals back to draft
- **Export CSV** report with all goals and quarterly data
- Dashboard with charts and employee overview

---

## 🔌 API Endpoints

| Method | Endpoint                        | Role     | Description                   |
|--------|---------------------------------|----------|-------------------------------|
| POST   | /token                          | All      | Login                         |
| GET    | /me                             | All      | Current user info             |
| GET    | /goals/my                       | Employee | My goals                      |
| POST   | /goals                          | Employee | Create goal                   |
| PUT    | /goals/{id}                     | Employee | Edit draft goal               |
| DELETE | /goals/{id}                     | Employee | Delete draft goal             |
| POST   | /goals/submit                   | Employee | Submit drafts for review      |
| GET    | /goals/all                      | Manager+ | All goals                     |
| GET    | /goals/pending                  | Manager+ | Submitted goals               |
| POST   | /goals/{id}/approve             | Manager+ | Approve goal                  |
| POST   | /goals/{id}/reject              | Manager+ | Reject with reason            |
| PUT    | /goals/{id}/manager-edit        | Manager+ | Edit target/weightage         |
| POST   | /goals/{id}/unlock              | Admin    | Unlock to draft               |
| POST   | /updates                        | Employee | Submit quarterly update       |
| GET    | /updates/goal/{id}              | All      | Updates for a goal            |
| POST   | /updates/{id}/checkin           | Manager+ | Add check-in comment          |
| GET    | /reports/export                 | Admin    | Download CSV                  |
| GET    | /stats/overview                 | Manager+ | Dashboard stats               |
| POST   | /seed                           | All      | Seed demo data                |

API docs: **http://localhost:8000/docs**

---

## 🛠 Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS + Recharts
- **Backend**: FastAPI + SQLAlchemy
- **Database**: SQLite (file: `goalportal.db`)
- **Auth**: JWT (PyJWT) + bcrypt password hashing
- **Deployment**: Docker + Nginx
