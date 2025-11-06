

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

## 🧠 Authors & Credits

| Name | Role | Institution |
|------|------|--------------|
| Samuel Ponce Luna | Full-Stack Developer / Architect | IES El Rincón |
| Ángel Lallave Herrera | Frontend & UI/UX Designer | IES El Rincón |
| Néstor García Santos | Backend & DB Engineer | IES El Rincón |

---

## 🔗 Useful Links

| Resource | Link |
|-----------|------|
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
## 📘 ER Diagram


![ERD Diagram](//www.plantuml.com/plantuml/png/dLLDSzem4BtxLwXSQ3hb3tHe9ZJGJgPDqWd9sIEi1PR8agiFA9FqltTbfq5sv1aAXsJrtahxj7wIBgpZnlbIPaFs-PJVstcCJQyct-ucrnCsdR4la_ai_9zExc_dBCezkM3spgsX15P9ZYhBG3bqUpPui606Z5iM0lQKCVRXuU5gob1GE1hHdoKQwtB5QUudPfr1jI9KyWJeBPWMniPZh_2NX_Dpeg7aA7kuYbkxqqRaQsxNyPhLMYje0KOlKK9EXDEvDp8cZPOX6PGltm-3dE77eVKLc9oB4jNmZ7BGvhnmk0s92qqJk2AqCC0TY9mxWWM53al8_XmwTQczScPVD-ibRlg5oaNjwlQaqA8rNag-og7K6poWhIfb1HIYLasbmpXLZHZPMjvAluh70cnXi0hpMwgQ3UGe20rBZiTVlzSVmi0AAOs76NcmUToFBWzAjDbwGXw0Daw92THu2RRx2Ia0NhwW6wjLt9vxekg-XE2OzlTljA05uqnKbchuRgUaNkat4dM1NEOIrQDjHCOEMkppuBocP3XCKSsaoHZpbKZWdNrVGxa0Ovlj7yP9Mn2Ts7AVBAFR9jfeL0cL4fQkN-9TP8nQOmpyXyZYuFW4QnrtthuUyGgK8CrqodbL6Rq5GQ613HIEmhEkNuFk7la_jNMrx10STTGAhHpD9iZ1RqS0zswjamqkGI0FBehi8l4HR5xxizaaOLk4NHSxsJFpIYkhczlz9JxcnAGCluE5HGST-7HfDzhX4ek3Ls8WzGgbhPlwAYLOorSjoEshmwFGyaDjmSPIv9l6a6gB3cXK1h7wzSammCLn3yQGZH8_TZVxCRcykhsPpPCyxJBxzwmyFuz6-Yc--wd4OCtje9iIxe5NBZpXNQ9HsIMZsuDo5Y2rMbdcz20BL4yQga9w0RQTr3hbbDNq5mobHVhximl0RKTVSmI9tHdiQe-SqbqXkm0bV2cplm00)
# Use case diagram
![Use Case Diagram](//www.plantuml.com/plantuml/png/dPFFRk8m48VlVefHBfpGBl_Xi2kiW1275HBPz6wSWLfAx7JiN5hrgVe8VR4wODoWSYBAuPFdc_dPZhAqJf1hgfBruCyZpyy-WDMMR_Ry7uVL6bAUxR8MycntOpuSo8HqXY39BL82ma9-NU55fVHvYL-N_gEe81Mr4w6ICaOedT2d4Y79b7LO2IWGKbFLw51B9Mm2Rmp0lur5AQmNztZoAWco2BzWgvNN22nQzVbn6PodWsx3kb3E6pNIKPL167Q59oIGvqm_osYqGHfrfLohDb50em5V6bMRO8rlDoVLGH5euzHHIN4pRz8rKy9sKyQwK9rsgnkqphSA2bdN4RExDn4aG1tFqRcCURU7rsGEliC0eNmMhnxfCYPcBBxzy253ohqx6lncx9sn7kon3ATbEVJxVzjQf66aKQHnf4caAKi3pIBD6G-qYEHJbwYBzcVv0W00)




---

# 📘 Class Diagram

![Class Diagram](//www.plantuml.com/plantuml/png/dLHDRnen4BtpAomkQLNbq2jIgw0agY8bLKJAUMMympB47olFB0XL_U-r5sTh4w0H793zvldDlfcnRuYbvyxeqPNuTidl_JaXxXwcFsRJfwcuknUtZzEN-nSnVteK9V7YX2Eb9P6O4tZnUoJ4jPZF7-u4rlsQsADjn18zSMMbWHpLyWZO4VX338n4dGEj9DewNrShIQiYi78M2i2x9MgeGe1TrVb2nZkz9ozSM4aha2gf63Txj9OCZ0Q4yX2MTIKvujVXxulGha7xwNE_zj0WCVYqxTfuydcVEM1_tefqwphBVfVgX9OFodJeMxcws2-rR2emResvfcc1aT7PaxeXh0iXqbsJxsiWvR6D8eNpvCpB6AdwuJmJ1rkNqVv05RSb7eW9pNhHQQ2XGMjoDaP0cZVikYZrhn19vPRMkiugc05rcYalU6HzlDh8ktoFbXYvYzPoMBl67NodKoXrfT6-qhd16V0q8UL0oRf-0hCOfiY3SHiOeCBJ7ZtfBCvrcN3jq1xv3WrBZk0WFilwULAUM797PmOXefcnjlN1oM1h3OfpGy-E-EEZgvnbiFol-WPgbB4XD4XeV0MgLBnj0xP1s2RiyXwrtK8ZhPALc2Otyj8wIywV7RYJavImBIm86Nfu4Fxf69UeKbVAH_PCgGmGoQQ0UDU-U_4yoFh_xvsH_dLAiy3TMxuICz1IeRD0e_xr7tyT1x8O6sbtu_tLcoGf4j-FSMBd0sVhyHIbj3uH7XJWfYUdn_HuMkUnGNkALJoQ4w5Thn_fyNZ9pU_Rf9y-YJRcp_34Z6V2qJdrLDF70Z5FLaeNjsqYq2hTrV0cVfxSIi-ei4tLlG5RTqQF_W80)

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
