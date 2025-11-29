import { Router } from 'express';
import { PhotoDB, CommentDB, UserDB } from '../database.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = Router();

// Get all photos (with optional filters)
router.get('/', optionalAuth, (req, res) => {
  try {
    const { lat, lng, radius, user_id, limit = 50, offset = 0 } = req.query;

    const photos = PhotoDB.findAll({
      lat, lng, radius, user_id,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Enrich with user info and comment counts
    const formattedPhotos = photos.map(photo => {
      const author = UserDB.findById(photo.user_id);
      const commentsCount = CommentDB.countByPhotoId(photo.id);
      
      return {
        id: photo.id,
        user_id: photo.user_id,
        image: photo.image,
        latitude: photo.latitude,
        longitude: photo.longitude,
        address: photo.address,
        rating: photo.rating,
        caption: photo.caption,
        created_at: photo.createdAt,
        author_username: author?.username,
        author_avatar: author?.avatar,
        likes_count: photo.likes?.length || 0,
        comments_count: commentsCount,
        user_liked: req.user ? photo.likes?.includes(req.user.id) : false
      };
    });

    res.json({ photos: formattedPhotos });
  } catch (error) {
    console.error('Get photos error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single photo
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const photo = PhotoDB.findById(req.params.id);

    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    const author = UserDB.findById(photo.user_id);
    const commentsCount = CommentDB.countByPhotoId(photo.id);

    res.json({
      photo: {
        id: photo.id,
        user_id: photo.user_id,
        image: photo.image,
        latitude: photo.latitude,
        longitude: photo.longitude,
        address: photo.address,
        rating: photo.rating,
        caption: photo.caption,
        created_at: photo.createdAt,
        author_username: author?.username,
        author_avatar: author?.avatar,
        likes_count: photo.likes?.length || 0,
        comments_count: commentsCount,
        user_liked: req.user ? photo.likes?.includes(req.user.id) : false
      }
    });
  } catch (error) {
    console.error('Get photo error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create photo
router.post('/', authenticateToken, (req, res) => {
  try {
    const { image, latitude, longitude, address, rating, caption } = req.body;
    const userId = req.user.id;

    if (!image || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Image, latitude and longitude are required' });
    }

    const photo = PhotoDB.create({
      user_id: userId,
      image,
      latitude,
      longitude,
      address,
      rating: rating || 0,
      caption
    });

    const author = UserDB.findById(userId);

    res.status(201).json({
      message: 'Photo created successfully',
      photo: {
        id: photo.id,
        user_id: userId,
        image: photo.image,
        latitude: photo.latitude,
        longitude: photo.longitude,
        address: photo.address,
        rating: photo.rating,
        caption: photo.caption,
        created_at: photo.createdAt,
        author_username: author?.username,
        likes_count: 0,
        comments_count: 0
      }
    });
  } catch (error) {
    console.error('Create photo error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update photo
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const { address, rating, caption } = req.body;
    const photoId = req.params.id;
    const userId = req.user.id;

    const photo = PhotoDB.findById(photoId);
    
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    if (photo.user_id !== userId) {
      return res.status(403).json({ error: 'You can only edit your own photos' });
    }

    const updates = {};
    if (address !== undefined) updates.address = address;
    if (rating !== undefined) updates.rating = rating;
    if (caption !== undefined) updates.caption = caption;

    const updatedPhoto = PhotoDB.update(photoId, updates);

    res.json({
      message: 'Photo updated',
      photo: {
        id: updatedPhoto.id,
        image: updatedPhoto.image,
        latitude: updatedPhoto.latitude,
        longitude: updatedPhoto.longitude,
        address: updatedPhoto.address,
        rating: updatedPhoto.rating,
        caption: updatedPhoto.caption,
        created_at: updatedPhoto.createdAt
      }
    });
  } catch (error) {
    console.error('Update photo error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete photo
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const photoId = req.params.id;
    const userId = req.user.id;

    const photo = PhotoDB.findById(photoId);
    
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    if (photo.user_id !== userId) {
      return res.status(403).json({ error: 'You can only delete your own photos' });
    }

    // Delete associated comments
    CommentDB.deleteByPhotoId(photoId);
    
    // Delete photo
    PhotoDB.delete(photoId);

    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Like/Unlike photo
router.post('/:id/like', authenticateToken, (req, res) => {
  try {
    const photoId = req.params.id;
    const userId = req.user.id;

    const photo = PhotoDB.findById(photoId);
    
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    const result = PhotoDB.toggleLike(photoId, userId);
    res.json({ 
      message: result.liked ? 'Photo liked' : 'Photo unliked', 
      liked: result.liked 
    });
  } catch (error) {
    console.error('Like photo error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
