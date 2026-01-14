# Architecture Overview

[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/express-4.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/react-19.x-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![MySQL](https://img.shields.io/badge/mysql-8.x-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)

---

## Table of Contents

- [System Overview](#system-overview)
- [High-Level Architecture](#high-level-architecture)
- [Component Diagram](#component-diagram)
- [Data Flow](#data-flow)
- [Technology Decisions](#technology-decisions)
- [Security Architecture](#security-architecture)
- [Scalability Considerations](#scalability-considerations)

---

## System Overview

RobEurope is built as a monorepo containing two main applications: a Node.js/Express backend API and a React/Vite frontend SPA. The system follows a client-server architecture with additional infrastructure services for authentication, caching, and real-time communication.

### Core Principles

1. **Separation of Concerns**: Clear boundaries between frontend, backend, and infrastructure
2. **RESTful Design**: API follows REST conventions with consistent resource naming
3. **Real-time Capabilities**: Socket.IO enables live updates and collaborative features
4. **Security First**: Session-based auth, CSRF protection, rate limiting, and LDAP integration

---

## High-Level Architecture

```mermaid
flowchart TB
    subgraph Client["Client Layer"]
        Browser["Web Browser"]
        PWA["PWA / Service Worker"]
    end

    subgraph Frontend["Frontend Application"]
        React["React 19 SPA"]
        Vite["Vite Dev Server"]
        Router["React Router"]
        Context["Context Providers"]
    end

    subgraph Backend["Backend Services"]
        Express["Express.js Server"]
        SocketIO["Socket.IO Server"]
        Passport["Passport.js Auth"]
        Sequelize["Sequelize ORM"]
    end

    subgraph Infrastructure["Infrastructure Layer"]
        MySQL[("MySQL Database")]
        Redis[("Redis Cache")]
        LDAP["OpenLDAP"]
    end

    subgraph External["External Services"]
        Resend["Resend Email API"]
        OAuth["OAuth Providers"]
    end

    Browser --> React
    PWA --> React
    React --> Express
    React --> SocketIO
    Express --> Sequelize
    Express --> Redis
    Express --> Passport
    Passport --> LDAP
    Passport --> OAuth
    Sequelize --> MySQL
    Express --> Resend
```

---

## Component Diagram

```mermaid
flowchart LR
    subgraph FE["Frontend Components"]
        Pages["Pages"]
        Components["UI Components"]
        Hooks["Custom Hooks"]
        Contexts["Context Providers"]
        APIClient["API Client"]
    end

    subgraph BE["Backend Components"]
        Routes["Route Handlers"]
        Controllers["Controllers"]
        Middleware["Middleware Stack"]
        Models["Sequelize Models"]
        Utils["Utility Services"]
    end

    subgraph MW["Middleware"]
        Auth["auth.middleware"]
        Rate["rateLimit.middleware"]
        Session["session.middleware"]
        Upload["upload.middleware"]
        Role["role.middleware"]
    end

    Pages --> Hooks
    Hooks --> APIClient
    APIClient --> Routes
    Routes --> Middleware
    Middleware --> Controllers
    Controllers --> Models
    Controllers --> Utils

    MW --> Middleware
```

---

## Data Flow

### Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Session Store
    participant Database

    User->>Frontend: Submit credentials
    Frontend->>Backend: POST /api/auth/login
    Backend->>Database: Validate user
    Database-->>Backend: User record
    Backend->>Session Store: Create session
    Session Store-->>Backend: Session ID
    Backend-->>Frontend: Set-Cookie + User data
    Frontend-->>User: Redirect to dashboard
```

### Real-time Updates Flow

```mermaid
sequenceDiagram
    participant Client A
    participant Socket Server
    participant Client B
    participant Redis

    Client A->>Socket Server: Connect (auth token)
    Socket Server->>Redis: Store connection
    Client A->>Socket Server: emit('team:update', data)
    Socket Server->>Redis: Publish event
    Socket Server->>Client B: emit('team:update', data)
```

### Competition Registration Flow

```mermaid
sequenceDiagram
    participant Team Leader
    participant Frontend
    participant Backend
    participant Database
    participant Admin

    Team Leader->>Frontend: Select competition
    Frontend->>Backend: POST /api/registrations
    Backend->>Database: Create registration (pending)
    Backend-->>Frontend: Registration created
    Frontend-->>Team Leader: Show pending status
    
    Admin->>Backend: PATCH /api/registrations/:id
    Backend->>Database: Update status (approved)
    Backend->>Team Leader: Push notification
```

---

## Technology Decisions

### Backend Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Runtime | Node.js 18+ | Non-blocking I/O, JavaScript ecosystem |
| Framework | Express.js | Mature, flexible, extensive middleware |
| ORM | Sequelize | Active record pattern, migrations support |
| Real-time | Socket.IO | Fallback transports, room management |
| Auth | Passport.js | Strategy pattern, OAuth integration |

### Frontend Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Library | React 19 | Component model, hooks, ecosystem |
| Build Tool | Vite | Fast HMR, ESM-native, optimized builds |
| Styling | TailwindCSS | Utility-first, no CSS conflicts |
| State | React Context | Built-in, sufficient for app scope |
| Routing | React Router | Declarative, nested routes |

### Infrastructure

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Database | MySQL 8 | ACID compliance, relational integrity |
| Cache | Redis | Session storage, pub/sub, fast access |
| Directory | OpenLDAP | Enterprise directory, standards compliant |
| Containers | Docker | Reproducible environments |

---

## Security Architecture

### Defense Layers

```mermaid
flowchart TB
    subgraph External["Perimeter"]
        Firewall["Firewall / Reverse Proxy"]
        HTTPS["TLS/HTTPS"]
    end

    subgraph App["Application Layer"]
        CORS["CORS Policy"]
        RateLimit["Rate Limiting"]
        Helmet["Security Headers"]
        CSRF["CSRF Protection"]
    end

    subgraph Auth["Authentication"]
        Session["Session Management"]
        Password["Password Hashing"]
        OAuth2["OAuth 2.0"]
        LDAP["LDAP Bind"]
    end

    subgraph Data["Data Layer"]
        ORM["Parameterized Queries"]
        Validation["Input Validation"]
        Encryption["Data Encryption"]
    end

    External --> App --> Auth --> Data
```

### Security Measures

1. **Transport Security**: All production traffic over HTTPS
2. **Session Management**: HTTP-only cookies, secure flag, SameSite policy
3. **Password Storage**: bcrypt with cost factor 10
4. **Input Validation**: Server-side validation on all inputs
5. **Rate Limiting**: Request throttling per IP and user
6. **CORS**: Allowlist-based origin validation
7. **Headers**: Helmet middleware for security headers

---

## Scalability Considerations

### Current Architecture Limits

- Single server deployment
- Session storage in Redis (horizontal scaling ready)
- Database connection pooling via Sequelize

### Future Scaling Path

```mermaid
flowchart TB
    subgraph LB["Load Balancer"]
        Nginx["NGINX / HAProxy"]
    end

    subgraph App["Application Tier"]
        Node1["Node.js Instance 1"]
        Node2["Node.js Instance 2"]
        NodeN["Node.js Instance N"]
    end

    subgraph Cache["Cache Tier"]
        Redis1["Redis Primary"]
        Redis2["Redis Replica"]
    end

    subgraph DB["Database Tier"]
        MySQL1["MySQL Primary"]
        MySQL2["MySQL Replica"]
    end

    Nginx --> Node1
    Nginx --> Node2
    Nginx --> NodeN
    Node1 --> Redis1
    Node2 --> Redis1
    NodeN --> Redis1
    Redis1 --> Redis2
    Node1 --> MySQL1
    Node2 --> MySQL1
    NodeN --> MySQL1
    MySQL1 --> MySQL2
```

### Scaling Strategies

1. **Horizontal Scaling**: Add Node.js instances behind load balancer
2. **Session Affinity**: Redis enables stateless Node.js instances
3. **Database Read Replicas**: Offload read queries
4. **CDN**: Static asset delivery via CDN
5. **Queue System**: Background job processing for heavy tasks

---

## Directory Structure

```
RobEurope/
├── backend/
│   ├── config/           # Configuration files
│   ├── controller/       # Request handlers
│   ├── middleware/       # Express middleware
│   ├── migrations/       # Database migrations
│   ├── models/           # Sequelize models
│   ├── routes/           # API route definitions
│   ├── seeders/          # Database seeders
│   ├── utils/            # Helper functions
│   ├── views/            # EJS templates
│   └── index.js          # Application entry point
├── frontend/
│   ├── public/           # Static assets
│   └── src/
│       ├── components/   # React components
│       ├── context/      # Context providers
│       ├── hooks/        # Custom hooks
│       ├── lib/          # Utilities
│       └── pages/        # Route components
├── docs/                 # Documentation
└── docker-compose.yml    # Infrastructure
```

---

## Related Documentation

- [Backend Guide](backend.md)
- [Frontend Guide](frontend.md)
- [Database Schema](database.md)
- [API Reference](api.md)
- [Deployment Guide](deployment.md)
