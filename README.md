# College Student Directory API

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18%2B-green" alt="Node.js Version" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue" alt="TypeScript Version" />
  <img src="https://img.shields.io/badge/NestJS-10.0-red" alt="NestJS Version" />
  <img src="https://img.shields.io/badge/Prisma-5.0-purple" alt="Prisma Version" />
  <img src="https://img.shields.io/badge/MySQL-8.0-orange" alt="MySQL Version" />
</p>

<p align="center">
  A comprehensive REST API for managing college students, courses, attendance tracking, and ID card generation. Built with NestJS, TypeScript, and modern development practices.
</p>

## 🚀 Features

- **Student Management**: Complete CRUD operations with enrollment number generation
- **Course Management**: Course creation, updates, and student enrollment tracking
- **Attendance System**: Mark attendance, bulk operations, and detailed reporting
- **ID Card Generation**: Automated ID card creation with student information
- **File Upload**: Profile images, documents with validation and optimization
- **Authentication**: JWT-based authentication with role-based access control
- **Performance Monitoring**: Built-in performance tracking and optimization
- **Comprehensive Testing**: Unit, integration, e2e, performance, and security tests
- **API Documentation**: Interactive Swagger documentation with examples
- **Developer Tools**: Enhanced debugging, logging, and development utilities

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## ⚡ Quick Start

### Prerequisites

- Node.js 18+
- MySQL 8.0+
- npm or yarn

### 1. Clone and Install

```bash
git clone <repository-url>
cd userDirectory
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your database credentials
```

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma db push

# Seed database (optional)
npm run seed
```

### 4. Start Development Server

```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`
API Documentation: `http://localhost:3000/api/docs`

### Detailed Installation

#### 1. System Requirements

- **Node.js**: 18.0 or higher
- **MySQL**: 8.0 or higher
- **npm**: 8.0 or higher (or yarn 1.22+)
- **Git**: Latest version

#### 2. Clone Repository

```bash
git clone <repository-url>
cd userDirectory
```

#### 3. Install Dependencies

```bash
npm install
# or
yarn install
```

#### 4. Database Setup

Create a MySQL database:

```sql
CREATE DATABASE college_directory;
CREATE USER 'college_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON college_directory.* TO 'college_user'@'localhost';
FLUSH PRIVILEGES;
```

#### 5. Environment Configuration

Copy the example environment file and configure:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
DATABASE_URL="mysql://college_user:secure_password@localhost:3306/college_directory"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
PORT=3000
NODE_ENV="development"
```

#### 6. Database Migration

```bash
# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Optional: Seed with sample data
npm run seed
```

## ⚙️ Configuration

### Quick Configuration Setup

Use the interactive configuration setup:

```bash
npm run config:setup
```

This will guide you through:

- Environment detection
- Database configuration
- Security settings
- Optional services (Redis, S3, Email)
- Secret generation
- Configuration validation

### Environment Management

The application supports multiple environments with automatic configuration:

```bash
# Switch environments
npm run env:dev      # Development
npm run env:staging  # Staging
npm run env:prod     # Production
npm run env:test     # Testing

# Validate configuration
npm run config:validate [environment]

# Generate secure secrets
npm run config:generate [environment]

# Compare configurations
npm run config:compare development production

