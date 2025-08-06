import winston from 'winston';
import 'winston-daily-rotate-file';

// Define log levels and colors
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Add colors to winston
winston.addColors(logColors);

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    if (info.stack) {
      return `${info.timestamp} ${info.level}: ${info.message}\n${info.stack}`;
    }
    return `${info.timestamp} ${info.level}: ${info.message}`;
  })
);

// Define file format (without colors for file logs)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.printf((info) => {
    if (info.stack) {
      return `${info.timestamp} ${info.level}: ${info.message}\n${info.stack}`;
    }
    return `${info.timestamp} ${info.level}: ${info.message}`;
  })
);

// Create transports
const transports = [
  // Console transport (with colors)
  new winston.transports.Console({
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
    format: logFormat,
  }),
  
  // File transport for errors
  new winston.transports.DailyRotateFile({
    filename: 'logs/error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    format: fileFormat,
    maxSize: '20m',
    maxFiles: '14d',
  }),
  
  // File transport for all logs
  new winston.transports.DailyRotateFile({
    filename: 'logs/app-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    format: fileFormat,
    maxSize: '20m',
    maxFiles: '14d',
  }),
];

// Create logger instance
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  levels: logLevels,
  transports,
  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' }),
  ],
});

// Helper functions for different contexts
export const apiLogger = {
  request: (method: string, url: string, body?: any) => {
    logger.http(`📥 ${method} ${url}`, { body: body ? JSON.stringify(body, null, 2) : 'No body' });
  },
  
  response: (method: string, url: string, status: number, duration: number) => {
    const level = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'info';
    logger[level](`📤 ${method} ${url} - ${status} (${duration}ms)`);
  },
  
  error: (method: string, url: string, error: Error | string) => {
    logger.error(`❌ ${method} ${url} - Error: ${error instanceof Error ? error.message : error}`, {
      stack: error instanceof Error ? error.stack : undefined
    });
  }
};

export const pipelineLogger = {
  start: (postIdea: string, models: string[]) => {
    logger.info(`🚀 Pipeline started: "${postIdea.slice(0, 50)}..." with models: [${models.join(', ')}]`);
  },
  
  modelStart: (modelId: string) => {
    logger.info(`🔄 Processing model: ${modelId}`);
  },
  
  modelComplete: (modelId: string, duration: number, score?: number) => {
    logger.info(`✅ Model ${modelId} completed in ${duration}ms${score ? ` (score: ${score})` : ''}`);
  },
  
  modelError: (modelId: string, error: Error | string) => {
    logger.error(`❌ Model ${modelId} failed: ${error instanceof Error ? error.message : error}`, {
      stack: error instanceof Error ? error.stack : undefined
    });
  },
  
  complete: (duration: number, winner?: string) => {
    logger.info(`🏁 Pipeline completed in ${duration}ms${winner ? ` (winner: ${winner})` : ''}`);
  }
};

export const llmLogger = {
  request: (model: string, prompt: string, tokens?: number) => {
    logger.debug(`🤖 LLM Request to ${model}: "${prompt.slice(0, 100)}..."${tokens ? ` (${tokens} tokens)` : ''}`);
  },
  
  response: (model: string, duration: number, tokens?: number) => {
    logger.info(`🤖 LLM Response from ${model} in ${duration}ms${tokens ? ` (${tokens} tokens)` : ''}`);
  },
  
  error: (model: string, error: Error | string) => {
    logger.error(`🤖 LLM Error with ${model}: ${error instanceof Error ? error.message : error}`, {
      stack: error instanceof Error ? error.stack : undefined
    });
  }
};

// Export default logger for general use
export default logger;