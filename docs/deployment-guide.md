# Deployment Guide

This guide covers deploying the College Student Directory API to various environments.

## 🚀 Production Deployment

### Prerequisites

- Node.js 18+ runtime
- MySQL 8.0+ database
- SSL certificate (recommended)
- Domain name
- Process manager (PM2 recommended)

### 1. Server Setup

#### Ubuntu/Debian Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MySQL
sudo apt install mysql-server -y
sudo mysql_secure_installation

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx (optional, for reverse proxy)
sudo apt install nginx -y
```

#### CentOS/RHEL Server

```bash
# Update system
sudo yum update -y

# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install MySQL
sudo yum install mysql-server -y
sudo systemctl start mysqld
sudo mysql_secure_installation

# Install PM2
sudo npm install -g pm2
```

### 2. Database Setup

```bash
# Connect to MySQL
mysql -u root -p

# Create database and user
CREATE DATABASE college_directory_prod;
CREATE USER 'college_api'@'localhost' IDENTIFIED BY 'secure_password_here';
GRANT ALL PRIVILEGES ON college_directory_prod.* TO 'college_api'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Application Deployment

```bash
# Clone repository
git clone <repository-url> /opt/college-directory-api
cd /opt/college-directory-api

# Install dependencies
npm ci --only=production

# Create production environment file
sudo nano .env.production
```

#### Production Environment Variables

```env
# Database
DATABASE_URL="mysql://college_api:secure_password_here@localhost:3306/college_directory_prod"

# Authentication
JWT_SECRET="your-super-secure-production-jwt-secret-key"
JWT_EXPIRES_IN="24h"

# Server
NODE_ENV="production"
PORT=3000
FRONTEND_URL="https://your-domain.com"

# File Upload
UPLOAD_MAX_FILE_SIZE=10485760
UPLOAD_PATH="/opt/college-directory-api/uploads"

# Performance
ENABLE_METRICS=true
CACHE_TTL=600
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL="info"
LOG_FILE="/var/log/college-api/app.log"
```

### 4. Build and Deploy

```bash
# Build application
npm run build

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Create uploads directory
mkdir -p uploads
chmod 755 uploads

# Create log directory
sudo mkdir -p /var/log/college-api
sudo chown $USER:$USER /var/log/college-api
```

### 5. Process Management with PM2

#### PM2 Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'college-directory-api',
    script: 'dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_file: '.env.production',
    log_file: '/var/log/college-api/combined.log',
    out_file: '/var/log/college-api/out.log',
    error_file: '/var/log/college-api/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    watch: false,
    ignore_watch: ['node_modules', 'uploads', 'logs'],
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

#### Start Application

```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME

# Monitor application
pm2 monit
```

### 6. Nginx Reverse Proxy (Optional)

#### Nginx Configuration

Create `/etc/nginx/sites-available/college-api`:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL Configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;
    
    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Static file serving for uploads
    location /uploads/ {
        alias /opt/college-directory-api/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://localhost:3000/health;
    }
}
```

#### Enable Nginx Site

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/college-api /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## 🐳 Docker Deployment

### Dockerfile

```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Generate Prisma client
RUN npx prisma generate

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Create uploads directory
RUN mkdir -p uploads && chown nestjs:nodejs uploads

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/health-check.js

# Start application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=mysql://college_api:password@db:3306/college_directory
      - JWT_SECRET=your-production-secret
    depends_on:
      - db
    volumes:
      - uploads:/app/uploads
    restart: unless-stopped
    networks:
      - college-network

  db:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=rootpassword
      - MYSQL_DATABASE=college_directory
      - MYSQL_USER=college_api
      - MYSQL_PASSWORD=password
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"
    restart: unless-stopped
    networks:
      - college-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped
    networks:
      - college-network

volumes:
  mysql_data:
  uploads:

networks:
  college-network:
    driver: bridge
```

### Deploy with Docker

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f app

# Scale application
docker-compose up -d --scale app=3

# Update application
docker-compose pull
docker-compose up -d
```

## ☁️ Cloud Deployment

### AWS Deployment

#### Using AWS ECS

1. **Create ECR Repository**:
   ```bash
   aws ecr create-repository --repository-name college-directory-api
   ```

