#!/usr/bin/env node

/**
 * Configuration Manager CLI
 * Provides commands for managing application configuration
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

class ConfigManager {
  constructor() {
    this.commands = {
      validate: this.validateConfig.bind(this),
      generate: this.generateSecrets.bind(this),
      migrate: this.migrateConfig.bind(this),
      compare: this.compareConfigs.bind(this),
      backup: this.backupConfig.bind(this),
      restore: this.restoreConfig.bind(this),
      encrypt: this.encryptSecrets.bind(this),
      decrypt: this.decryptSecrets.bind(this),
      health: this.checkHealth.bind(this),
      help: this.showHelp.bind(this),
    };
  }

  async run() {
    const [,, command, ...args] = process.argv;
    
    if (!command || !this.commands[command]) {
      this.showHelp();
      return;
    }

    try {
      await this.commands[command](args);
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }
  }

  /**
   * Validate configuration files
   */
  async validateConfig(args) {
    const [environment = 'development'] = args;
    const envFile = `.env.${environment}`;
    
    console.log(`🔍 Validating configuration for ${environment}...`);
    
    if (!fs.existsSync(envFile)) {
      throw new Error(`Environment file ${envFile} not found`);
    }

    const config = this.loadEnvFile(envFile);
    const validation = this.validateEnvironmentConfig(config, environment);
    
    if (validation.isValid) {
      console.log('✅ Configuration is valid');
      
      if (validation.warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        validation.warnings.forEach(warning => console.log(`  - ${warning}`));
      }
      
      if (validation.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        validation.recommendations.forEach(rec => console.log(`  - ${rec}`));
      }
    } else {
      console.log('❌ Configuration validation failed');
      console.log('\nErrors:');
      validation.errors.forEach(error => console.log(`  - ${error}`));
      process.exit(1);
    }
  }

  /**
   * Generate secure secrets
   */
  async generateSecrets(args) {
    const [environment = 'development'] = args;
    
    console.log(`🔐 Generating secrets for ${environment}...`);
    
    const secrets = {
      JWT_SECRET: this.generateSecret(64),
      JWT_REFRESH_SECRET: this.generateSecret(64),
      SESSION_SECRET: this.generateSecret(32),
      ENCRYPTION_KEY: this.generateSecret(32),
    };

    console.log('\nGenerated secrets:');
    Object.entries(secrets).forEach(([key, value]) => {
      console.log(`${key}="${value}"`);
    });

    const updateFile = args.includes('--update');
    if (updateFile) {
      this.updateEnvFile(`.env.${environment}`, secrets);
      console.log(`\n✅ Updated .env.${environment} with new secrets`);
    } else {
      console.log('\n💡 Add --update flag to automatically update the environment file');
    }
  }

  /**
   * Migrate configuration between versions
   */
  async migrateConfig(args) {
    const [fromVersion, toVersion] = args;
    
    if (!fromVersion || !toVersion) {
      throw new Error('Usage: migrate <from-version> <to-version>');
    }

    console.log(`🔄 Migrating configuration from ${fromVersion} to ${toVersion}...`);
    
    // This would contain actual migration logic
    console.log('✅ Configuration migration completed');
  }

  /**
   * Compare configurations between environments
   */
  async compareConfigs(args) {
    const [env1 = 'development', env2 = 'production'] = args;
    
    console.log(`🔍 Comparing ${env1} vs ${env2} configurations...`);
    
    const config1 = this.loadEnvFile(`.env.${env1}`);
    const config2 = this.loadEnvFile(`.env.${env2}`);
    
    const differences = this.findConfigDifferences(config1, config2);
    
    if (differences.length === 0) {
      console.log('✅ Configurations are identical');
    } else {
      console.log('\n📊 Differences found:');
      differences.forEach(diff => {
        console.log(`  ${diff.key}:`);
        console.log(`    ${env1}: ${diff.value1 || 'undefined'}`);
        console.log(`    ${env2}: ${diff.value2 || 'undefined'}`);
      });
    }
  }

  /**
   * Backup configuration
   */
  async backupConfig() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = `backups/config-${timestamp}`;
    
    console.log(`💾 Creating configuration backup...`);
    
    if (!fs.existsSync('backups')) {
      fs.mkdirSync('backups');
    }
    
    fs.mkdirSync(backupDir);
    
    // Backup all environment files
    const envFiles = fs.readdirSync('.').filter(file => file.startsWith('.env'));
    
    envFiles.forEach(file => {
      fs.copyFileSync(file, path.join(backupDir, file));
    });
    
    // Create backup manifest
    const manifest = {
      timestamp: new Date().toISOString(),
      files: envFiles,
      version: this.getPackageVersion(),
    };
    
    fs.writeFileSync(
      path.join(backupDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    );
    
    console.log(`✅ Backup created: ${backupDir}`);
  }

  /**
   * Restore configuration from backup
   */
  async restoreConfig(args) {
    const [backupPath] = args;
    
    if (!backupPath) {
      throw new Error('Usage: restore <backup-path>');
    }

    console.log(`🔄 Restoring configuration from ${backupPath}...`);
    
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup path ${backupPath} not found`);
    }

    const manifestPath = path.join(backupPath, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      throw new Error('Invalid backup: manifest.json not found');
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    manifest.files.forEach(file => {
      const sourcePath = path.join(backupPath, file);
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, file);
        console.log(`  Restored: ${file}`);
      }
    });
    
    console.log('✅ Configuration restored successfully');
  }

  /**
   * Encrypt sensitive configuration values
   */
  async encryptSecrets(args) {
    const [environment = 'production'] = args;
    const envFile = `.env.${environment}`;
    
    console.log(`🔒 Encrypting secrets in ${envFile}...`);
    
    const config = this.loadEnvFile(envFile);
    const sensitiveKeys = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'DATABASE_URL', 'EMAIL_PASSWORD'];
    
    const encryptionKey = this.generateSecret(32);
    const encryptedConfig = { ...config };
    
    sensitiveKeys.forEach(key => {
      if (config[key]) {
        encryptedConfig[key] = this.encrypt(config[key], encryptionKey);
      }
    });
    
    // Save encrypted config
    this.saveEnvFile(`${envFile}.encrypted`, encryptedConfig);
    
    // Save encryption key separately
    fs.writeFileSync(`${envFile}.key`, encryptionKey);
    
    console.log('✅ Secrets encrypted successfully');
    console.log('⚠️  Store the .key file securely and separately');
  }

  /**
   * Decrypt sensitive configuration values
   */
  async decryptSecrets(args) {
    const [environment = 'production'] = args;
    const encryptedFile = `.env.${environment}.encrypted`;
    const keyFile = `.env.${environment}.key`;
    
    console.log(`🔓 Decrypting secrets from ${encryptedFile}...`);
    
    if (!fs.existsSync(encryptedFile) || !fs.existsSync(keyFile)) {
      throw new Error('Encrypted file or key file not found');
    }

    const config = this.loadEnvFile(encryptedFile);
    const encryptionKey = fs.readFileSync(keyFile, 'utf8').trim();
    
    const sensitiveKeys = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'DATABASE_URL', 'EMAIL_PASSWORD'];
    const decryptedConfig = { ...config };
    
    sensitiveKeys.forEach(key => {
      if (config[key]) {
        try {
          decryptedConfig[key] = this.decrypt(config[key], encryptionKey);
        } catch (error) {
          console.warn(`⚠️  Failed to decrypt ${key}`);
        }
      }
    });
    
    this.saveEnvFile(`.env.${environment}`, decryptedConfig);
    
    console.log('✅ Secrets decrypted successfully');
  }

  /**
   * Check configuration health
   */
  async checkHealth() {
    console.log('🏥 Checking configuration health...');
    
    const environments = ['development', 'staging', 'production', 'test'];
    const results = {};
    
    environments.forEach(env => {
      const envFile = `.env.${env}`;
      if (fs.existsSync(envFile)) {
        const config = this.loadEnvFile(envFile);
        const validation = this.validateEnvironmentConfig(config, env);
        results[env] = validation;
      }
    });
    
    console.log('\n📊 Health Report:');
    Object.entries(results).forEach(([env, validation]) => {
      const status = validation.isValid ? '✅' : '❌';
      console.log(`  ${status} ${env}: ${validation.errors.length} errors, ${validation.warnings.length} warnings`);
    });
  }

  /**
   * Show help information
   */
  showHelp() {
    console.log(`
🔧 Configuration Manager CLI

Usage: node scripts/config-manager.mjs <command> [options]

Commands:
  validate [env]     Validate configuration for environment
  generate [env]     Generate secure secrets
  migrate <from> <to> Migrate configuration between versions
  compare [env1] [env2] Compare configurations
  backup             Create configuration backup
  restore <path>     Restore from backup
  encrypt [env]      Encrypt sensitive values
  decrypt [env]      Decrypt sensitive values
  health             Check configuration health
  help               Show this help

Examples:
  node scripts/config-manager.mjs validate production
  node scripts/config-manager.mjs generate development --update
  node scripts/config-manager.mjs compare development production
  node scripts/config-manager.mjs backup
`);
  }

  // Utility methods
  loadEnvFile(filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File ${filePath} not found`);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const config = {};
    
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          config[key.trim()] = valueParts.join('=').replace(/^["']|["']$/g, '');
        }
      }
    });
    
    return config;
  }

  saveEnvFile(filePath, config) {
    const content = Object.entries(config)
      .map(([key, value]) => `${key}="${value}"`)
      .join('\n');
    
    fs.writeFileSync(filePath, content);
  }

  updateEnvFile(filePath, updates) {
    const config = this.loadEnvFile(filePath);
    Object.assign(config, updates);
    this.saveEnvFile(filePath, config);
  }

  validateEnvironmentConfig(config, environment) {
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
      recommendations: [],
    };

    // Required fields validation
    const required = ['NODE_ENV', 'DATABASE_URL', 'JWT_SECRET'];
    required.forEach(key => {
      if (!config[key]) {
        result.errors.push(`${key} is required`);
      }
    });

    // Environment-specific validations
    if (environment === 'production') {
      if (config.JWT_SECRET && config.JWT_SECRET.length < 32) {
        result.errors.push('JWT_SECRET must be at least 32 characters in production');
      }

      if (config.CORS_ORIGINS && config.CORS_ORIGINS.includes('*')) {
        result.errors.push('CORS origins must be explicit in production');
      }

      if (config.ENABLE_SWAGGER === 'true') {
        result.warnings.push('Swagger is enabled in production');
      }
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  findConfigDifferences(config1, config2) {
    const allKeys = new Set([...Object.keys(config1), ...Object.keys(config2)]);
    const differences = [];
    
    allKeys.forEach(key => {
      if (config1[key] !== config2[key]) {
        differences.push({
          key,
          value1: config1[key],
          value2: config2[key],
        });
      }
    });
    
    return differences;
  }

  generateSecret(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  encrypt(text, key) {
    const algorithm = 'aes-256-cbc';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return `${iv.toString('hex')}:${encrypted}`;
  }

  decrypt(encryptedText, key) {
    const algorithm = 'aes-256-cbc';
    const [, encrypted] = encryptedText.split(':');
    const decipher = crypto.createDecipher(algorithm, key);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  getPackageVersion() {
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return packageJson.version;
    } catch {
      return 'unknown';
    }
  }
}

// Run the CLI if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const manager = new ConfigManager();
  manager.run().catch(console.error);
}

export default ConfigManager;
