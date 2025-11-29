import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Server configuration with fallbacks for development
export const config = {
  PORT: process.env.PORT || 3001,
  JWT_SECRET: process.env.JWT_SECRET || 'geosnap_super_secret_key_2024',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/geosnap'
};

// Log config status (only in development)
if (process.env.NODE_ENV !== 'production') {
  console.log('📋 Config loaded:', {
    PORT: config.PORT,
    JWT_SECRET: config.JWT_SECRET ? '✓ Set' : '✗ Missing',
    MONGODB_URI: config.MONGODB_URI ? '✓ Set' : '✗ Missing'
  });
}
