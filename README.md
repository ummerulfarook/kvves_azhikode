# KVVA Management System

**Kerala Vyapari Vaivasyai — Azhikode Branch**  
Community Finance & Member Management System

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Django 4.2 + DRF 3.15 |
| Auth | JWT (simplejwt) |
| Database | PostgreSQL 15 |
| Frontend | React 18 + Vite 5 |
| UI | Ant Design v5 |
| State | Redux Toolkit |
| Charts | Recharts |
| Server | Waitress (Windows) |

---

## Quick Start

### 1. Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 15

### 2. Create PostgreSQL Database

```sql
CREATE DATABASE kvva_db;
CREATE USER kvva_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE kvva_db TO kvva_user;
```

### 3. Configure Backend

```bat
cd backend
copy .env.example .env
:: Edit .env with your DB credentials and SECRET_KEY
```

### 4. Install & Migrate

```bat
:: Backend
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_data
python manage.py collectstatic --noinput

:: Frontend
cd ..\frontend
npm install
```

### 5. Run Development

**Terminal 1 — Backend:**
```bat
cd backend
set DJANGO_SETTINGS_MODULE=core.settings.development
python manage.py runserver 0.0.0.0:8000
```

**Terminal 2 — Frontend:**
```bat
cd frontend
npm run dev
```

Open: http://localhost:5173

### 6. Default Login Credentials

| Username | Password | Role |
|----------|----------|------|
| admin | kvva@admin2024 | Admin |
| staff | kvva@staff2024 | Staff |
| viewer | kvva@view2024 | Viewer |

> ⚠️ Change all passwords immediately after first login!

---

## Production Deployment (Windows + Waitress)

### 1. Build Frontend

```bat
cd frontend
npm run build
:: Output goes to frontend/dist/
```

### 2. Configure Nginx to Serve Frontend

Add to nginx.conf:
```nginx
server {
    listen 80;
    server_name 192.168.1.100;

    root C:/kvva/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
    }

    location /media/ {
        alias C:/kvva/media/;
    }

    location /static/ {
        alias C:/kvva/staticfiles/;
    }
}
```

### 3. Run Waitress

```bat
cd backend
set DJANGO_SETTINGS_MODULE=core.settings.production
python serve.py
```

### 4. Register as Windows Service with NSSM

```bat
nssm install KVVA-Backend "python" "C:\kvva\backend\serve.py"
nssm set KVVA-Backend AppDirectory "C:\kvva\backend"
nssm set KVVA-Backend AppEnvironmentExtra "DJANGO_SETTINGS_MODULE=core.settings.production"
nssm start KVVA-Backend
```

---

## Features

### Member Management
- Complete member profiles (personal, address, identity, membership)
- Malayalam name support
- Photo upload
- Multi-step form (add/edit)
- Soft delete (never hard-delete)
- Excel import/export

### Chit Funds
- Create chit groups with automatic payment schedule generation
- Enroll members (one ticket per enrollment)
- Record monthly instalments
- Track overdue payments
- Prize won tracking

### Loans
- Loan application workflow (pending → approved → active)
- Amortization schedule auto-generation on approval
- EMI recording with principal/interest breakdown
- Loan close on full repayment

### Dues & Deposits
- Multiple deposit types (membership fee, savings, FD, RD, etc.)
- Deposit withdrawal tracking
- Manual due creation and mark-paid
- Overdue tracking

### Reports & Analytics
- Dashboard with stat cards and bar charts
- Monthly collection trends
- Member statistics (by type, by status)
- Loan performance summary
- Combined overdue report across all modules
- One-click Excel exports

### Import / Export
- Excel import with row-by-row validation and preview
- Atomic import (all-or-nothing)
- Template download with example data
- Export members, overdue report

### Access Control
- 3 roles: Admin, Staff, Viewer
- JWT authentication with refresh token rotation
- Role-based UI visibility (canWrite, canDelete, canApproveLoan)

---

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/login/` | JWT login |
| `POST /api/auth/logout/` | Blacklist refresh token |
| `GET /api/auth/me/` | Current user profile |
| `GET /api/members/` | List/search members |
| `POST /api/members/` | Create member |
| `GET /api/members/{id}/` | Member detail |
| `GET /api/members/{id}/summary/` | Financial summary |
| `GET /api/members/{id}/activities/` | Activity timeline |
| `GET /api/chit-groups/` | List chit groups |
| `POST /api/chit-groups/{id}/enroll/` | Enroll member |
| `POST /api/enrollments/{id}/payments/` | Record chit payment |
| `GET /api/loans/` | List loans |
| `PATCH /api/loans/{id}/approve/` | Approve loan (admin) |
| `POST /api/loans/{id}/repayments/` | Record EMI |
| `GET /api/reports/dashboard/` | Dashboard data |
| `GET /api/reports/overdue-list/` | Combined overdue |
| `POST /api/import/members/` | Import Excel |
| `GET /api/export/members/` | Export Excel |

---

## Project Structure

```
kvva/
├── backend/
│   ├── apps/
│   │   ├── accounts/     # Custom User model, JWT auth, permissions
│   │   ├── members/      # Member CRUD, photo, summary
│   │   ├── nominees/     # Nominee management
│   │   ├── chits/        # Chit groups, enrollments, payments
│   │   ├── loans/        # Loans, repayment schedule
│   │   ├── dues/         # Dues, deposits
│   │   ├── activities/   # Audit log
│   │   ├── reports/      # Dashboard, summaries
│   │   └── imports/      # Excel import/export
│   ├── core/
│   │   └── settings/     # base, development, production
│   ├── serve.py          # Waitress production server
│   └── requirements.txt
└── frontend/
    └── src/
        ├── api/          # Axios API services
        ├── app/slices/   # Redux slices
        ├── components/   # Shared components
        ├── hooks/        # useAuth, usePermissions
        ├── layouts/      # AppLayout, AuthLayout
        ├── pages/        # Page components
        ├── router/       # React Router config
        ├── styles/       # Global CSS (dark Kerala theme)
        └── utils/        # formatters, validators, constants
```
