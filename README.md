

# ⚙️ **RobEurope**

> **Redesign of [robeurope.com](https://robeurope.com)** by  
> **Samuel Ponce Luna**, **Ángel Lallave Herrera**, and **Néstor García Santos**  
> from **IES El Rincón**

---

## 🌍 Overview

**RobEurope** is an open-source backend for a **competitive gaming & events platform**.  
It enables management of **users, teams, competitions, registrations, posts, notifications, and sponsors**.  

This repository contains the **Node.js API** (Express + Sequelize) and all developer tools:  
seeders, minimal test UI, and Swagger API documentation.

---

## 📚 Documentation

Complete project documentation is available in the [`docs/`](docs/) directory:

- **[📖 Documentation Index](docs/index.md)** - Main documentation hub
- **[🏗️ Architecture](docs/architecture.md)** - System architecture and design
- **[🔌 API Reference](docs/api.md)** - Complete API documentation
- **[💾 Database Schema](docs/database.md)** - Database models and relationships
- **[🛠️ Development Guide](docs/development.md)** - Setup and development workflow
- **[🔒 Security Guide](docs/security.md)** - Security measures and best practices
- **[🤝 Contributing](docs/contributing.md)** - Contribution guidelines
- **[📊 System Diagrams](docs/diagrams/diagrams.md)** - ERD, use cases, and architecture diagrams

---

## 🧠 Authors & Credits

| Name | Role | Institution |
|------|------|--------------|
| Samuel Ponce Luna | Full-Stack Developer / Architect | IES El Rincón |
| Ángel Lallave Herrera | Frontend & UI/UX Designer | IES El Rincón |
| Néstor García Santos | Backend & Frontend | IES El Rincón |

---

## 🔗 Useful Links

| Resource | Link |
|-----------|------|
| 🖥️ **Frontend (Main URL)** | [http://46.101.255.106:5173/](http://46.101.255.106:5173/) |
| 🌐 **Live Swagger Docs** | [http://46.101.255.106:85/api-docs/](http://46.101.255.106:85/api-docs/) |
| 🧩 **Postman Collection** | [View on Postman](https://solar-crater-87778.postman.co/workspace/Team-Workspace~863e014b-231f-4611-84da-6746814f344e/collection/15303917-8ce87247-fb50-4d0f-8770-de9131768fd1) |
| 🎨 **Figma UI Design** | [View on Figma](https://www.figma.com/design/UptdKH6RgmLhRwNIkr5qpU/Sin-t%C3%ADtulo?node-id=0-1&t=WDyHv57bP0Kiux3v-1) |

---

## 🧱 Tech Stack

| Layer | Technologies |
|--------|---------------|
| 🎨 **Frontend** | React (not yet.... YET) |
| ⚙️ **Backend** | Node.js (ESM) + Express + Sequelize |
| 💾 **Database** | MySQL (with Sequelize ORM) |
| 🔐 **Auth** | JWT (jsonwebtoken) + bcryptjs |
| 📄 **API Docs** | Swagger UI (via `/api-docs`) |

---
## 📘 Diagrams
Diagrams can be seen in ![Docs](https://github.com/s-pl/RobEurope/tree/change-upload-schema/docs)

## 🚀 Quickstart (Developer Setup)

### 1️⃣ Install dependencies

```bash
cd backend
npm install
```

### 2️⃣ Create environment file

In `backend/.env`:

```env
PORT=85
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=robeurope
DB_USER=root
DB_PASS=your_password
NODE_ENV=development
JWT_SECRET=your_secret_key_for_jwt
```

### 3️⃣ Seed minimal data (example: countries)

```bash
node seeders/run-seed-countries.js
```

### 4️⃣ Start the backend

```bash
npm start
```

👉 API runs at:  
**http://localhost:85/api**

Swagger Docs:  
**http://localhost:85/api-docs**

---

## 📂 Folder Structure

```
backend/
├─ controller/        # Express controllers
├─ middleware/        # Auth, rate-limit, etc.
├─ models/            # Sequelize model definitions
├─ routes/api/        # Route definitions mounted at /api
├─ seeders/           # Seed scripts for initial data
├─ public/            # Minimal test UI files
├─ config/            # DB and app configuration
└─ index.js           # Application entry point
```

---

## 📡 API Overview

| Feature | Endpoint | Description |
|----------|-----------|-------------|
| 🩺 **Health Check** | `GET /api/health` | Verifies service & DB connection |
| 🔐 **Auth** | `POST /api/auth/register` / `POST /api/auth/login` | Register or log in (returns `{ token, user }`) |
| 🌍 **Countries** | CRUD `/api/countries` | Manage country data |
| 👤 **Users** | `/api/users`, `/api/users/:id`, `/api/users/me` | User management (some routes require auth) |
| 👥 **Teams & Members** | `/api/teams`, `/api/team-members` | Create & manage teams |
| 🏆 **Competitions** | `/api/competitions` | Manage tournaments & events |
| 🧾 **Registrations** | `/api/registrations` | Handle team signups |
| 📰 **Posts** | `/api/posts` | Publish and view posts |
| 🔔 **Notifications** | `/api/notifications` | User alerts |
| 💰 **Sponsors** | `/api/sponsors` | Manage sponsor tiers and visibility |

---

## 🔑 Authentication

- JWT-based (Bearer tokens)
- Include this header in protected routes:
  ```http
  Authorization: Bearer <your_token>
  ```
- Tokens are returned after login or register.
- Default expiration: **1 hour** (configurable).

---

## 🧭 Swagger API Docs

Swagger UI is served at `/api-docs` and automatically:
- Displays available routes
- Lets you **authorize** with your JWT token
- Supports testing API endpoints interactively

> Example:  
> `POST /auth/login` → copy token → click “Authorize”
