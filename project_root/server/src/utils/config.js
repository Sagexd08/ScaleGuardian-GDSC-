require('dotenv').config();

/**
 * Application configuration
 * Values are loaded from environment variables with defaults where appropriate
 */
const config = {
  // Server configuration
  server: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '5000', 10),
    apiVersion: process.env.API_VERSION || 'v1'
  },
  
  // CORS configuration
  cors: {
    origins: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',')
      : ['http://localhost:3000', 'chrome-extension://']
  },
  
  // JWT authentication
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'development-secret-do-not-use-in-production',
    jwtExpiration: process.env.JWT_EXPIRATION || '24h'
  },
  
  // Database configuration
  database: {
    url: process.env.DATABASE_URL || 'mongodb://localhost:27017/contentmod'
  },
  
  // Blockchain configuration
  blockchain: {
    provider: process.env.BLOCKCHAIN_PROVIDER || 'http://localhost:8545',
    moderationContractAddress: process.env.MODERATION_CONTRACT_ADDRESS,
    governanceContractAddress: process.env.GOVERNANCE_CONTRACT_ADDRESS,
    walletPrivateKey: process.env.WALLET_PRIVATE_KEY
  },
  
  // AI service configuration
  ai: {
    serviceUrl: process.env.AI_SERVICE_URL || 'http://localhost:5001/predict',
    modelVersion: process.env.MODEL_VERSION || 'latest'
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  },
  
  // Feature flags
  features: {
    enableBlockchainLogging: process.env.ENABLE_BLOCKCHAIN_LOGGING === 'true' || false,
    enableLocalAi: process.env.ENABLE_LOCAL_AI === 'true' || true
  },
  
  // Content moderation thresholds
  moderation: {
    thresholds: {
      toxic: parseFloat(process.env.THRESHOLD_TOXIC || '0.7'),
      harassment: parseFloat(process.env.THRESHOLD_HARASSMENT || '0.7'),
      hate_speech: parseFloat(process.env.THRESHOLD_HATE_SPEECH || '0.7'),
      self_harm: parseFloat(process.env.THRESHOLD_SELF_HARM || '0.8'),
      sexual: parseFloat(process.env.THRESHOLD_SEXUAL || '0.8'),
      violence: parseFloat(process.env.THRESHOLD_VIOLENCE || '0.8')
    }
  }
};

// Freeze the configuration to prevent accidental modifications
Object.freeze(config);
Object.keys(config).forEach(key => {
  if (typeof config[key] === 'object' && config[key] !== null) {
    Object.freeze(config[key]);
  }
});

module.exports = config;
