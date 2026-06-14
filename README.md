# Mopsy — Cleaning Service Management Portal

Mopsy is a SaaS-ready Cleaning Service Management Portal featuring React (Vite) + Tailwind CSS on the frontend, Node.js + Express on the backend, and MariaDB for data persistence.

## Project Structure

- `backend/` - Node.js Express server + modular routes, services, and models.
- `frontend/` - React SPA built with Vite and styled with Tailwind CSS.
- `docker-compose.yml` - Sets up the MariaDB, backend, and frontend containers.

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js v20 (for local development)

### Running with Docker

1. Copy `.env.example` to `.env` (already done by scaffold script).
2. Start the stack:
   ```bash
   docker compose up --build -d
   ```
3. The frontend is accessible at `http://localhost:3000` (port mapped from container port 80).
4. The backend is accessible at `http://localhost:3001` (port mapped from container port 3001).

### Running Locally (Without Docker)

#### Database Setup
Ensure you have a running MariaDB/MySQL server, create a database named `mopsy`, and run the schema and seed scripts:
- `backend/config/schema.sql`
- `backend/config/seed.sql`

#### Start backend
```bash
cd backend
npm install
npm run dev
```

#### Start frontend
```bash
cd frontend
npm install
npm run dev
```