# Check configuration health
npm run config:health
```

### Core Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment (development/staging/production/test) | development | ✅ |
| `DATABASE_URL` | Database connection string | - | ✅ |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | - | ✅ |
| `PORT` | Server port | 3000 | ❌ |
| `HOST` | Server host | 0.0.0.0 | ❌ |
| `BASE_URL` | API base URL | auto-detected | ❌ |
| `FRONTEND_URL` | Frontend URL for CORS | <http://localhost:3001> | ❌ |

### Advanced Configuration

#### Security Settings

```env
CORS_ORIGINS="https://yourdomain.com,https://admin.yourdomain.com"
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=900000
HELMET_ENABLED=true
BCRYPT_ROUNDS=12
```

#### Cache Configuration

```env
CACHE_PROVIDER=redis  # memory, redis
REDIS_URL="redis://localhost:6379"
CACHE_TTL=300
CACHE_MAX_SIZE=1000
```

#### File Storage

```env
FILE_STORAGE_PROVIDER=s3  # local, s3, gcs, azure
AWS_ACCESS_KEY_ID="your-key"
AWS_SECRET_ACCESS_KEY="your-secret"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-bucket"
```

#### Feature Flags

```env
ENABLE_SWAGGER=true
ENABLE_METRICS=true
ENABLE_AUDIT_LOG=true
ENABLE_DEBUG_ROUTES=false  # Only in development
```

### Environment-Specific Configurations

The application automatically applies environment-specific settings:

- **Development**: Debug logging, Swagger enabled, relaxed security
- **Staging**: Production-like with testing features
- **Production**: Maximum security, minimal logging, monitoring enabled
- **Test**: Fast execution, minimal features, test data

### Configuration Validation

Automatic validation ensures:

- Required variables are present
- Secrets meet security requirements
- Environment-specific rules are enforced
- Service dependencies are configured
- Production security standards are met

### Database Configuration

Enhanced database management:

- **Multi-provider support**: MySQL, PostgreSQL
- **Connection pooling**: Environment-optimized pools
- **SSL support**: Automatic SSL in production
- **Query optimization**: Built-in caching and optimization
- **Health monitoring**: Connection health checks

## 🚀 Development

### Available Scripts

```bash
# Development
npm run start:dev          # Start with hot reload
npm run start:debug        # Start with debugging
npm run start:prod         # Production mode

# Building
npm run build              # Build for production
npm run build:watch        # Build with watch mode

# Database
npm run db:generate        # Generate Prisma client
npm run db:push           # Push schema changes
npm run db:migrate        # Run migrations
npm run db:seed           # Seed database
npm run db:studio         # Open Prisma Studio

# Code Quality
npm run lint              # Run ESLint
npm run lint:fix          # Fix ESLint issues
npm run format            # Format with Prettier
npm run format:check      # Check formatting

# Development
npm run start:dev         # Start in development mode
npm run start:debug       # Start in debug mode
npm run lint              # Run ESLint
```

## 📚 API Documentation

### Interactive Documentation

The API includes comprehensive interactive documentation powered by Swagger:

- **Development**: `http://localhost:3000/api/docs`
- **Features**: Try endpoints, view schemas, authentication testing

### Documentation Files

- **[API Examples](docs/api-examples.md)**: Complete API usage examples
- **[Testing Guide](docs/api-testing-guide.md)**: API testing instructions
- **[Testing Documentation](docs/testing-guide.md)**: Comprehensive testing guide

### Key Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/v1/auth/login` | POST | Admin login | ❌ |
| `/api/v1/students` | GET | List students | ✅ |
| `/api/v1/students` | POST | Create student | ✅ |
| `/api/v1/students/{id}` | GET | Get student | ✅ |
| `/api/v1/students/{id}` | PATCH | Update student | ✅ |
| `/api/v1/students/{id}` | DELETE | Delete student | ✅ |
| `/api/v1/courses` | GET | List courses | ✅ |
| `/api/v1/attendance` | POST | Mark attendance | ✅ |
| `/api/v1/upload/profile` | POST | Upload file | ✅ |

## 🚀 Deployment

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm run start:prod
```

### Environment Setup

1. **Production Environment Variables**:

   ```env
   NODE_ENV=production
   DATABASE_URL=mysql://user:pass@host:port/db
   JWT_SECRET=your-production-secret
   ```

2. **Database Migration**:

   ```bash
   npx prisma migrate deploy
   ```

3. **Process Management**:

   ```bash
   # Using PM2
   npm install -g pm2
   pm2 start dist/main.js --name college-api
   ```

## 🤝 Contributing

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make changes and test**: `npm run test:all`
4. **Commit changes**: `git commit -m 'Add amazing feature'`
5. **Push to branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration
- **Prettier**: Code formatting
- **Husky**: Pre-commit hooks
- **Conventional Commits**: Commit message format

## 📄 License

This project is [MIT licensed](LICENSE).
