import fs from 'fs';
import path from 'path';
import { config } from './config.js';

const DATA_DIR = config.DB_PATH;

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to read JSON file
const readJSON = (filename) => {
  const filepath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filepath)) {
    return [];
  }
  try {
    const data = fs.readFileSync(filepath, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
};

// Helper to write JSON file
const writeJSON = (filename, data) => {
  const filepath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
};

// Generate simple unique ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

// ============ USER OPERATIONS ============
export const UserDB = {
  findAll: () => readJSON('users.json'),
  
  findById: (id) => {
    const users = readJSON('users.json');
    return users.find(u => u.id === id);
  },
  
  findByEmail: (email) => {
    const users = readJSON('users.json');
    return users.find(u => u.email === email);
  },
  
  findByUsername: (username) => {
    const users = readJSON('users.json');
    return users.find(u => u.username === username);
  },
  
  findOne: (query) => {
    const users = readJSON('users.json');
    return users.find(u => {
      return Object.keys(query).every(key => u[key] === query[key]);
    });
  },
  
  create: (userData) => {
    const users = readJSON('users.json');
    const newUser = {
      id: generateId(),
      ...userData,
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    writeJSON('users.json', users);
    return newUser;
  },
  
  update: (id, updates) => {
    const users = readJSON('users.json');
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return null;
    users[index] = { ...users[index], ...updates };
    writeJSON('users.json', users);
    return users[index];
  },
  
  delete: (id) => {
    const users = readJSON('users.json');
    const filtered = users.filter(u => u.id !== id);
    writeJSON('users.json', filtered);
    return filtered.length < users.length;
  }
};

// ============ PHOTO OPERATIONS ============
export const PhotoDB = {
  findAll: (query = {}) => {
    let photos = readJSON('photos.json');
    
    // Filter by user_id
    if (query.user_id) {
      photos = photos.filter(p => p.user_id === query.user_id);
    }
    
    // Filter by location radius
    if (query.lat && query.lng && query.radius) {
      const lat = parseFloat(query.lat);
      const lng = parseFloat(query.lng);
      const radius = parseFloat(query.radius);
      photos = photos.filter(p => {
        return p.latitude >= lat - radius && p.latitude <= lat + radius &&
               p.longitude >= lng - radius && p.longitude <= lng + radius;
      });
    }
    
    // Sort by createdAt descending
    photos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Pagination
    const offset = parseInt(query.offset) || 0;
    const limit = parseInt(query.limit) || 50;
    
    return photos.slice(offset, offset + limit);
  },
  
  findById: (id) => {
    const photos = readJSON('photos.json');
    return photos.find(p => p.id === id);
  },
  
  create: (photoData) => {
    const photos = readJSON('photos.json');
    const newPhoto = {
      id: generateId(),
      ...photoData,
      likes: [],
      createdAt: new Date().toISOString()
    };
    photos.push(newPhoto);
    writeJSON('photos.json', photos);
    return newPhoto;
  },
  
  update: (id, updates) => {
    const photos = readJSON('photos.json');
    const index = photos.findIndex(p => p.id === id);
    if (index === -1) return null;
    photos[index] = { ...photos[index], ...updates };
    writeJSON('photos.json', photos);
    return photos[index];
  },
  
  delete: (id) => {
    const photos = readJSON('photos.json');
    const filtered = photos.filter(p => p.id !== id);
    writeJSON('photos.json', filtered);
    return filtered.length < photos.length;
  },
  
  toggleLike: (photoId, userId) => {
    const photos = readJSON('photos.json');
    const index = photos.findIndex(p => p.id === photoId);
    if (index === -1) return null;
    
    const photo = photos[index];
    const likeIndex = photo.likes.indexOf(userId);
    
    if (likeIndex > -1) {
      photo.likes.splice(likeIndex, 1);
    } else {
      photo.likes.push(userId);
    }
    
    writeJSON('photos.json', photos);
    return { liked: likeIndex === -1, photo };
  },
  
  count: () => readJSON('photos.json').length
};

// ============ COMMENT OPERATIONS ============
export const CommentDB = {
  findByPhotoId: (photoId, query = {}) => {
    let comments = readJSON('comments.json').filter(c => c.photo_id === photoId);
    
    // Sort by createdAt descending
    comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Pagination
    const offset = parseInt(query.offset) || 0;
    const limit = parseInt(query.limit) || 50;
    
    return comments.slice(offset, offset + limit);
  },
  
  countByPhotoId: (photoId) => {
    return readJSON('comments.json').filter(c => c.photo_id === photoId).length;
  },
  
  findById: (id) => {
    const comments = readJSON('comments.json');
    return comments.find(c => c.id === id);
  },
  
  create: (commentData) => {
    const comments = readJSON('comments.json');
    const newComment = {
      id: generateId(),
      ...commentData,
      createdAt: new Date().toISOString()
    };
    comments.push(newComment);
    writeJSON('comments.json', comments);
    return newComment;
  },
  
  update: (id, updates) => {
    const comments = readJSON('comments.json');
    const index = comments.findIndex(c => c.id === id);
    if (index === -1) return null;
    comments[index] = { ...comments[index], ...updates };
    writeJSON('comments.json', comments);
    return comments[index];
  },
  
  delete: (id) => {
    const comments = readJSON('comments.json');
    const filtered = comments.filter(c => c.id !== id);
    writeJSON('comments.json', filtered);
    return filtered.length < comments.length;
  },
  
  deleteByPhotoId: (photoId) => {
    const comments = readJSON('comments.json');
    const filtered = comments.filter(c => c.photo_id !== photoId);
    writeJSON('comments.json', filtered);
  }
};

// Initialize database
export const initDB = () => {
  console.log('✅ JSON Database initialized at:', DATA_DIR);
};

export default { UserDB, PhotoDB, CommentDB, initDB };
