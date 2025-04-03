const winston = require('winston');
const config = require('./config');

// Define log formats
const formats = {
  console: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(
      info => `${info.timestamp} ${info.level}: ${info.message}`
    )
  ),
  file: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  )
};

// Create the logger instance
const logger = winston.createLogger({
  level: config.logLevel || 'info',
  levels: winston.config.npm.levels,
  defaultMeta: { service: 'content-moderation-api' },
  transports: [
    // Console transport for all environments
    new winston.transports.Console({
      format: formats.console
    }),
    // Basic file logging for all environments
    new winston.transports.File({ 
      filename: 'logs/server.log',
      format: formats.file,
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  ]
});

// Add additional file transports in production
if (config.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: formats.file,
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  );
  
  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: formats.file,
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  );
}

// Create a stream object for Morgan integration
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

// Add request context logging helper
logger.logRequest = (req, message, level = 'info', meta = {}) => {
  const userId = req.user ? req.user.id : 'anonymous';
  const requestId = req.headers['x-request-id'] || 'unknown';
  
  logger[level](message, {
    userId,
    requestId,
    method: req.method,
    path: req.path,
    ...meta
  });
};

module.exports = logger;
