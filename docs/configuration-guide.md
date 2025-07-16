# Configuration Guide

This guide provides comprehensive information about configuring the College Student Directory API for different environments.

## 🏗️ Configuration Architecture

The application uses a multi-layered configuration system:

1. **Environment Files**: `.env.{environment}` files for environment-specific settings
2. **Configuration Services**: Type-safe configuration management with validation
3. **Environment Detection**: Automatic environment detection and validation
4. **Runtime Validation**: Configuration validation at startup and runtime

## 📁 Configuration Files

### Environment Files

| File | Purpose | When to Use |
|------|---------|-------------|
| `.env` | Active configuration | Automatically loaded |
| `.env.development` | Development settings | Local development |
| `.env.staging` | Staging settings | Staging environment |
| `.env.production` | Production settings | Production deployment |
| `.env.test` | Test settings | Running tests |
| `.env.example` | Template file | Reference for required variables |

### Configuration Priority

The application loads configuration in this order (highest to lowest priority):

1. Environment variables
2. `.env.{NODE_ENV}` file
3. `.env.local` file
4. `.env` file
5. Default values

## 🚀 Quick Setup

### Automated Setup

Use the interactive setup script:

```bash
npm run config:setup
```

This will:
- Detect your environment
- Gather configuration interactively
- Generate secure secrets
- Create environment files
- Validate configuration
- Setup database (optional)

### Manual Setup

1. **Copy template**:
   ```bash
   cp .env.example .env
   ```

2. **Edit configuration**:
   ```bash
   nano .env
   ```

3. **Validate configuration**:
   ```bash
   npm run config:validate
   ```

## ⚙️ Configuration Variables

### Core Configuration

#### Environment
```env
NODE_ENV=development          # Environment: development, staging, production, test
PORT=3000                    # Server port
HOST=0.0.0.0                # Server host
BASE_URL=http://localhost:3000  # API base URL
FRONTEND_URL=http://localhost:3001  # Frontend URL
```

#### Database
```env
DATABASE_URL="mysql://user:pass@host:port/db"  # Database connection string
DATABASE_PROVIDER=mysql      # Database provider: mysql, postgresql
DB_CONNECTION_LIMIT=10       # Connection pool size
DB_ACQUIRE_TIMEOUT=60000     # Connection timeout (ms)
DB_ENABLE_LOGGING=false      # Enable query logging
DB_SSL=false                 # Enable SSL connection
```

#### Authentication
```env
JWT_SECRET="your-secret-key"     # JWT signing secret (min 32 chars)
JWT_EXPIRES_IN="24h"            # JWT expiration time
JWT_REFRESH_SECRET="refresh-key" # Refresh token secret
JWT_REFRESH_EXPIRES_IN="7d"     # Refresh token expiration
BCRYPT_ROUNDS=12                # Password hashing rounds
```

### Security Configuration

```env
# CORS Configuration
CORS_ORIGINS="http://localhost:3000,http://localhost:3001"

# Rate Limiting
RATE_LIMIT_MAX=100           # Max requests per window
RATE_LIMIT_WINDOW_MS=900000  # Rate limit window (15 minutes)

# Security Headers
HELMET_ENABLED=true          # Enable security headers
```

### Cache Configuration

```env
# Cache Provider
CACHE_PROVIDER=memory        # Cache provider: memory, redis
CACHE_TTL=300               # Default cache TTL (seconds)
CACHE_MAX_SIZE=1000         # Max cache entries (memory only)

# Redis Configuration (if using Redis)
REDIS_URL="redis://localhost:6379"
```

### File Storage Configuration

```env
# Storage Provider
FILE_STORAGE_PROVIDER=local  # Provider: local, s3, gcs, azure

# Local Storage
UPLOAD_PATH=./uploads        # Upload directory
UPLOAD_MAX_FILE_SIZE=10485760  # Max file size (10MB)
UPLOAD_ALLOWED_MIME_TYPES="image/jpeg,image/png,image/webp"

# AWS S3 Configuration (if using S3)
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-bucket"
```

