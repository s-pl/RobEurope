# Contributing Guide

[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)](https://github.com/s-pl/RobEurope/pulls)
[![Code Style](https://img.shields.io/badge/code_style-eslint-4B32C3)](https://eslint.org/)
[![Conventional Commits](https://img.shields.io/badge/commits-conventional-FE5196?logo=conventionalcommits&logoColor=white)](https://www.conventionalcommits.org/)

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)
- [Issue Reporting](#issue-reporting)

---

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment. We expect all contributors to:

- Be respectful and considerate in all interactions
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

---

## Getting Started

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- Git
- MySQL 8.x
- A code editor (VS Code recommended)

### Setup Development Environment

```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/RobEurope.git
cd RobEurope

# Add upstream remote
git remote add upstream https://github.com/s-pl/RobEurope.git

# Start infrastructure services
docker-compose up -d

# Install backend dependencies
cd backend
npm install

# Copy environment template
cp .env.example .env
# Edit .env with your local configuration

# Run migrations
npm run migrate

# Install frontend dependencies
cd ../frontend
npm install

# Start development servers
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

---

## Development Workflow

### Branch Strategy

```mermaid
gitgraph
    commit id: "main"
    branch develop
    commit id: "develop"
    branch feature/new-feature
    commit id: "work"
    commit id: "more work"
    checkout develop
    merge feature/new-feature
    checkout main
    merge develop tag: "v1.0.0"
```

### Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/description` | `feature/team-chat` |
| Bug Fix | `fix/description` | `fix/login-redirect` |
| Hotfix | `hotfix/description` | `hotfix/security-patch` |
| Documentation | `docs/description` | `docs/api-reference` |
| Refactor | `refactor/description` | `refactor/auth-middleware` |

### Workflow Steps

1. **Sync with upstream**
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature
   ```

3. **Make changes and commit**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

4. **Push and create PR**
   ```bash
   git push origin feature/your-feature
   ```

---

## Code Standards

### JavaScript/JSX Style

We use ESLint for code linting. Configuration is in `eslint.config.js`.

```bash
# Run linter
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

### General Guidelines

- Use ES6+ syntax
- Prefer `const` over `let`, avoid `var`
- Use meaningful variable and function names
- Keep functions small and focused
- Add JSDoc comments for public APIs
- Handle errors appropriately

### Backend Conventions

```javascript
// Controller pattern
export const createResource = async (req, res) => {
  try {
    // 1. Validate input
    const { field } = req.body;
    if (!field) {
      return res.status(400).json({ error: 'Field is required' });
    }

    // 2. Business logic
    const resource = await Model.create({ field });

    // 3. Logging
    await SystemLogger.logCreate('Resource', resource.id, { field }, req);

    // 4. Response
    return res.status(201).json({ resource });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
```

### Frontend Conventions

```jsx
// Component pattern
import { useState, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';

/**
 * ComponentName - Brief description
 * @param {Object} props - Component props
 * @param {string} props.id - Resource ID
 */
const ComponentName = ({ id }) => {
  const [data, setData] = useState(null);
  const { request, loading, error } = useApi();

  useEffect(() => {
    const fetchData = async () => {
      const result = await request('get', `/resource/${id}`);
      setData(result);
    };
    fetchData();
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div className="container">
      {/* Component content */}
    </div>
  );
};

export default ComponentName;
```

---

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Commit Message Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Code style changes (formatting, etc.) |
| `refactor` | Code refactoring |
| `perf` | Performance improvements |
| `test` | Adding or updating tests |
| `chore` | Build process or auxiliary tool changes |
| `ci` | CI configuration changes |

### Examples

```bash
# Feature
git commit -m "feat(teams): add team invitation system"

# Bug fix
git commit -m "fix(auth): resolve session timeout issue"

# Documentation
git commit -m "docs(api): update authentication endpoints"

# Breaking change
git commit -m "feat(api)!: change authentication to session-based

BREAKING CHANGE: JWT tokens are no longer supported"
```

---

## Pull Request Process

### Before Submitting

1. **Ensure tests pass**
   ```bash
   npm test
   ```

2. **Run linter**
   ```bash
   npm run lint
   ```

3. **Update documentation** if needed

4. **Sync with upstream**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How has this been tested?

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests pass
```

### Review Process

1. Create PR against `main` branch
2. Request review from maintainers
3. Address review feedback
4. Squash commits if requested
5. Maintainer merges after approval

---

## Testing

### Backend Testing

```bash
# Run all tests
npm test

# Run with verbose output
npm run test:verbose

# Run specific test file
npx vitest run auth.test.js
```

### Frontend Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run coverage

# Run specific test
npx vitest run Login.test.jsx
```

### Writing Tests

```javascript
// Backend test example
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index.js';

describe('GET /api/resource', () => {
  it('returns list of resources', async () => {
    const res = await request(app)
      .get('/api/resource')
      .expect(200);
    
    expect(res.body).toHaveProperty('resources');
    expect(Array.isArray(res.body.resources)).toBe(true);
  });
});
```

```jsx
// Frontend test example
import { render, screen } from '@testing-library/react';
import Component from '../Component';

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component />);
    expect(screen.getByText('Expected text')).toBeInTheDocument();
  });
});
```

---

## Documentation

### When to Update Documentation

- Adding new features
- Changing API endpoints
- Modifying database schema
- Updating configuration options
- Changing deployment procedures

### Documentation Files

| File | Content |
|------|---------|
| `README.md` | Project overview |
| `docs/architecture.md` | System architecture |
| `docs/backend.md` | Backend development |
| `docs/frontend.md` | Frontend development |
| `docs/database.md` | Database schema |
| `docs/api.md` | API reference |
| `docs/deployment.md` | Deployment guide |
| `docs/contributing.md` | This file |

### JSDoc Comments

```javascript
/**
 * Creates a new resource in the database.
 *
 * @param {Object} data - Resource data
 * @param {string} data.name - Resource name
 * @param {string} [data.description] - Optional description
 * @returns {Promise<Object>} Created resource
 * @throws {Error} If validation fails
 *
 * @example
 * const resource = await createResource({ name: 'Test' });
 */
async function createResource(data) {
  // Implementation
}
```

---

## Issue Reporting

### Bug Reports

When reporting bugs, include:

1. **Description** - Clear description of the issue
2. **Steps to reproduce** - Exact steps to reproduce
3. **Expected behavior** - What should happen
4. **Actual behavior** - What actually happens
5. **Environment** - OS, Node version, browser
6. **Screenshots** - If applicable
7. **Logs** - Relevant error messages

### Feature Requests

When requesting features, include:

1. **Problem statement** - What problem does it solve?
2. **Proposed solution** - How should it work?
3. **Alternatives considered** - Other approaches
4. **Additional context** - Any other information

### Issue Labels

| Label | Description |
|-------|-------------|
| `bug` | Something isn't working |
| `feature` | New feature request |
| `documentation` | Documentation improvements |
| `good first issue` | Good for newcomers |
| `help wanted` | Extra attention needed |
| `priority: high` | High priority issue |
| `wontfix` | Will not be worked on |

---

## Questions?

If you have questions about contributing:

1. Check existing [documentation](../README.md)
2. Search [existing issues](https://github.com/s-pl/RobEurope/issues)
3. Open a new issue with the `question` label
4. Contact the maintainers

---

Thank you for contributing to RobEurope!
