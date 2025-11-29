import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Server configuration
export const config = {
  PORT: process.env.PORT || 3001,
  JWT_SECRET: process.env.JWT_SECRET || 'geosnap_super_secret_key_2024',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  DB_PATH: process.env.DB_PATH || './data',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || 'AIzaSyCpHfoP30k834X65EDsDEjSKUGuT6JxGcs'
};
