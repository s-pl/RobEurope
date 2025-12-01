# RobEurope Platform

Comprehensive platform for managing robotics competitions in Europe. This system allows users to register, form teams, sign up for competitions, and follow live events.

## Features

- **User Management**: Registration, authentication, and user profiles.
- **Teams**: Team creation, member invitations, and role management.
- **Competitions**: Event calendar, registrations, and status tracking.
- **Admin Panel**: Complete interface for platform management.
- **LDAP Integration**: Centralized identity management with OpenLDAP.
- **Docker Infrastructure**: Containerized deployment of auxiliary services (LDAP, DNS).

## Technologies

- **Backend**: Node.js, Express.js, Socket.IO
- **Database**: MySQL (Sequelize ORM), Redis (Session & Real-time State)
- **Frontend**: React (Vite), TailwindCSS, Monaco Editor
- **Infrastructure**: Docker, Docker Compose
- **Services**: OpenLDAP, Redis

## Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose
- MySQL (or use managed service)

## Installation and Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/s-pl/RobEurope.git
   cd RobEurope
   ```

2. **Configure Environment Variables**
   Create a `.env` file in the `backend` with the following content:

   PORT=
DB_HOST=
DB_PORT=
DB_NAME=
DB_USER=
DB_PASS=
JWT_SECRET=
NODE_ENV=
LDAP_URL=
LDAP_BIND_DN=cn=
LDAP_BIND_PASSWORD=
LDAP_BASE_DN=
LDAP_USER_DN=
REDIS_URL=redis://localhost:6379









3. **Start Infrastructure Services**
   ```bash
   docker-compose up -d
   ```

4. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

5. **Initialize Database and LDAP**
   ```bash
   npm run migrate
   node init-ldap.js
   ```

6. **Start Development Server**
   ```bash
   # Backend
   cd backend
   npm run dev
   
   # Frontend (in a new terminal)
   cd frontend
   npm run dev
   ```

## Features

- **Collaborative IDE**: Real-time code editor with multi-language support, file management, and presence indicators (powered by Monaco Editor & Socket.IO).
- **User Management**: Registration, authentication, and user profiles.
- **Teams**: Team creation, member invitations, and role management.
- **Competitions**: Event calendar, registrations, and status tracking.
- **Admin Panel**: Complete interface for platform management with system health monitoring (CPU, RAM, DB Status).
- **LDAP Integration**: Centralized identity management with OpenLDAP.
- **Docker Infrastructure**: Containerized deployment of auxiliary services (LDAP, DNS, Redis).

## Documentation

Detailed documentation is located in the `/docs` folder:

- [Diagrams (ERD, Classes, Use Cases)](docs/diagrams.md)
- [LDAP Setup](docs/ldap-bind9-setup.md)
- [Admin Panel Manual](docs/admin-panel.md)
- [API Documentation](api.robeurope.samuelponce.es/api-docs) (Swagger/OpenAPI)

## Contributing

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## License

Distributed under the MIT License. See `LICENSE` for more information.
