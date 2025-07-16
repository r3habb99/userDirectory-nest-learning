import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../services/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

/**
 * Audit Logging Service
 * Tracks user actions and system events for security and compliance
 */

export enum AuditAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PERMISSION_CHANGE = 'PERMISSION_CHANGE',
  FILE_UPLOAD = 'FILE_UPLOAD',
  FILE_DELETE = 'FILE_DELETE',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
  SYSTEM_CONFIG = 'SYSTEM_CONFIG',
  SECURITY_VIOLATION = 'SECURITY_VIOLATION',
}

export enum AuditSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface AuditLogEntry {
  id?: string;
  userId?: string;
  userEmail?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  severity: AuditSeverity;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
  sessionId?: string;
  requestId?: string;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);
  private readonly isEnabled: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.isEnabled = this.configService.get<boolean>('ENABLE_AUDIT_LOG', true);
  }

  /**
   * Log an audit event
   */
  async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const auditEntry: AuditLogEntry = {
        ...entry,
        timestamp: new Date(),
      };

      // Log to console in development
      if (this.configService.get('NODE_ENV') === 'development') {
        this.logger.log(`AUDIT: ${JSON.stringify(auditEntry, null, 2)}`);
      }

      // Store in database (you would need to create an audit_logs table)
      // For now, we'll log to the application logs
      this.logToFile(auditEntry);

      // For critical events, also log to external service
      if (entry.severity === AuditSeverity.CRITICAL) {
        await this.logCriticalEvent(auditEntry);
      }

    } catch (error) {
      this.logger.error('Failed to log audit event', error);
    }
  }

  /**
   * Log user authentication events
   */
  async logAuth(
    action: AuditAction.LOGIN | AuditAction.LOGOUT | AuditAction.LOGIN_FAILED,
    userId?: string,
    userEmail?: string,
    ipAddress?: string,
    userAgent?: string,
    success: boolean = true,
    errorMessage?: string,
  ): Promise<void> {
    await this.log({
      userId,
      userEmail,
      action,
      resource: 'authentication',
      ipAddress,
      userAgent,
      severity: success ? AuditSeverity.LOW : AuditSeverity.MEDIUM,
      success,
      errorMessage,
    });
  }

  /**
   * Log data access events
   */
  async logDataAccess(
    action: AuditAction,
    resource: string,
    resourceId?: string,
    userId?: string,
    userEmail?: string,
    details?: Record<string, any>,
    ipAddress?: string,
  ): Promise<void> {
    const severity = this.determineSeverity(action, resource);

    await this.log({
      userId,
      userEmail,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      severity,
      success: true,
    });
  }

  /**
   * Log security violations
   */
  async logSecurityViolation(
    violation: string,
    details: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
    userId?: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.SECURITY_VIOLATION,
      resource: 'security',
      details: {
        violation,
        ...details,
      },
      ipAddress,
      userAgent,
      severity: AuditSeverity.HIGH,
      success: false,
      errorMessage: violation,
    });
  }

  /**
   * Log file operations
   */
  async logFileOperation(
    action: AuditAction.FILE_UPLOAD | AuditAction.FILE_DELETE,
    filename: string,
    fileSize?: number,
    userId?: string,
    userEmail?: string,
    ipAddress?: string,
  ): Promise<void> {
    await this.log({
      userId,
      userEmail,
      action,
      resource: 'file',
      details: {
        filename,
        fileSize,
      },
      ipAddress,
      severity: AuditSeverity.LOW,
      success: true,
    });
  }

  /**
   * Log system configuration changes
   */
  async logSystemConfig(
    configKey: string,
    oldValue: any,
    newValue: any,
    userId?: string,
    userEmail?: string,
  ): Promise<void> {
    await this.log({
      userId,
      userEmail,
      action: AuditAction.SYSTEM_CONFIG,
      resource: 'system_config',
      resourceId: configKey,
      details: {
        configKey,
        oldValue,
        newValue,
      },
      severity: AuditSeverity.MEDIUM,
      success: true,
    });
  }

  /**
   * Get audit logs with filtering
   */
  async getAuditLogs(filters: {
    userId?: string;
    action?: AuditAction;
    resource?: string;
    severity?: AuditSeverity;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{
    logs: AuditLogEntry[];
    total: number;
    page: number;
    limit: number;
  }> {
    // This would query the audit_logs table
    // For now, return empty result
    return {
      logs: [],
      total: 0,
      page: filters.page || 1,
      limit: filters.limit || 10,
    };
  }

  /**
   * Generate audit report
   */
  async generateAuditReport(
    startDate: Date,
    endDate: Date,
    format: 'json' | 'csv' = 'json',
  ): Promise<string> {
    const logs = await this.getAuditLogs({
      startDate,
      endDate,
      limit: 10000, // Large limit for reports
    });

    if (format === 'csv') {
      return this.convertToCSV(logs.logs);
    }

    return JSON.stringify(logs, null, 2);
  }

  private determineSeverity(action: AuditAction, resource: string): AuditSeverity {
    // Critical operations
    if (action === AuditAction.DELETE && ['student', 'admin', 'course'].includes(resource)) {
      return AuditSeverity.HIGH;
    }

    // Sensitive data access
    if (action === AuditAction.READ && ['student', 'admin'].includes(resource)) {
      return AuditSeverity.LOW;
    }

    // Data modifications
    if ([AuditAction.CREATE, AuditAction.UPDATE].includes(action)) {
      return AuditSeverity.MEDIUM;
    }

    return AuditSeverity.LOW;
  }

  private logToFile(entry: AuditLogEntry): void {
    const logMessage = `[AUDIT] ${entry.timestamp.toISOString()} | ${entry.action} | ${entry.resource} | User: ${entry.userEmail || 'anonymous'} | IP: ${entry.ipAddress || 'unknown'} | Success: ${entry.success}`;
    
    if (entry.severity === AuditSeverity.CRITICAL || entry.severity === AuditSeverity.HIGH) {
      this.logger.error(logMessage);
    } else if (entry.severity === AuditSeverity.MEDIUM) {
      this.logger.warn(logMessage);
    } else {
      this.logger.log(logMessage);
    }
  }

  private async logCriticalEvent(entry: AuditLogEntry): Promise<void> {
    // In a real implementation, you might send this to:
    // - External SIEM system
    // - Security monitoring service
    // - Email/SMS alerts
    // - Slack/Teams notifications

    this.logger.error(`CRITICAL AUDIT EVENT: ${JSON.stringify(entry)}`);
  }

  private convertToCSV(logs: AuditLogEntry[]): string {
    if (logs.length === 0) return '';

    const headers = [
      'timestamp',
      'userId',
      'userEmail',
      'action',
      'resource',
      'resourceId',
      'severity',
      'success',
      'ipAddress',
      'userAgent',
      'errorMessage',
    ];

    const csvRows = [
      headers.join(','),
      ...logs.map(log => 
        headers.map(header => {
          const value = (log as any)[header];
          return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value || '';
        }).join(',')
      ),
    ];

    return csvRows.join('\n');
  }
}
