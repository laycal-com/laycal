import fs from 'fs';
import path from 'path';

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
  private logsDir: string;

  constructor() {
    this.logsDir = path.join(process.cwd(), 'logs');
    this.ensureLogsDirectory();
  }

  private ensureLogsDirectory() {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  private formatLog(entry: LogEntry): string {
    const prefix = `[${entry.timestamp}] [${entry.level}]`;
    const context = this.buildContext(entry);
    return `${prefix}${context} ${entry.operation}: ${entry.message}`;
  }

  private formatLogForFile(entry: LogEntry): string {
    const baseLog = this.formatLog(entry);
    const dataStr = entry.data ? `\nDATA: ${JSON.stringify(entry.data, null, 2)}` : '';
    const errorStr = entry.error ? `\nERROR: ${JSON.stringify(entry.error, null, 2)}` : '';
    return `${baseLog}${dataStr}${errorStr}\n${'='.repeat(80)}\n`;
  }

  private writeToFile(entry: LogEntry) {
    try {
      const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const filename = `${date}.log`;
      const filepath = path.join(this.logsDir, filename);
      
      const logLine = this.formatLogForFile(entry);
      
      fs.appendFileSync(filepath, logLine);
      
      // Also write to specific log files for webhooks and errors
      if (entry.operation.includes('WEBHOOK')) {
        const webhookFile = path.join(this.logsDir, `webhooks-${date}.log`);
        fs.appendFileSync(webhookFile, logLine);
      }
      
      if (entry.level === LogLevel.ERROR) {
        const errorFile = path.join(this.logsDir, `errors-${date}.log`);
        fs.appendFileSync(errorFile, logLine);
      }
    } catch (error) {
      // Don't throw errors for logging failures, just console log
      console.error('Failed to write to log file:', error);
    }
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

    // Write to file
    this.writeToFile(entry);

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

  assistant = {
    create: {
      start: (userId: string, name: string, language: string, voiceGender: string) => {
        this.info('ASSISTANT_CREATE_START', `Creating assistant: ${name}`, {
          userId,
          data: { name, language, voiceGender }
        });
      },
      success: (userId: string, assistantId: string, vapiAssistantId: string, name: string) => {
        this.info('ASSISTANT_CREATE_SUCCESS', `Assistant created successfully: ${name}`, {
          userId,
          data: { assistantId, vapiAssistantId, name }
        });
      },
      error: (userId: string, error: any, name?: string) => {
        this.error('ASSISTANT_CREATE_ERROR', `Failed to create assistant: ${name || 'Unknown'}`, {
          userId,
          data: { name },
          error
        });
      }
    },
    update: {
      start: (userId: string, assistantId: string, name: string) => {
        this.info('ASSISTANT_UPDATE_START', `Updating assistant: ${name}`, {
          userId,
          data: { assistantId, name }
        });
      },
      success: (userId: string, assistantId: string, name: string) => {
        this.info('ASSISTANT_UPDATE_SUCCESS', `Assistant updated successfully: ${name}`, {
          userId,
          data: { assistantId, name }
        });
      },
      error: (userId: string, assistantId: string, error: any, name?: string) => {
        this.error('ASSISTANT_UPDATE_ERROR', `Failed to update assistant: ${name || 'Unknown'}`, {
          userId,
          data: { assistantId, name },
          error
        });
      }
    },
    delete: {
      start: (userId: string, assistantId: string, vapiAssistantId: string, name: string) => {
        this.info('ASSISTANT_DELETE_START', `Deleting assistant: ${name}`, {
          userId,
          data: { assistantId, vapiAssistantId, name }
        });
      },
      success: (userId: string, assistantId: string, name: string) => {
        this.info('ASSISTANT_DELETE_SUCCESS', `Assistant deleted successfully: ${name}`, {
          userId,
          data: { assistantId, name }
        });
      },
      error: (userId: string, assistantId: string, error: any, name?: string) => {
        this.error('ASSISTANT_DELETE_ERROR', `Failed to delete assistant: ${name || 'Unknown'}`, {
          userId,
          data: { assistantId, name },
          error
        });
      }
    },
    test: {
      start: (userId: string, assistantId: string, name: string, phoneNumber: string) => {
        this.info('ASSISTANT_TEST_START', `Testing assistant: ${name}`, {
          userId,
          data: { assistantId, name, phoneNumber }
        });
      },
      success: (userId: string, assistantId: string, callId: string, name: string) => {
        this.info('ASSISTANT_TEST_SUCCESS', `Assistant test call initiated: ${name}`, {
          userId,
          data: { assistantId, callId, name }
        });
      },
      error: (userId: string, assistantId: string, error: any, name?: string) => {
        this.error('ASSISTANT_TEST_ERROR', `Failed to test assistant: ${name || 'Unknown'}`, {
          userId,
          data: { assistantId, name },
          error
        });
      }
    },
    usage: (userId: string, assistantId: string, name: string, action: string) => {
      this.info('ASSISTANT_USAGE', `Assistant used: ${name} for ${action}`, {
        userId,
        data: { assistantId, name, action }
      });
    }
  };
}

export const logger = new Logger();