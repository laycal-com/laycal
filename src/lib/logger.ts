export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  userId?: string;
  leadId?: string;
  vapiCallId?: string;
  operation: string;
  message: string;
  data?: any;
  error?: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatLog(entry: LogEntry): string {
    const prefix = `[${entry.timestamp}] [${entry.level}]`;
    const context = this.buildContext(entry);
    return `${prefix}${context} ${entry.operation}: ${entry.message}`;
  }

  private buildContext(entry: LogEntry): string {
    const parts = [];
    if (entry.userId) parts.push(`User:${entry.userId.slice(-8)}`);
    if (entry.leadId) parts.push(`Lead:${entry.leadId.slice(-8)}`);
    if (entry.vapiCallId) parts.push(`Call:${entry.vapiCallId.slice(-8)}`);
    return parts.length > 0 ? ` [${parts.join('|')}]` : '';
  }

  private log(level: LogLevel, operation: string, message: string, context?: {
    userId?: string;
    leadId?: string;
    vapiCallId?: string;
    data?: any;
    error?: any;
  }) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      operation,
      message,
      ...context
    };

    const logMessage = this.formatLog(entry);

    // Console logging
    switch (level) {
      case LogLevel.ERROR:
        console.error(logMessage, entry.error || entry.data);
        break;
      case LogLevel.WARN:
        console.warn(logMessage, entry.data);
        break;
      case LogLevel.INFO:
        console.info(logMessage, entry.data);
        break;
      case LogLevel.DEBUG:
        if (this.isDevelopment) {
          console.debug(logMessage, entry.data);
        }
        break;
    }

    // In production, you could also send logs to external services like:
    // - DataDog, LogRocket, Sentry, etc.
    // if (process.env.NODE_ENV === 'production') {
    //   this.sendToExternalLogger(entry);
    // }
  }

  debug(operation: string, message: string, context?: {
    userId?: string;
    leadId?: string;
    vapiCallId?: string;
    data?: any;
  }) {
    this.log(LogLevel.DEBUG, operation, message, context);
  }

  info(operation: string, message: string, context?: {
    userId?: string;
    leadId?: string;
    vapiCallId?: string;
    data?: any;
  }) {
    this.log(LogLevel.INFO, operation, message, context);
  }

  warn(operation: string, message: string, context?: {
    userId?: string;
    leadId?: string;
    vapiCallId?: string;
    data?: any;
    error?: any;
  }) {
    this.log(LogLevel.WARN, operation, message, context);
  }

  error(operation: string, message: string, context?: {
    userId?: string;
    leadId?: string;
    vapiCallId?: string;
    data?: any;
    error?: any;
  }) {
    this.log(LogLevel.ERROR, operation, message, context);
  }

  // Convenience methods for specific operations
  csvUpload = {
    start: (userId: string, fileName: string, fileSize: number) => {
      this.info('CSV_UPLOAD_START', `Starting CSV upload: ${fileName} (${fileSize} bytes)`, {
        userId,
        data: { fileName, fileSize }
      });
    },
    processing: (userId: string, totalRows: number) => {
      this.info('CSV_PROCESSING', `Processing CSV with ${totalRows} rows`, {
        userId,
        data: { totalRows }
      });
    },
    validation: (userId: string, validRows: number, totalRows: number, errors: string[]) => {
      this.info('CSV_VALIDATION', `Validated ${validRows}/${totalRows} rows`, {
        userId,
        data: { validRows, totalRows, errorCount: errors.length, errors }
      });
    },
    complete: (userId: string, savedLeads: number, errors: any[]) => {
      this.info('CSV_UPLOAD_COMPLETE', `CSV upload completed: ${savedLeads} leads saved`, {
        userId,
        data: { savedLeads, errorCount: errors.length, errors }
      });
    },
    error: (userId: string, error: any, fileName?: string) => {
      this.error('CSV_UPLOAD_ERROR', `CSV upload failed: ${error.message}`, {
        userId,
        data: { fileName },
        error
      });
    }
  };

  leadCreation = {
    start: (userId: string, leadData: any) => {
      this.debug('LEAD_CREATION_START', `Creating lead: ${leadData.name}`, {
        userId,
        data: { name: leadData.name, phone: leadData.phoneNumber }
      });
    },
    success: (userId: string, leadId: string, leadName: string) => {
      this.info('LEAD_CREATED', `Lead created successfully: ${leadName}`, {
        userId,
        leadId,
        data: { name: leadName }
      });
    },
    error: (userId: string, error: any, leadName: string) => {
      this.error('LEAD_CREATION_ERROR', `Failed to create lead: ${leadName}`, {
        userId,
        data: { name: leadName },
        error
      });
    }
  };

  vapiCall = {
    initiate: (userId: string, leadId: string, phoneNumber: string) => {
      this.info('VAPI_CALL_INITIATE', `Initiating Vapi call to ${phoneNumber}`, {
        userId,
        leadId,
        data: { phoneNumber }
      });
    },
    success: (userId: string, leadId: string, vapiCallId: string, phoneNumber: string) => {
      this.info('VAPI_CALL_SUCCESS', `Vapi call initiated successfully to ${phoneNumber}`, {
        userId,
        leadId,
        vapiCallId,
        data: { phoneNumber }
      });
    },
    error: (userId: string, leadId: string, error: any, phoneNumber: string) => {
      this.error('VAPI_CALL_ERROR', `Failed to initiate Vapi call to ${phoneNumber}`, {
        userId,
        leadId,
        data: { phoneNumber },
        error
      });
    },
    retry: (userId: string, leadId: string, phoneNumber: string) => {
      this.info('VAPI_CALL_RETRY', `Retrying Vapi call to ${phoneNumber}`, {
        userId,
        leadId,
        data: { phoneNumber }
      });
    }
  };

  webhook = {
    received: (type: string, vapiCallId?: string, leadId?: string) => {
      this.info('WEBHOOK_RECEIVED', `Received webhook: ${type}`, {
        vapiCallId,
        leadId,
        data: { type }
      });
    },
    processing: (type: string, vapiCallId: string, leadId?: string) => {
      this.debug('WEBHOOK_PROCESSING', `Processing webhook: ${type}`, {
        vapiCallId,
        leadId,
        data: { type }
      });
    },
    leadUpdate: (leadId: string, status: string, vapiCallId?: string) => {
      this.info('WEBHOOK_LEAD_UPDATE', `Updated lead status to: ${status}`, {
        leadId,
        vapiCallId,
        data: { status }
      });
    },
    error: (error: any, type?: string, vapiCallId?: string) => {
      this.error('WEBHOOK_ERROR', `Webhook processing failed: ${error.message}`, {
        vapiCallId,
        data: { type },
        error
      });
    },
    leadNotFound: (vapiCallId: string) => {
      this.warn('WEBHOOK_LEAD_NOT_FOUND', `Lead not found for Vapi call: ${vapiCallId}`, {
        vapiCallId
      });
    }
  };
}

export const logger = new Logger();