2. **Build and Push Image**:
   ```bash
   # Get login token
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
   
   # Build image
   docker build -t college-directory-api .
   
   # Tag image
   docker tag college-directory-api:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/college-directory-api:latest
   
   # Push image
   docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/college-directory-api:latest
   ```

3. **Create ECS Task Definition**:
   ```json
   {
     "family": "college-directory-api",
     "networkMode": "awsvpc",
     "requiresCompatibilities": ["FARGATE"],
     "cpu": "256",
     "memory": "512",
     "executionRoleArn": "arn:aws:iam::<account-id>:role/ecsTaskExecutionRole",
     "containerDefinitions": [
       {
         "name": "college-api",
         "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/college-directory-api:latest",
         "portMappings": [
           {
             "containerPort": 3000,
             "protocol": "tcp"
           }
         ],
         "environment": [
           {
             "name": "NODE_ENV",
             "value": "production"
           }
         ],
         "secrets": [
           {
             "name": "DATABASE_URL",
             "valueFrom": "arn:aws:secretsmanager:us-east-1:<account-id>:secret:college-api-db-url"
           }
         ],
         "logConfiguration": {
           "logDriver": "awslogs",
           "options": {
             "awslogs-group": "/ecs/college-directory-api",
             "awslogs-region": "us-east-1",
             "awslogs-stream-prefix": "ecs"
           }
         }
       }
     ]
   }
   ```

### Google Cloud Platform

#### Using Cloud Run

```bash
# Build and deploy
gcloud builds submit --tag gcr.io/PROJECT-ID/college-directory-api
gcloud run deploy --image gcr.io/PROJECT-ID/college-directory-api --platform managed
```

### Azure

#### Using Container Instances

```bash
# Create resource group
az group create --name college-api-rg --location eastus

# Deploy container
az container create \
  --resource-group college-api-rg \
  --name college-directory-api \
  --image your-registry/college-directory-api:latest \
  --dns-name-label college-api \
  --ports 3000
```

## 📊 Monitoring and Logging

### Application Monitoring

```bash
# PM2 monitoring
pm2 monit

# View logs
pm2 logs college-directory-api

# Restart application
pm2 restart college-directory-api

# Reload with zero downtime
pm2 reload college-directory-api
```

### Health Checks

Create `health-check.js`:

```javascript
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/health',
  method: 'GET',
  timeout: 3000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

req.on('error', () => {
  process.exit(1);
});

req.on('timeout', () => {
  req.destroy();
  process.exit(1);
});

req.end();
```

### Log Rotation

```bash
# Install logrotate
sudo apt install logrotate

# Create logrotate configuration
sudo nano /etc/logrotate.d/college-api
```

```
/var/log/college-api/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        pm2 reloadLogs
    endscript
}
```

## 🔒 Security Considerations

### SSL/TLS Configuration

```bash
# Using Let's Encrypt with Certbot
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Firewall Configuration

```bash
# UFW (Ubuntu)
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Restrict MySQL access
sudo ufw allow from localhost to any port 3306
```

### Environment Security

- Use environment variables for secrets
- Implement proper CORS policies
- Enable rate limiting
- Use HTTPS in production
- Regular security updates
- Database connection encryption
- File upload restrictions

## 🔄 Backup and Recovery

### Database Backup

```bash
# Create backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups/mysql"
DB_NAME="college_directory_prod"

mkdir -p $BACKUP_DIR

mysqldump -u college_api -p$DB_PASSWORD $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

### Automated Backups

```bash
# Add to crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * /opt/scripts/backup.sh
```

## 📈 Performance Optimization

### Production Optimizations

1. **Enable compression**
2. **Use CDN for static assets**
3. **Implement caching strategies**
4. **Database query optimization**
5. **Connection pooling**
6. **Load balancing**
7. **Memory management**

### Scaling Strategies

1. **Horizontal scaling**: Multiple instances
2. **Vertical scaling**: Increase resources
3. **Database scaling**: Read replicas
4. **Caching layers**: Redis/Memcached
5. **Load balancers**: Nginx/HAProxy
6. **Microservices**: Service decomposition
