# Development Guide

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm 9+

### Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Copy environment variables: `cp .env.example .env`
4. Configure your `.env` file with appropriate values
5. Run database migrations: `npm run migrate`
6. Start development server: `npm run dev`

## Development Workflow

### Code Style
- ESLint for linting: `npm run lint`
- Prettier for formatting: `npm run lint:fix`
- Follow existing patterns in the codebase

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run only unit tests
npm run test:backend -- --testPathPattern="unit"
```

### Git Workflow
1. Create feature branch from `main`
2. Make changes following coding standards
3. Write/update tests
4. Update documentation if needed
5. Commit with conventional commits
6. Push and create PR

### Database Changes
1. Create new migration: `touch backend/src/db/migrations/XXX_description.sql`
2. Write SQL changes
3. Run migration: `npm run migrate:up`
4. Test rollback: `npm run migrate:down`

## Project Structure

### Backend (`/backend`)
- `src/routes/` - API endpoints
- `src/services/` - Business logic
- `src/middleware/` - Express middleware
- `src/utils/` - Utility functions
- `src/db/` - Database configuration and migrations

### Frontend (`/frontend`)
- `src/app/` - Next.js app router pages
- `src/components/` - Reusable React components
- `src/lib/` - Utility functions
- `src/styles/` - Global styles

## API Development

### Adding New Endpoints
1. Create route file in `backend/src/routes/`
2. Add validation schema in `backend/src/middleware/validation.js`
3. Implement business logic in `backend/src/services/`
4. Add tests in `backend/tests/`
5. Update API documentation

### Error Handling
- Use middleware error handler
- Return consistent error format
- Log errors with correlation IDs

## Environment Variables
See `.env.example` for all available configuration options.

## Debugging
- Backend logs in `backend/logs/`
- Use correlation IDs to trace requests
- Enable `DEBUG=*` for verbose logging

## Common Tasks

### Adding a New Service
```javascript
// backend/src/services/newService.js
class NewService {
  async method() {
    // Implementation
  }
}
module.exports = new NewService();
```

### Adding Validation
```javascript
// backend/src/middleware/validation.js
validationSchemas.newRoute = {
  create: {
    body: Joi.object({
      field: Joi.string().required()
    })
  }
};
```

## Troubleshooting

### Tests Failing
- Ensure test database is running
- Check for missing environment variables
- Run `npm install` to ensure all dependencies are installed

### Lint Errors
- Run `npm run lint:fix` to auto-fix
- Check `.eslintrc.js` for rules

### Database Connection Issues
- Verify PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Ensure database exists: `createdb clubos_dev`

## Resources
- [API Documentation](../API/README.md)
- [Architecture Overview](../ARCHITECTURE/README.md)
- [Testing Strategy](../../TESTING_STRATEGY.md)