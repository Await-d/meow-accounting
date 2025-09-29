# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Principles (CRITICAL - ALWAYS FOLLOW)

🚫 **不可使用模拟方案！！！**
- 所有操作必须使用真实的数据
- 所有监控数据必须来自真实的系统指标
- 所有终端操作必须是真实的容器exec会话

🚫 **不可使用简化方案！！！**
- 实现完整的错误处理和边缘情况
- 实现完整的性能优化和缓存机制
- 实现完整的安全验证和权限控制

🚫 **不可使用临时方案！！！**
- 所有实现必须是生产级质量
- 所有代码必须具备长期维护性
- 所有架构必须支持未来扩展需求

## Project Overview

喵呜记账是一个全栈家庭财务管理应用，集成了路由管理和性能监控功能。项目采用前后端分离架构，使用TypeScript开发。

## Development Commands

### Backend Development
```bash
cd backend
pnpm install          # Install dependencies
pnpm run dev          # Start development server with auto-reload
pnpm run build        # Build TypeScript to JavaScript
pnpm start            # Run production build
pnpm test             # Run tests
```

### Frontend Development
```bash
cd frontend
pnpm install          # Install dependencies
pnpm run dev          # Start Next.js development server
pnpm run build        # Build for production
pnpm start            # Start production server
pnpm run lint         # Run ESLint
```

### Docker Operations
```bash
# Build and run with Docker
docker build -t meow-accounting .
docker run -p 3000:3000 -p 3001:3001 -v ./data:/app/data -d meow-accounting

# Using Docker Compose
docker-compose up -d
docker-compose logs -f
docker-compose down
```

### Database Operations
```bash
# Initialize database
node dist/models/init-db.js

# Backup SQLite database
cp data/sqlite.db data/sqlite.db.bak
```

### API Testing
```bash
# Test API endpoints
curl -X GET http://localhost:3001/api/transactions -H "Authorization: Bearer <token>"
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"password123"}'
```

## Architecture Overview

### Backend Architecture (MVC Pattern)
- **Models** (`backend/src/models/`): Data structures and database operations
- **Controllers** (`backend/src/controllers/`): Request handling and business logic
- **Routes** (`backend/src/routes/`): API endpoint definitions
- **Middleware** (`backend/src/middleware/`): Authentication, validation, error handling
- **Database**: SQLite with optional Redis caching

### Frontend Architecture (Component-Based)
- **App Router** (`frontend/src/app/`): Next.js 14 App Router for routing
- **Components** (`frontend/src/components/`): Reusable UI components
- **Hooks** (`frontend/src/hooks/`): Custom React hooks for business logic
- **Utils** (`frontend/src/utils/` & `frontend/src/lib/`): Utility functions and API clients
- **Providers** (`frontend/src/providers/`): Context providers for global state

### Key Directories Structure

```
frontend/src/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main dashboard
│   ├── routes/           # Route management pages
│   ├── settings/         # Settings pages
│   └── transactions/     # Transaction management
├── components/           # Reusable components
│   ├── dashboard/       # Dashboard-specific components
│   ├── transactions/    # Transaction-specific components
│   └── ui/             # Generic UI components
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
└── utils/              # Helper functions

backend/src/
├── controllers/        # Request handlers
├── models/            # Data models and database operations
├── routes/            # API route definitions
├── middleware/        # Express middleware
├── validators/        # Input validation schemas
├── utils/             # Backend utilities
└── config/            # Configuration files
```

## Key Features & Components

### Core Financial Features
- **Transaction Management**: CRUD operations for income/expense tracking
- **Category System**: Hierarchical category organization
- **Family Management**: Multi-user family accounts with role-based permissions
- **Statistics & Analytics**: Charts and reports using Recharts
- **Data Import/Export**: CSV import/export functionality

### Route Management System
- **Route Analytics**: Performance monitoring and visualization
- **Route Optimization**: Intelligent routing suggestions
- **Route Prediction**: Machine learning-based route prediction
- **Performance Monitoring**: Real-time metrics collection

### Advanced Features
- **Custom Settings**: Theme, language, performance configurations
- **Cache Management**: Intelligent caching with TTL and size limits
- **PWA Support**: Progressive Web App with offline capabilities
- **Real-time Updates**: WebSocket-like updates using React Query

## Technology Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **UI Library**: NextUI
- **Styling**: Tailwind CSS
- **State Management**: React Query (@tanstack/react-query)
- **Charts**: Recharts, Chart.js
- **Forms**: React Hook Form + Zod validation
- **Animation**: Framer Motion

### Backend
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: SQLite (primary), Redis (optional caching)
- **Authentication**: JWT with bcrypt password hashing
- **API Documentation**: Swagger (swagger-jsdoc, swagger-ui-express)
- **Validation**: Zod schemas
- **Logging**: Winston

## API Design Patterns

### Standard Response Format
```typescript
{
  code: number;    // HTTP status code
  data?: any;      // Response payload
  message: string; // Human-readable message
}
```

### RESTful Conventions
- Use plural nouns for resources: `/api/transactions`, `/api/categories`
- HTTP methods: GET (read), POST (create), PUT (update), DELETE (delete)
- Query parameters for filtering: `?start_date=2025-01-01&category_id=1`
- Path parameters for specific resources: `/api/transactions/:id`

### Authentication Flow
1. Login/Register: `POST /api/auth/login` or `/api/auth/register`
2. Include JWT token in headers: `Authorization: Bearer <token>`
3. Token validation in auth middleware
4. User context available in `req.user`

## Development Guidelines

### Code Organization
- Follow MVC pattern in backend
- Use custom hooks for reusable frontend logic
- Implement proper error boundaries and loading states
- Use TypeScript strict mode for type safety

### Database Patterns
- Models handle all database operations
- Use transactions for data consistency
- Implement proper foreign key relationships
- Add indexes for query optimization

### Frontend Patterns
- Use React Query for server state management
- Implement proper loading and error states
- Use NextUI components consistently
- Follow responsive design principles

### Error Handling
- Backend: Centralized error middleware with proper HTTP status codes
- Frontend: Error boundaries and toast notifications
- Logging: Winston for backend, console for frontend development

## Testing & Deployment

### Local Development
1. Set up environment variables (copy `.env.example` to `.env`)
2. Start backend: `cd backend && pnpm run dev`
3. Start frontend: `cd frontend && pnpm run dev`
4. Access at http://localhost:3000 (frontend) and http://localhost:3001 (backend)

### Production Deployment
- Use Docker for containerization
- Environment variables must be properly configured
- Database initialization required for new deployments
- Health checks available at `/api/health`

### Performance Considerations
- Implement caching strategies (Redis, React Query)
- Use database indexes for frequent queries
- Optimize bundle size with Next.js
- Implement route-level code splitting

## Security Best Practices

- JWT tokens for authentication
- Password hashing with bcrypt
- Input validation with Zod schemas
- CORS configuration for API access
- Environment variables for sensitive data
- SQL injection prevention through parameterized queries

## Monitoring & Analytics

### Route Performance Monitoring
- Automatic route timing collection
- Error rate tracking
- Cache hit rate monitoring
- Performance report generation

### System Health
- Database connection monitoring
- Memory usage tracking
- Request/response time logging
- Error aggregation and alerting