#!/usr/bin/env node

/**
 * Environment Setup Script
 * Automatically configures environment files and validates configuration
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

class EnvironmentSetup {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    
    this.environments = ['development', 'staging', 'production', 'test'];
    this.config = {};
  }

  async run() {
    console.log('🚀 College Directory API - Environment Setup');
    console.log('='.repeat(50));
    
    try {
      await this.detectEnvironment();
      await this.gatherConfiguration();
      await this.generateSecrets();
      await this.createEnvironmentFiles();
      await this.validateConfiguration();
      await this.setupDatabase();
      
      console.log('\n✅ Environment setup completed successfully!');
      console.log('\nNext steps:');
      console.log('1. Review the generated .env file');
      console.log('2. Update any placeholder values');
      console.log('3. Run: npm run db:generate');
      console.log('4. Run: npm run db:push');
      console.log('5. Run: npm run start:dev');
      
    } catch (error) {
      console.error('\n❌ Setup failed:', error.message);
      process.exit(1);
    } finally {
      this.rl.close();
    }
  }

  async detectEnvironment() {
    const currentEnv = process.env.NODE_ENV || 'development';
    console.log(`\n📍 Current environment: ${currentEnv}`);
    
    const useDetected = await this.question(
      `Do you want to setup for ${currentEnv} environment? (y/n): `
    );
    
    if (useDetected.toLowerCase() === 'y') {
      this.config.environment = currentEnv;
    } else {
      console.log('\nAvailable environments:');
      this.environments.forEach((env, index) => {
        console.log(`${index + 1}. ${env}`);
      });
      
      const choice = await this.question('Select environment (1-4): ');
      const envIndex = parseInt(choice) - 1;
      
      if (envIndex >= 0 && envIndex < this.environments.length) {
        this.config.environment = this.environments[envIndex];
      } else {
        throw new Error('Invalid environment selection');
      }
    }
    
    console.log(`✅ Setting up for: ${this.config.environment}`);
  }

  async gatherConfiguration() {
    console.log('\n📝 Gathering configuration...');
    
    // Database configuration
    this.config.database = await this.getDatabaseConfig();
    
    // Server configuration
    this.config.server = await this.getServerConfig();
    
    // Security configuration
    this.config.security = await this.getSecurityConfig();
    
    // Optional services
    this.config.services = await this.getServicesConfig();
  }

  async getDatabaseConfig() {
    console.log('\n🗄️  Database Configuration');
    
    const useDefault = await this.question('Use default MySQL configuration? (y/n): ');
    
    if (useDefault.toLowerCase() === 'y') {
      return {
        provider: 'mysql',
        host: 'localhost',
        port: 3306,
        database: `college_directory_${this.config.environment}`,
        username: 'college_user',
        password: this.generatePassword(),
      };
    }
    
    return {
      provider: await this.question('Database provider (mysql/postgresql): ') || 'mysql',
      host: await this.question('Database host: ') || 'localhost',
      port: parseInt(await this.question('Database port: ') || '3306'),
      database: await this.question('Database name: ') || `college_directory_${this.config.environment}`,
      username: await this.question('Database username: ') || 'college_user',
      password: await this.question('Database password: ') || this.generatePassword(),
    };
  }

  async getServerConfig() {
    console.log('\n🌐 Server Configuration');
    
    const port = await this.question('Server port: ') || '3000';
    const host = await this.question('Server host: ') || '0.0.0.0';
    
    let baseUrl, frontendUrl;
    
    if (this.config.environment === 'production') {
      baseUrl = await this.question('Production API URL: ') || 'https://api.college-directory.com';
      frontendUrl = await this.question('Production Frontend URL: ') || 'https://college-directory.com';
    } else {
      baseUrl = `http://localhost:${port}`;
      frontendUrl = 'http://localhost:3001';
    }
    
    return { port: parseInt(port), host, baseUrl, frontendUrl };
  }

  async getSecurityConfig() {
    console.log('\n🔒 Security Configuration');
    
    const corsOrigins = this.config.environment === 'production' 
      ? await this.question('CORS origins (comma-separated): ')
      : '*';
    
    return {
      corsOrigins: corsOrigins.split(',').map(s => s.trim()),
      rateLimitMax: this.config.environment === 'production' ? 100 : 1000,
      bcryptRounds: this.config.environment === 'production' ? 12 : 10,
    };
  }

  async getServicesConfig() {
    console.log('\n🔧 Optional Services');
    
    const services = {};
    
    // Email service
    const setupEmail = await this.question('Setup email service? (y/n): ');
    if (setupEmail.toLowerCase() === 'y') {
      services.email = {
        host: await this.question('Email host: '),
        port: parseInt(await this.question('Email port: ') || '587'),
        user: await this.question('Email username: '),
        password: await this.question('Email password: '),
        from: await this.question('From email: '),
      };
    }
    
    // Redis cache
    const setupRedis = await this.question('Setup Redis cache? (y/n): ');
    if (setupRedis.toLowerCase() === 'y') {
      services.redis = {
        url: await this.question('Redis URL: ') || 'redis://localhost:6379',
      };
    }
    
    // AWS S3
    const setupS3 = await this.question('Setup AWS S3 storage? (y/n): ');
    if (setupS3.toLowerCase() === 'y') {
      services.s3 = {
        accessKeyId: await this.question('AWS Access Key ID: '),
        secretAccessKey: await this.question('AWS Secret Access Key: '),
        region: await this.question('AWS Region: ') || 'us-east-1',
        bucket: await this.question('S3 Bucket name: '),
      };
    }
    
    return services;
  }

  async generateSecrets() {
    console.log('\n🔐 Generating secure secrets...');
    
    this.config.secrets = {
      jwtSecret: this.generateSecret(64),
      jwtRefreshSecret: this.generateSecret(64),
      sessionSecret: this.generateSecret(32),
    };
    
    console.log('✅ Secrets generated');
  }

  async createEnvironmentFiles() {
    console.log('\n📄 Creating environment files...');
    
    const envContent = this.buildEnvironmentContent();
    const envFile = `.env.${this.config.environment}`;
    
    // Create main .env file
    fs.writeFileSync('.env', envContent);
    console.log('✅ Created .env file');
    
    // Create environment-specific file
    fs.writeFileSync(envFile, envContent);
    console.log(`✅ Created ${envFile} file`);
    
    // Create .env.example if it doesn't exist
    if (!fs.existsSync('.env.example')) {
      const exampleContent = this.buildExampleContent();
      fs.writeFileSync('.env.example', exampleContent);
      console.log('✅ Created .env.example file');
    }
  }

  buildEnvironmentContent() {
    const { environment, database, server, security, services, secrets } = this.config;
    
    const databaseUrl = `${database.provider}://${database.username}:${database.password}@${database.host}:${database.port}/${database.database}`;
    
    let content = `# ${environment.toUpperCase()} Environment Configuration
# Generated on ${new Date().toISOString()}

# Environment
NODE_ENV=${environment}

# Server Configuration
PORT=${server.port}
HOST=${server.host}
BASE_URL=${server.baseUrl}
FRONTEND_URL=${server.frontendUrl}

# Database Configuration
DATABASE_URL="${databaseUrl}"
DATABASE_PROVIDER=${database.provider}
DB_CONNECTION_LIMIT=${environment === 'production' ? 20 : 10}
DB_ENABLE_LOGGING=${environment === 'development'}
DB_SSL=${environment === 'production'}

# JWT Configuration
JWT_SECRET="${secrets.jwtSecret}"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_SECRET="${secrets.jwtRefreshSecret}"
JWT_REFRESH_EXPIRES_IN="7d"

# Security Configuration
BCRYPT_ROUNDS=${security.bcryptRounds}
CORS_ORIGINS="${security.corsOrigins.join(',')}"
RATE_LIMIT_MAX=${security.rateLimitMax}
HELMET_ENABLED=${environment === 'production'}

# Cache Configuration
CACHE_PROVIDER=${services.redis ? 'redis' : 'memory'}
CACHE_TTL=${environment === 'production' ? 600 : 300}
`;

    if (services.redis) {
      content += `REDIS_URL="${services.redis.url}"\n`;
    }

    content += `
# File Storage Configuration
FILE_STORAGE_PROVIDER=${services.s3 ? 's3' : 'local'}
UPLOAD_PATH=./uploads
UPLOAD_MAX_FILE_SIZE=${environment === 'production' ? 5242880 : 10485760}
`;

    if (services.s3) {
      content += `
# AWS S3 Configuration
AWS_ACCESS_KEY_ID="${services.s3.accessKeyId}"
AWS_SECRET_ACCESS_KEY="${services.s3.secretAccessKey}"
AWS_REGION="${services.s3.region}"
AWS_S3_BUCKET="${services.s3.bucket}"
`;
    }

    content += `
# Logging Configuration
LOG_LEVEL=${environment === 'production' ? 'warn' : 'debug'}
LOG_ENABLE_FILE=true
LOG_ENABLE_CONSOLE=${environment !== 'production'}

# Feature Flags
ENABLE_SWAGGER=${environment !== 'production'}
ENABLE_METRICS=true
ENABLE_AUDIT_LOG=true
ENABLE_SEED_DATA=${environment === 'development'}
ENABLE_DEBUG_ROUTES=${environment === 'development'}
`;

    if (services.email) {
      content += `
# Email Configuration
EMAIL_HOST="${services.email.host}"
EMAIL_PORT=${services.email.port}
EMAIL_USER="${services.email.user}"
EMAIL_PASSWORD="${services.email.password}"
EMAIL_FROM="${services.email.from}"
`;
    }

    return content;
  }

  buildExampleContent() {
    return `# Environment Configuration Example
# Copy this file to .env and update the values

# Environment
NODE_ENV=development

# Server Configuration
PORT=3000
HOST=0.0.0.0
BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3001

# Database Configuration
DATABASE_URL="mysql://username:password@localhost:3306/college_directory"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this"
JWT_EXPIRES_IN="24h"

# Security Configuration
CORS_ORIGINS="http://localhost:3000,http://localhost:3001"

# Optional: Redis Cache
# REDIS_URL="redis://localhost:6379"

# Optional: AWS S3
# AWS_ACCESS_KEY_ID="your-access-key"
# AWS_SECRET_ACCESS_KEY="your-secret-key"
# AWS_REGION="us-east-1"
# AWS_S3_BUCKET="your-bucket"

# Optional: Email Service
# EMAIL_HOST="smtp.gmail.com"
# EMAIL_PORT=587
# EMAIL_USER="your-email@gmail.com"
# EMAIL_PASSWORD="your-password"
`;
  }

  async validateConfiguration() {
    console.log('\n✅ Validating configuration...');
    
    // Check required fields
    const required = ['DATABASE_URL', 'JWT_SECRET'];
    const missing = required.filter(key => !process.env[key] && !this.config.secrets[key.toLowerCase().replace('_', '')]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required configuration: ${missing.join(', ')}`);
    }
    
    // Validate JWT secret strength
    if (this.config.secrets.jwtSecret.length < 32) {
      console.warn('⚠️  Warning: JWT secret should be at least 32 characters long');
    }
    
    console.log('✅ Configuration validation passed');
  }

  async setupDatabase() {
    console.log('\n🗄️  Database setup...');
    
    const setupDb = await this.question('Run database setup now? (y/n): ');
    
    if (setupDb.toLowerCase() === 'y') {
      const { spawn } = require('child_process');
      
      console.log('Generating Prisma client...');
      await this.runCommand('npx', ['prisma', 'generate']);
      
      console.log('Pushing database schema...');
      await this.runCommand('npx', ['prisma', 'db', 'push']);
      
      if (this.config.environment === 'development') {
        const seedDb = await this.question('Seed database with sample data? (y/n): ');
        if (seedDb.toLowerCase() === 'y') {
          console.log('Seeding database...');
          await this.runCommand('npm', ['run', 'seed']);
        }
      }
    }
  }

  runCommand(command, args) {
    return new Promise((resolve, reject) => {
      const { spawn } = require('child_process');
      const child = spawn(command, args, { stdio: 'inherit' });
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with code ${code}`));
        }
      });
    });
  }

  generateSecret(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  generatePassword(length = 16) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  question(prompt) {
    return new Promise((resolve) => {
      this.rl.question(prompt, resolve);
    });
  }
}

// Run the setup if called directly
if (require.main === module) {
  const setup = new EnvironmentSetup();
  setup.run().catch(console.error);
}

module.exports = EnvironmentSetup;
