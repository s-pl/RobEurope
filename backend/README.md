# RobEurope Platform

Comprehensive platform for managing robotics competitions in Europe. This system allows users to register, form teams, sign up for competitions, and follow live events.

##  Features

- **User Management**: Registration, authentication, and user profiles.
- **Teams**: Team creation, member invitation, and role management.
- **Competitions**: Event calendar, registrations, and status tracking.
- **Admin Panel**: Complete interface to manage the platform.
- **LDAP Integration**: Centralized identity management with OpenLDAP.
- **Docker Infrastructure**: Containerized deployment of auxiliary services (LDAP, DNS).

##  Technologies

- **Backend**: Node.js, Express.js
- **Database**: MySQL (Sequelize ORM)
- **Frontend**: EJS (Server-Side Rendering for Admin), React (Client - *in development*)
- **Infrastructure**: Docker, Docker Compose
- **Services**: OpenLDAP, Bind9

##  Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose
- MySQL (or use a managed service)

##  Installation and Configuration

1.  **Clone the repository**
    `ash
    git clone https://github.com/s-pl/RobEurope.git
    cd RobEurope
    `

2.  **Configure Environment Variables**
    Create a \.env\ file in the \ackend\ folder based on the example provided in the documentation.

3.  **Start Infrastructure Services**
    `ash
    docker-compose up -d
    `

4.  **Install Backend Dependencies**
    `ash
    cd backend
    npm install
    `

5.  **Initialize Database and LDAP**
    `ash
    npm run migrate
    node init-ldap.js
    `

6.  **Start Development Server**
    `ash
    npm run dev
    `

##  Documentation

Detailed documentation can be found in the \/docs\ folder:

- [Diagrams (ERD, Classes, Use Cases)](docs/diagrams.md)
- [LDAP and Bind9 Configuration](docs/ldap-bind9-setup.md)
- [Admin Panel Manual](docs/admin-panel.md)
- [API Documentation](docs/api.md) (Swagger/OpenAPI)

##  Contribution

1.  Fork the project.
2.  Create your feature branch (\git checkout -b feature/AmazingFeature\).
3.  Commit your changes (\git commit -m 'Add some AmazingFeature'\).
4.  Push to the branch (\git push origin feature/AmazingFeature\).
5.  Open a Pull Request.

##  License

Distributed under the MIT License. See \LICENSE\ for more information.
