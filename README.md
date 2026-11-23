# India Book House (IBH)
### Enterprise Multi-School Book Allocation, Kit Dispatch & Student Billing LMS

[![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?style=flat)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v19-61DAFB?style=flat)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-v8-646CFF?style=flat)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/Database-SQLite3-003B57?style=flat)](https://www.sqlite.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat)](https://www.docker.com/)
[![Swagger](https://img.shields.io/badge/API_Docs-Swagger_UI-85EA2D?style=flat)](/docs)

---

## Executive Overview

**India Book House LMS** is an enterprise-grade digital distribution, student kit packaging, and financial reconciliation platform designed for multi-school publishers, central distribution depots, and campus delivery camps.

It modernizes traditional textbook distribution by replacing error-prone manual registers with a **real-time 4-card cockpit console**, providing 100% transparency across school dispatches, student kit checklists, item-level partial deliveries, and fee collections.

---

## Core System Modules

### 1. 4-Card Unified Student Allocation Console
Each student row is rendered as an ergonomic, high-density 4-card operations bar:
- **Card 1: Student Details**: Read-only display of Admission ID, Class, Section, Roll Number, and Guardian Name with dirty-state indicator.
- **Card 2: Books & Stationery Checklist**: Interactive item checklist displaying subject code, item type (BOOK/COPY/STATIONERY), unit pricing, and sub-lines with full/partial item selection.
- **Card 3: Real-Time Financial Ledger**: Automatically computes Gross Total, Sibling/Staff Concessions, Paid Amount, and Remaining Due. Features real-time status badges (`PAID`, `PARTIAL`, `UNPAID`) and a one-click **Save** action.
- **Card 4: Details & Audit Remarks**: Captures mandatory justification for fee concessions, kit hand-over audit logs, and allows opening the full Student Profile Modal.

### 2. Multi-Campus School Dispatch Management
- Supports multiple affiliated educational institutions (e.g., Trinity Global School, DPS).
- Maps educational boards: **CBSE, ICSE, NCERT, and State Boards**.
- Real-time progress bars showing class-wise and campus-wide kit delivery progress.

### 3. Class-Wise Kit Packaging Engine
- Define standard class kits (Class 1 to Class 12) combining prescribed textbooks, notebooks, and approved stationery.
- Real-time gross price calculation based on master item inventory.

### 4. Master Data & Inventory Management
- Centralized database for **Item Types, Class Grades, Academic Subjects, and Publishers/Brands**.
- Dynamic search, filters, and batch updates.

### 5. Bulk Excel Student Importer
- Import hundreds of students per section in seconds via `.xlsx` spreadsheets with automatic column validation and error prevention.

### 6. Enterprise Security & Role-Based Access (RBAC)
- Password hashing with **bcryptjs** (10 salt rounds).
- Stateless **JWT (JSON Web Token)** authentication valid for 7 days.
- Role-based authorization (`admin` vs `staff` operators).

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite 8, Tailwind CSS v4, Lucide Icons, Axios, TanStack React Query |
| **Backend** | Node.js (v20+), Express.js (v4.21), Sequelize ORM (v6), Swagger UI Express |
| **Database** | SQLite3 (`/backend/data/library.db` with host volume persistence) |
| **File Processing** | Multer, SheetJS (`xlsx`) |
| **DevOps** | Multi-Stage Dockerfile, Docker Compose, Healthcheck probes |

---

## Repository Structure

```text
india-book-house/
├── backend/                  # Express REST API Server
│   ├── data/                 # SQLite database storage (library.db)
│   ├── models/               # Sequelize ORM schema definitions & masters
│   ├── routes/               # API route controllers (auth, schools, items, students, masters, sync)
│   ├── utils/                # Standardized response & error utilities
│   ├── database.js           # Sequelize connection instance
│   ├── package.json          # Backend dependencies
│   ├── seed.js               # Database seeding script (admin user & demo data)
│   ├── server.js             # Main server entrypoint & SPA static file server
│   └── swagger.json          # OpenAPI / Swagger specification
├── desktop-app/              # Standalone Offline Windows Desktop App (Electron.js)
│   ├── assets/               # Application icons
│   ├── main.js               # Electron main process & embedded backend runner
│   ├── preload.js            # Secure IPC bridge
│   ├── sync-service.js       # Two-way Cloud Synchronization Engine
│   └── package.json          # Electron & installer builder configuration
├── frontend/                 # React 19 + Vite + Tailwind CSS v4 SPA
│   ├── src/
│   │   ├── components/       # UI modules (Landing, Dashboard, Schools, Students, Inventory, etc.)
│   │   ├── services/         # Axios API client with dynamic origin resolution
│   │   ├── App.jsx           # Root layout & route switcher
│   │   └── main.jsx          # React DOM entrypoint
│   ├── package.json          # Frontend dependencies
│   └── vite.config.js        # Vite config with Tailwind & dev proxy
├── .dockerignore             # Docker build exclusion rules
├── .env.example              # Sample environment variables
├── docker-compose.yml        # 1-Click production container orchestration
├── Dockerfile                # Multi-stage production container build
└── README.md                 # System documentation
```

---

## Quick Start (Docker Deployment - Recommended)

The application includes an optimized multi-stage `Dockerfile` and `docker-compose.yml` that compiles the frontend and runs the Node.js production server with persistent database storage.

### 1. Prerequisites
- [Docker](https://docs.docker.com/get-docker/) (v24+)
- [Docker Compose](https://docs.docker.com/compose/) (v2+)

### 2. Launch the Application
Run a single command in the project root:
```bash
docker compose up -d --build
```

### 3. Seed Initial Master Data & Admin Account (First Run Only)
```bash
docker compose exec india-book-house node backend/seed.js
```

### 4. Access the Application
- **Web Portal**: [http://localhost:5000](http://localhost:5000)
- **Interactive Swagger Docs**: [http://localhost:5000/docs](http://localhost:5000/docs)
- **System Healthcheck**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## Manual Local Development Setup

If you wish to run the project without Docker:

### 1. Backend Setup
```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Seed the initial admin account and sample data
npm run seed

# Start development server with auto-reload
npm run dev
# Server will run on http://localhost:5000
```

### 2. Frontend Setup
```bash
# Open a new terminal and navigate to frontend
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
# Frontend will run on http://localhost:3000
```

---

## Offline Desktop Application (Electron.js)

The application can also be run and packaged as a standalone **100% offline Windows software** (`.exe`) that works without any internet or external database setup.

### 1. Run Desktop App in Development
```bash
# Navigate to desktop-app directory
cd desktop-app

# Install desktop dependencies
npm install

# Launch native desktop application
npm start
```

### 2. Build Windows Installer (.exe)
```bash
# Generates installer in desktop-app/dist-build/
npm run dist
```
This produces:
- **`India Book House LMS Setup 1.0.0.exe`**: Self-contained Windows installer for clients. Double-clicking installs desktop and start menu shortcuts.
- **`India Book House LMS 1.0.0.exe`**: Portable executable that runs directly from pen-drives without installation.

### 3. Client Installation
Clients do not need Node.js, terminal commands, or internet:
1. Double-click `India Book House LMS Setup 1.0.0.exe`.
2. Click `Next` -> `Install` -> `Finish`.
3. Open the desktop shortcut to use the software completely offline.

### 4. Cloud Synchronization
When an internet connection is available, click **Sync** to automatically exchange data with your online server (`/api/sync/*`):
- Pushes offline student checklist marks, concessions, and collected fees.
- Pulls updated master item rates, books, and affiliated schools.

---

## Default Credentials

After running `npm run seed` (or the Docker seed command), the following credentials are ready for login:

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Administrator** | `admin@indiabookhouse.com` | `admin123` | Full Access (Master Data, Schools, Billing, Dispatches) |
| **Staff Operator** | `staff@indiabookhouse.com` | `staff123` | Operational Access (Checklist Marking & Remarks) |

---

## API Endpoints Reference

All API responses follow a standardized JSON envelope:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation successful",
  "data": { ... }
}
```

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Authenticate user & return JWT token |
| `POST` | `/api/auth/register` | Register new staff or admin user |
| `GET` | `/api/auth/me` | Fetch active user session |
| `GET` | `/api/schools` | List all affiliated schools with dispatch stats |
| `POST` | `/api/schools` | Register new affiliated school |
| `GET` | `/api/items` | List master book & stationery items |
| `POST` | `/api/items` | Add new inventory item |
| `GET` | `/api/students` | Get students filtered by school & class |
| `PUT` | `/api/students/:id` | Update checklist, concession, and billing status |
| `POST` | `/api/students/import-excel` | Bulk student roster upload via Excel (`.xlsx`) |
| `GET` | `/api/masters/all` | Fetch all master lookup tables in one call |
| `GET` | `/api/health` | Service health status and timestamp |
| `GET` | `/docs` | Interactive Swagger API documentation |

---

## Production & Hosting Guidelines

### Custom Domain / Port 80 Setup
To host directly on port 80 without specifying `:5000` in the browser, update `docker-compose.yml`:
```yaml
ports:
  - "80:5000"
```

### Reverse Proxy & SSL (Nginx Example)
When using an Nginx reverse proxy with Let's Encrypt SSL:
```nginx
server {
    server_name books.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Database Persistence & Backups
SQLite database files are stored on the host machine at `./data/library.db` via Docker volume mapping.
To create a backup:
```bash
# Safely snapshot the database while the container is running
sqlite3 ./data/library.db ".backup './data/library_backup_$(date +%F).db'"
```

---

## License & Compliance

Copyright &copy; 2026 **India Book House**. All rights reserved.  
Licensed under the [ISC License](LICENSE). Built for educational textbook allocation and institutional compliance.
