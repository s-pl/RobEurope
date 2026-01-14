# RobEurope Platform

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/s-pl/RobEurope)
[![Version](https://img.shields.io/badge/version-0.1.0-blue)](https://github.com/s-pl/RobEurope/releases)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-19.x-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Express](https://img.shields.io/badge/express-4.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/mysql-8.x-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Redis](https://img.shields.io/badge/redis-alpine-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/docker-compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![OpenLDAP](https://img.shields.io/badge/openldap-1.5.0-3B80AE)](https://www.openldap.org/)
[![Socket.IO](https://img.shields.io/badge/socket.io-4.x-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![TailwindCSS](https://img.shields.io/badge/tailwindcss-3.x-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/vite-7.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![ESLint](https://img.shields.io/badge/eslint-9.x-4B32C3?logo=eslint&logoColor=white)](https://eslint.org/)
[![Vitest](https://img.shields.io/badge/vitest-4.x-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)](CONTRIBUTING.md)

---

RobEurope is a comprehensive platform designed for managing robotics competitions across Europe. The system provides a complete solution for user registration, team formation, competition enrollment, live streaming, and real-time collaboration between participants.

**Authors:** Samuel Ponce Luna and Angel Lallave Herrera

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Documentation](#documentation)
- [API Reference](#api-reference)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

RobEurope serves as a centralized hub for robotics enthusiasts, teams, and competition organizers. The platform facilitates the entire competition lifecycle from team registration to live event streaming.

### Key Objectives

- Provide a unified platform for European robotics competitions
- Enable seamless team formation and management
- Streamline competition registration workflows
- Deliver real-time updates and live streaming capabilities
- Offer administrative tools for competition organizers

---

## Architecture

The project follows a monorepo structure with clear separation between frontend and backend:

```
RobEurope/
├── backend/           # Express.js API server
│   ├── controller/    # Business logic handlers
│   ├── middleware/    # Authentication, validation, rate limiting
│   ├── models/        # Sequelize ORM models
│   ├── routes/        # API route definitions
│   ├── utils/         # Helper functions and services
│   └── views/         # EJS templates for admin panel
├── frontend/          # React SPA (Vite)
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── context/     # React context providers
│   │   ├── hooks/       # Custom React hooks
│   │   ├── pages/       # Route-level components
│   │   └── lib/         # API client and utilities
│   └── public/        # Static assets
├── docs/              # Project documentation
└── docker-compose.yml # Infrastructure services
```

For detailed architecture documentation, see [docs/architecture.md](docs/architecture.md).

---

## Features

### User Management
- User registration with email verification
- OAuth support (Google, GitHub, Apple)
- Profile management with avatar uploads
- Password recovery via email

### Team Management
- Create and manage teams
- Invite members via email or direct link
- Team chat functionality
- Collaborative robot file editing

### Competitions
- Browse active competitions
- Team registration with approval workflow
- Live streaming integration
- Real-time notifications

### Administration
- Full CRUD operations via admin panel
- LDAP user directory integration
- Redis session management interface
- System activity logging

---

## Technology Stack

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js 18+ | Runtime environment |
| Express.js | Web framework |
| Sequelize | ORM for MySQL |
| Socket.IO | Real-time communication |
| Passport.js | Authentication strategies |
| Redis | Session storage and caching |
| OpenLDAP | Directory services |

### Frontend
| Technology | Purpose |
|------------|---------|
| React 19 | UI library |
| Vite | Build tool and dev server |
| TailwindCSS | Utility-first CSS |
| Radix UI | Accessible component primitives |
| Monaco Editor | Code editing capabilities |
| i18next | Internationalization |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Docker Compose | Multi-container orchestration |
| MySQL | Primary database |
| Redis | Session and cache storage |
| OpenLDAP | User directory |

---

## Prerequisites

Before installation, ensure you have the following:

- **Node.js** version 18.0.0 or higher
- **npm** or **yarn** package manager
- **Docker** and **Docker Compose**
- **MySQL** 8.x (local or managed service)
- **Git** for version control

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/s-pl/RobEurope.git
cd RobEurope
```

### 2. Start Infrastructure Services

```bash
docker-compose up -d
```

This starts OpenLDAP and Redis containers.

### 3. Install Dependencies

```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### 4. Configure Environment

Create a `.env` file in the `backend/` directory. See [Configuration](#configuration) for details.

### 5. Run Database Migrations

```bash
cd backend
npm run migrate
```

### 6. Start Development Servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

---

## Configuration

Create `backend/.env` with the following variables:

```env
# Server
PORT=85
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=robeurope
DB_USER=root
DB_PASS=your_password

# Security
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret

# LDAP
LDAP_URL=ldap://localhost:389
LDAP_BIND_DN=cn=admin,dc=robeurope,dc=samuelponce,dc=es
LDAP_BIND_PASSWORD=adminpassword
LDAP_BASE_DN=dc=robeurope,dc=samuelponce,dc=es
LDAP_USER_DN=ou=users

# Redis
REDIS_URL=redis://localhost:6379

# Push Notifications (VAPID)
VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key

# Email (Resend)
RESEND_API_KEY=your_resend_api_key
```

---

## Usage

### Development

```bash
# Run backend with hot reload
npm run dev

# Run frontend with HMR
npm --prefix frontend run dev

# Run tests
npm --prefix backend test
npm --prefix frontend test
```

### Production

```bash
# Build frontend
npm --prefix frontend run build

# Start production server
npm --prefix backend start
```

---

## Documentation

Complete documentation is available in the [docs/](docs/) directory:

| Document | Description |
|----------|-------------|
| [Architecture](docs/architecture.md) | System design and component overview |
| [Backend Guide](docs/backend.md) | API development and structure |
| [Frontend Guide](docs/frontend.md) | React application architecture |
| [Database Schema](docs/database.md) | ERD diagrams and model relationships |
| [API Reference](docs/api.md) | REST endpoint documentation |
| [Deployment](docs/deployment.md) | Production deployment guide |
| [Contributing](docs/contributing.md) | Development workflow |

---

## API Reference

The API is documented using Swagger/OpenAPI. Access the interactive documentation at:

```
http://localhost:85/api-docs
```

Quick reference for main endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | User authentication |
| GET | `/api/competitions` | List competitions |
| GET | `/api/teams` | List teams |
| POST | `/api/registrations` | Register for competition |

See [docs/api.md](docs/api.md) for complete API documentation.

---

## Contributing

Contributions are welcome. Please read [docs/contributing.md](docs/contributing.md) for guidelines.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -am 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

## Acknowledgments

- All contributors and participants in the RobEurope community
- Open source projects that made this platform possible

---

## Support

For questions or issues:

- Open an issue on [GitHub Issues](https://github.com/s-pl/RobEurope/issues)
- Visit the [DeepWiki documentation](https://deepwiki.com/s-pl/RobEurope)

---

## Notes

- The LDAP admin panel is accessible via the administration interface
- Some translations are still in progress (you may see keys like `nav.posts`)
- DNS configuration is managed externally via IONOS
- The mail service handles password recovery functionality
