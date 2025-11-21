

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

- **[🏗️ Architecture](docs/architecture.md)** - System architecture and design
- **[🔌 API Reference](docs/api.md)** - Complete API documentation
- **[🛠️ Development Guide](docs/development.md)** - Setup and development workflow
- **[🔒 Security Guide](docs/security.md)** - Security measures and best practices
- **[📊 System Diagrams](docs/diagrams/diagrams.md)** - ERD, use cases, and architecture diagrams
- **[⚙️ HTTPS Setup Guide](docs/howToHttps.md)** - Setting up HTTPS with Nginx and Let's Encrypt

---

## 🧠 Authors & Credits

| Name | Role | Institution |
|------|------|--------------|
| Samuel Ponce Luna | Full-Stack Developer | IES El Rincón |
| Ángel Lallave Herrera | Frontend & UI/UX Designer | IES El Rincón |
| Néstor García Santos | Backend & Frontend | IES El Rincón |

---

## 🔗 Useful Links

| Resource | Link |
|-----------|------|
| 🖥️ **Frontend (Main URL)**  | [https://robeurope.samuelponce.es](https://robeurope.samuelponce.es) | 
| 🌐 **Live Swagger Docs** | [https://api.robeurope.samuelponce.es/api-docs/](https://api.robeurope.samuelponce.es/api-docs/) |
| 🧩 **Postman Collection** | [View on Postman](https://solar-crater-87778.postman.co/workspace/Team-Workspace~863e014b-231f-4611-84da-6746814f344e/collection/15303917-8ce87247-fb50-4d0f-8770-de9131768fd1) |
| 🎨 **Figma UI Design** | [View on Figma](https://www.figma.com/design/UptdKH6RgmLhRwNIkr5qpU/Sin-t%C3%ADtulo?node-id=0-1&t=WDyHv57bP0Kiux3v-1) |

---

## 🧱 Tech Stack

| Layer | Technologies |
|--------|---------------|
| 🎨 **Frontend** | React (In Progress) |
| ⚙️ **Backend** | Node.js (ESM) + Express + Sequelize |
| 💾 **Database** | MySQL (with Sequelize ORM) |
| 🔐 **Auth** | JWT (jsonwebtoken) + bcryptjs - Admin Panel with sessions and EJS |
| 📄 **API Docs** | Swagger UI (via `/api-docs`) |

---
## 📘 Diagrams
Diagrams can be seen in ![Docs](https://github.com/s-pl/RobEurope/docs/diagrams/diagrams.md)

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
npm run seed (in backend/)
```

### 4️⃣ Start the backend

```bash
node index.js (or npm start) 
```

👉 API runs at:  
**http://localhost:85/api**

Swagger Docs:  
**http://localhost:85/api-docs**

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

## Nginx Reverse Proxy Setup for HTTPS

Documentation for setting up Nginx as a reverse proxy with HTTPS can be found in [docs/howToHttps.md](docs/howToHttps.md).