### Logging Configuration

```env
LOG_LEVEL=info              # Log level: error, warn, info, debug, verbose
LOG_ENABLE_FILE=true        # Enable file logging
LOG_ENABLE_CONSOLE=true     # Enable console logging
LOG_PATH=./logs             # Log file directory
```

### Feature Flags

```env
ENABLE_SWAGGER=true         # Enable API documentation
ENABLE_METRICS=true         # Enable performance metrics
ENABLE_AUDIT_LOG=true       # Enable audit logging
ENABLE_SEED_DATA=false      # Enable database seeding
ENABLE_DEBUG_ROUTES=false   # Enable debug endpoints
ENABLE_HEALTH_CHECKS=true   # Enable health check endpoints
```

### Email Configuration

```env
EMAIL_HOST="smtp.gmail.com"     # SMTP host
EMAIL_PORT=587                  # SMTP port
EMAIL_SECURE=true              # Use TLS/SSL
EMAIL_USER="your-email@domain.com"  # SMTP username
EMAIL_PASSWORD="your-password"      # SMTP password
EMAIL_FROM="College Directory <noreply@college.edu>"  # From address
```

### Monitoring Configuration

```env
# Error Monitoring
SENTRY_DSN="https://your-sentry-dsn@sentry.io/project"

# Performance Monitoring
NEW_RELIC_LICENSE_KEY="your-new-relic-key"

# Health Checks
HEALTH_CHECK_TIMEOUT=5000      # Health check timeout (ms)
HEALTH_CHECK_INTERVAL=30000    # Health check interval (ms)
```

## 🌍 Environment-Specific Configuration

### Development Environment

```env
NODE_ENV=development
LOG_LEVEL=debug
ENABLE_SWAGGER=true
ENABLE_DEBUG_ROUTES=true
ENABLE_SEED_DATA=true
DB_ENABLE_LOGGING=true
HELMET_ENABLED=false
CACHE_PROVIDER=memory
FILE_STORAGE_PROVIDER=local
```

**Features:**
- Detailed logging
- Swagger documentation enabled
- Debug routes available
- Database query logging
- Relaxed security for development
- In-memory caching
- Local file storage

### Staging Environment

```env
NODE_ENV=staging
LOG_LEVEL=info
ENABLE_SWAGGER=true
ENABLE_DEBUG_ROUTES=false
ENABLE_SEED_DATA=false
DB_ENABLE_LOGGING=false
HELMET_ENABLED=true
CACHE_PROVIDER=redis
FILE_STORAGE_PROVIDER=s3
```

**Features:**
- Production-like configuration
- Swagger enabled for testing
- Enhanced security
- Redis caching
- Cloud file storage
- Performance monitoring

### Production Environment

```env
NODE_ENV=production
LOG_LEVEL=warn
ENABLE_SWAGGER=false
ENABLE_DEBUG_ROUTES=false
ENABLE_SEED_DATA=false
DB_ENABLE_LOGGING=false
HELMET_ENABLED=true
DB_SSL=true
CACHE_PROVIDER=redis
FILE_STORAGE_PROVIDER=s3
```

**Features:**
- Maximum security
- Minimal logging
- No debug features
- SSL database connections
- Redis caching
- Cloud file storage
- Error monitoring

### Test Environment

```env
NODE_ENV=test
LOG_LEVEL=error
ENABLE_SWAGGER=false
ENABLE_DEBUG_ROUTES=false
ENABLE_SEED_DATA=true
DB_ENABLE_LOGGING=false
HELMET_ENABLED=false
CACHE_PROVIDER=memory
FILE_STORAGE_PROVIDER=local
TEST_TIMEOUT=10000
```

**Features:**
- Minimal logging
- Fast test execution
- In-memory caching
- Local file storage
- Test data seeding
- Relaxed security for testing

## 🛠️ Configuration Management

