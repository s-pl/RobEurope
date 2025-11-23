# Development and Deployment Guide

## Development Environment Setup

### Prerequisites

Before setting up the development environment, ensure you have the following installed:

- **Node.js**: Version 18.0 or higher (with ESM support)
- **MySQL**: Version 8.0 or higher
- **Git**: For version control
- **npm** or **yarn**: Package manager

### Environment Configuration

1. **Clone the repository**
```bash
git clone https://github.com/s-pl/RobEurope
cd RobEurope
```

2. **Install dependencies**
```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../front-end
npm install
```

3. **Database setup**
```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE robeurope;
EXIT;

# Configure environment variables
cd ../backend
cp .env.example .env
```

Edit `.env` file with your database credentials:
```env

PORT=85
DB_HOST=
DB_PORT=25060
DB_NAME=defaultdb
DB_USER=doadmin
DB_PASS=
JWT_SECRET=
NODE_ENV=development



```

4. **Database initialization**
```bash
# Run migrations
npm run migrate

# Seed initial data
npm run seed
```

## Teams feature (backend quick reference)

- Crear equipo: `POST /api/teams` (auth). El creador pasa a ser owner.
- Invitar: `POST /api/teams/:id/invite` (owner).
- Aceptar invitación: `POST /api/teams/invitations/accept` (auth), body `{ token }`.
- Solicitar unirse: `POST /api/teams/:id/requests` (auth).
- Aprobar solicitud: `POST /api/teams/requests/:requestId/approve` (owner).
- Registrar equipo en competición: `POST /api/teams/:id/register-competition` (owner).

## Notificaciones

- REST: `GET /api/notifications?user_id=<uuid>`
- Realtime opcional: canal Socket.IO `notification:{userId}`
- Marcar como leída: `PUT /api/notifications/:id` body `{ is_read: true }`

## Dark Mode

The application supports Dark Mode.
- It uses `tailwind` with `darkMode: 'class'`.
- The theme is managed by `ThemeContext` and persisted in `localStorage` (`vite-ui-theme`).
- Toggle button is available in the Navbar.

## Testing

### Backend
The backend uses `vitest` for testing.
```bash
cd backend
npm test
```

### Frontend
The frontend is set up for testing but requires dependencies to be installed (`vitest`, `@testing-library/react`, `jsdom`).
```bash
cd frontend
npm install -D vitest @testing-library/react jsdom @testing-library/jest-dom
npm test
```

5. **Start development servers**
```bash
# Terminal 1: Backend server
cd backend
npm run dev

# Terminal 2: Frontend server
cd ../front-end
npm run dev
```

### Development Workflow

#### Testing
```bash
# Run all tests
npm test


#### Database Management
```bash
# Create new migration
npx sequelize-cli migration:generate --name create-new-table

# Run pending migrations
npm run migrate

# Rollback last migration
npm run migrate:undo

# Create new seeder
npx sequelize-cli seed:generate --name seed-new-data

# Run seeders
npm run seed
```

## Project Structure

```
RobEurope/
├── backend/
│   ├── controller/          # Request handlers
│   ├── models/             # Sequelize models
│   ├── routes/             # API route definitions
│   ├── middleware/         # Express middleware
│   ├── utils/              # Utility functions
│   ├── migrations/         # Database migrations
│   ├── seeders/            # Database seeders
│   ├── __tests__/          # Test files
│   ├── uploads/            # File uploads directory
│   └── public/             # Static files
├── front-end/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── styles/         # CSS styles
│   │   └── assets/         # Static assets
│   └── public/             # Public assets
├── docs/                   # Documentation
└── img/                    # Project images
```

## API Development

### Creating New Endpoints

1. **Define the route** in `routes/api/your-feature.route.js`
```javascript
import express from 'express';
import * as controller from '../../controller/your-feature.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', authenticate, controller.getAll);
router.post('/', authenticate, controller.create);
router.get('/:id', authenticate, controller.getById);
router.put('/:id', authenticate, controller.update);
router.delete('/:id', authenticate, controller.delete);

export default router;
```

2. **Implement the controller** in `controller/your-feature.controller.js`
```javascript
export const getAll = async (req, res) => {
  try {
    // Business logic here
    res.json({ data: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

3. **Create/update the model** in `models/your-feature.model.js`
```javascript
export default (sequelize) => {
  const YourFeature = sequelize.define('YourFeature', {
    // Model definition
  });

  YourFeature.associate = (models) => {
    // Associations
  };

  return YourFeature;
};
```

4. **Add to main routes** in `routes/api/index.js`
```javascript
import yourFeatureRoutes from './your-feature.route.js';

// ... other imports

router.use('/your-feature', yourFeatureRoutes);
```

### Database Changes

1. **Create migration**
```bash
npx sequelize-cli migration:generate --name add-column-to-table
```

2. **Edit migration file**
```javascript
export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('table_name', 'column_name', {
    type: Sequelize.STRING,
    allowNull: true
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn('table_name', 'column_name');
}
```

3. **Update model** to include the new column

4. **Run migration**
```bash
npm run migrate
```

## Testing Strategy

### Unit Tests
- Test individual functions and modules
- Mock external dependencies
- Focus on business logic

### Integration Tests
- Test API endpoints
- Test database interactions
- Test middleware functionality

### Test Structure
```javascript
import request from 'supertest';
import app from '../index.js';

describe('API Tests', () => {
  it('should return 200 for GET /api/test', async () => {
    const response = await request(app)
      .get('/api/test')
      .expect(200);
  });
});
```
