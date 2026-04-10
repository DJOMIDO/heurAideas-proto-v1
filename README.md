# HeurAIDEAS

> A collaborative project management platform for heuristic evaluation research teams.

---

## Quick Start

### Prerequisites

Ensure you have the following installed on your system:

- **Docker Desktop**
- **Node.js**
- **Git**

---

## Development Setup (Recommended)

**Best for daily development** – The frontend runs locally with hot reload enabled, while the backend services run in Docker.

---

### Step 1: Clone & Install

```bash
# Clone the repository
git clone https://github.com/DJOMIDO/heurAideas-proto-v1.git
cd heurAideas-proto-v1

# Install frontend dependencies (for VS Code support & local dev)
cd frontend
npm install
cd ..
```

---

### Step 2: Start Backend Services (Docker)

```bash
# First time: build and start images
docker-compose up -d --build

# Subsequent runs:
docker-compose up -d
```

---

### Step 3: Start Frontend (Local)

```bash
cd frontend
npm run dev
```

---

## Access URLs

- **Frontend:** http://localhost:5173  
- **Backend API:** http://localhost:8000  
- **API Docs:** http://localhost:8000/docs  
- **pgAdmin:** http://localhost:5050  
