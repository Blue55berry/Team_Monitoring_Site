# 🚀 WorkForce Intelligence - AI-Powered Management Platform

An enterprise-grade workforce and project management platform built with the **MERN Stack**, **GraphQL**, and **RAG AI** architecture.

## ⚡ Quick Start

### Prerequisites
- **Node.js** v18+
- **MongoDB** (local or Atlas)
- **npm** or **yarn**

### 1. Start MongoDB
```bash
# If using local MongoDB
mongod

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:7
```

### 2. Start the Backend
```bash
cd server
npm install
npm run seed    # Seeds the database with demo data
npm run dev     # Starts on http://localhost:4000
```

### 3. Start the Frontend
```bash
cd client
npm install
npm run dev     # Starts on http://localhost:5173
```

### 4. Login with Demo Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@workforce.com | password123 |
| HR Manager | sarah@workforce.com | password123 |
| Manager | james@workforce.com | password123 |
| Employee | emily@workforce.com | password123 |

---

## 🏗️ Architecture

```
├── client/                    # React Frontend (Vite + Tailwind)
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── context/           # Auth & Theme providers
│   │   ├── graphql/           # Apollo Client & Operations
│   │   └── pages/             # Route pages
│   └── ...
├── server/                    # Node.js Backend
│   ├── src/
│   │   ├── config/            # Database config
│   │   ├── graphql/           # Schema & Resolvers
│   │   ├── middleware/        # Auth & RBAC
│   │   ├── models/            # Mongoose models
│   │   ├── rag/               # RAG AI pipeline
│   │   └── sockets/           # Socket.IO handlers
│   └── ...
└── docker-compose.yml
```

## 📋 Features

### ✅ Implemented
- **Authentication** — JWT login/register with role-based access
- **Admin Dashboard** — KPI cards, charts, RAG status overview
- **Employee Management** — CRUD with performance tracking
- **Department Management** — Organization structure
- **Project Monitoring** — Progress tracking, milestones, RAG status
- **Task Board** — Kanban-style board with status management
- **Client CRM** — Contact management, meetings, follow-ups
- **Attendance System** — Check-in/out with work hours calculation
- **Leave Management** — Request, approve, reject workflow
- **AI Assistant** — Chat interface with sample queries
- **Dark/Light Mode** — System-preference aware theme toggle
- **Real-time Updates** — Socket.IO infrastructure
- **GraphQL API** — Full schema with queries, mutations, subscriptions

### 🔧 Requires Configuration
- **RAG AI Pipeline** — Needs Gemini/OpenAI API key
- **Vector Database** — ChromaDB setup for embeddings
- **Email Notifications** — SMTP configuration
- **GPS Attendance** — Geolocation integration

## 🛡️ Security
- JWT with access + refresh tokens
- bcrypt password hashing (10 rounds)
- Role-Based Access Control (Admin/HR/Manager/Employee)
- GraphQL resolver-level authorization
- Express rate limiting
- Helmet security headers

## 🐳 Docker
```bash
docker-compose up -d
```

## 📄 License
MIT