### CLI Commands

```bash
# Setup configuration interactively
npm run config:setup

# Validate configuration
npm run config:validate [environment]

# Generate secure secrets
npm run config:generate [environment] [--update]

# Compare configurations
npm run config:compare [env1] [env2]

# Backup configuration
npm run config:backup

# Check configuration health
npm run config:health

# Switch environments
npm run env:dev      # Switch to development
npm run env:staging  # Switch to staging
npm run env:prod     # Switch to production
npm run env:test     # Switch to test
```

### Advanced CLI Usage

```bash
# Validate production configuration
node scripts/config-manager.js validate production

# Generate secrets and update file
node scripts/config-manager.js generate production --update

# Compare development vs production
node scripts/config-manager.js compare development production

# Create configuration backup
node scripts/config-manager.js backup

# Restore from backup
node scripts/config-manager.js restore backups/config-2024-01-15

# Encrypt sensitive values
node scripts/config-manager.js encrypt production

# Decrypt sensitive values
node scripts/config-manager.js decrypt production
```

## 🔒 Security Best Practices

### Secret Management

1. **Use strong secrets**:
   ```bash
   # Generate secure JWT secret
   npm run config:generate production --update
   ```

2. **Never commit secrets**:
   - Add `.env*` to `.gitignore`
   - Use environment variables in CI/CD
   - Use secret management services

3. **Rotate secrets regularly**:
   ```bash
   # Generate new secrets
   npm run config:generate production
   ```

### Environment Separation

1. **Use different databases** for each environment
2. **Separate AWS accounts/buckets** for staging and production
3. **Different API keys** for external services
4. **Isolated Redis instances** for caching

### Production Security

1. **Enable SSL/TLS** for all connections
2. **Use specific CORS origins** (no wildcards)
3. **Enable security headers** (Helmet)
4. **Disable debug features**
5. **Use strong rate limiting**

## 🔍 Configuration Validation

### Automatic Validation

The application automatically validates configuration at startup:

```typescript
// Validation happens automatically
const app = await NestFactory.create(AppModule);
```

### Manual Validation

```bash
# Validate current configuration
npm run config:validate

# Validate specific environment
npm run config:validate production

# Check configuration health
npm run config:health
```

### Validation Rules

1. **Required fields**: Must be present
2. **Format validation**: URLs, emails, etc.
3. **Security validation**: Strong secrets, secure origins
4. **Environment-specific**: Production-specific rules
5. **Service dependencies**: Redis URL when using Redis

## 🚨 Troubleshooting

### Common Issues

1. **Configuration validation failed**:
   ```bash
   npm run config:validate
   # Check error messages and fix configuration
   ```

2. **Database connection failed**:
   ```bash
   # Check DATABASE_URL format
   # Verify database server is running
   # Check network connectivity
   ```

3. **JWT token issues**:
   ```bash
   # Verify JWT_SECRET is set and secure
   # Check token expiration settings
   ```

4. **File upload problems**:
   ```bash
   # Check upload directory permissions
   # Verify file size limits
   # Check allowed MIME types
   ```

### Debug Configuration

```bash
# Enable debug logging
LOG_LEVEL=debug

# Enable query logging
DB_ENABLE_LOGGING=true

# Enable debug routes (development only)
ENABLE_DEBUG_ROUTES=true
```

### Configuration Health Check

```bash
# Check overall configuration health
npm run config:health

# Output example:
# 📊 Health Report:
#   ✅ development: 0 errors, 1 warnings
#   ✅ staging: 0 errors, 0 warnings
#   ❌ production: 2 errors, 1 warnings
```

## 📚 Additional Resources

- **[Environment Variables Reference](environment-variables.md)**: Complete variable reference
- **[Security Configuration](security-configuration.md)**: Security-specific settings
- **[Performance Tuning](performance-tuning.md)**: Performance optimization settings
- **[Deployment Guide](deployment-guide.md)**: Environment-specific deployment instructions
