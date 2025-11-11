// lib/logger.ts
// 통합 로깅 시스템

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  SECURITY = 'SECURITY',
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
  userId?: number | string;
  ip?: string;
  path?: string;
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
  }

  private formatLog(entry: LogEntry): string {
    const { timestamp, level, category, message, data, userId, ip, path } = entry;
    
    let log = `[${timestamp}] [${level}] [${category}] ${message}`;
    
    if (userId) log += ` | User: ${userId}`;
    if (ip) log += ` | IP: ${ip}`;
    if (path) log += ` | Path: ${path}`;
    
    if (data) {
      log += `\nData: ${JSON.stringify(data, null, 2)}`;
    }
    
    return log;
  }

  private createEntry(
    level: LogLevel,
    category: string,
    message: string,
    metadata?: {
      data?: any;
      userId?: number | string;
      ip?: string;
      path?: string;
    }
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      ...metadata,
    };
  }

  private log(entry: LogEntry): void {
    const formatted = this.formatLog(entry);

    // 콘솔 출력
    switch (entry.level) {
      case LogLevel.ERROR:
      case LogLevel.SECURITY:
        console.error(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.DEBUG:
        if (this.isDevelopment) {
          console.debug(formatted);
        }
        break;
      default:
        console.log(formatted);
    }

    // Production 환경에서는 외부 로깅 서비스로 전송 가능
    // 예: Sentry, DataDog, LogRocket 등
    if (!this.isDevelopment && entry.level === LogLevel.ERROR) {
      // TODO: 외부 로깅 서비스 통합
      // sendToExternalLogger(entry);
    }
  }

  debug(category: string, message: string, metadata?: any): void {
    this.log(this.createEntry(LogLevel.DEBUG, category, message, { data: metadata }));
  }

  info(category: string, message: string, metadata?: any): void {
    this.log(this.createEntry(LogLevel.INFO, category, message, { data: metadata }));
  }

  warn(category: string, message: string, metadata?: any): void {
    this.log(this.createEntry(LogLevel.WARN, category, message, { data: metadata }));
  }

  error(
    category: string,
    message: string,
    error?: Error | any,
    metadata?: {
      userId?: number | string;
      ip?: string;
      path?: string;
    }
  ): void {
    const data = error instanceof Error 
      ? { 
          name: error.name, 
          message: error.message, 
          stack: error.stack 
        } 
      : error;

    this.log(this.createEntry(LogLevel.ERROR, category, message, { ...metadata, data }));
  }

  security(
    message: string,
    metadata: {
      userId?: number | string;
      ip: string;
      path?: string;
      data?: any;
    }
  ): void {
    this.log(this.createEntry(LogLevel.SECURITY, 'SECURITY', message, metadata));
  }
}

// 글로벌 Logger 인스턴스
const logger = new Logger();

export default logger;

// 카테고리별 헬퍼 함수
export const authLogger = {
  loginSuccess: (userId: number | string, ip: string) => 
    logger.info('AUTH', `Login successful`, { userId, ip }),
  
  loginFailed: (phone: string, ip: string, reason: string) => 
    logger.warn('AUTH', `Login failed: ${reason}`, { data: { phone }, ip }),
  
  logoutSuccess: (userId: number | string, ip: string) => 
    logger.info('AUTH', `Logout successful`, { userId, ip }),
  
  sessionExpired: (userId: number | string, sessionId: string) => 
    logger.info('AUTH', `Session expired`, { userId, data: { sessionId } }),
};

export const securityLogger = {
  csrfViolation: (ip: string, path: string) => 
    logger.security('CSRF token validation failed', { ip, path }),
  
  rateLimitExceeded: (ip: string, path: string, limit: number) => 
    logger.security('Rate limit exceeded', { ip, path, data: { limit } }),
  
  suspiciousActivity: (ip: string, activity: string, data?: any) => 
    logger.security(`Suspicious activity: ${activity}`, { ip, data }),
};

export const apiLogger = {
  request: (method: string, path: string, userId?: number | string, ip?: string) => 
    logger.debug('API', `${method} ${path}`, { userId, ip }),
  
  error: (method: string, path: string, error: Error, userId?: number | string, ip?: string) => 
    logger.error('API', `${method} ${path} failed`, error, { userId, ip, path }),
  
  slowRequest: (method: string, path: string, duration: number) => 
    logger.warn('API', `Slow request: ${method} ${path}`, { data: { duration } }),
};

