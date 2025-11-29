import { Router } from 'express';
import { Photo, Comment } from '../database.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = Router();

// Get all photos (with optional filters)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { lat, lng, radius, user_id, limit = 50, offset = 0 } = req.query;

    let query = {};

    // Filter by location radius
    if (lat && lng && radius) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      const radiusNum = parseFloat(radius);
      
      query['location.lat'] = { 
        $gte: latNum - radiusNum, 
        $lte: latNum + radiusNum 
      };
      query['location.lng'] = { 
        $gte: lngNum - radiusNum, 
        $lte: lngNum + radiusNum 
      };
    }

    // Filter by user
    if (user_id) {
      query.user = user_id;
    }

    const photos = await Photo.find(query)
      .populate('user', 'username avatar')
      .sort({ createdAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .lean();

    // Get comment counts for each photo
    const photoIds = photos.map(p => p._id);
    const commentCounts = await Comment.aggregate([
      { $match: { photo: { $in: photoIds } } },
      { $group: { _id: '$photo', count: { $sum: 1 } } }
    ]);
    
    const commentCountMap = {};
    commentCounts.forEach(c => {
      commentCountMap[c._id.toString()] = c.count;
    });

    const formattedPhotos = photos.map(photo => ({
      id: photo._id,
      image: photo.image,
      latitude: photo.location.lat,
      longitude: photo.location.lng,
      address: photo.address,
      rating: photo.rating,
      caption: photo.caption,
      created_at: photo.createdAt,
      author_username: photo.user?.username,
      author_avatar: photo.user?.avatar,
      likes_count: photo.likes?.length || 0,
      comments_count: commentCountMap[photo._id.toString()] || 0,
      user_liked: req.user ? photo.likes?.some(id => id.toString() === req.user.id) : false
    }));

    res.json({ photos: formattedPhotos });
  } catch (error) {
    console.error('Get photos error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single photo
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id)
      .populate('user', 'username avatar')
      .lean();

    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    const commentsCount = await Comment.countDocuments({ photo: photo._id });

    res.json({
      photo: {
        id: photo._id,
        image: photo.image,
        latitude: photo.location.lat,
        longitude: photo.location.lng,
        address: photo.address,
        rating: photo.rating,
        caption: photo.caption,
        created_at: photo.createdAt,
        author_username: photo.user?.username,
        author_avatar: photo.user?.avatar,
        likes_count: photo.likes?.length || 0,
        comments_count: commentsCount,
        user_liked: req.user ? photo.likes?.some(id => id.toString() === req.user.id) : false
      }
    });
  } catch (error) {
    console.error('Get photo error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create photo
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { image, latitude, longitude, address, rating, caption } = req.body;
    const userId = req.user.id;

    if (!image || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Image, latitude and longitude are required' });
    }

    const photo = new Photo({
      user: userId,
      image,
      location: {
        lat: latitude,
        lng: longitude
      },
      address,
      rating: rating || 0,
      caption
    });

    await photo.save();
    await photo.populate('user', 'username avatar');

    res.status(201).json({
      message: 'Photo created successfully',
      photo: {
        id: photo._id,
        image: photo.image,
        latitude: photo.location.lat,
        longitude: photo.location.lng,
        address: photo.address,
        rating: photo.rating,
        caption: photo.caption,
        created_at: photo.createdAt,
        author_username: photo.user?.username,
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
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { address, rating, caption } = req.body;
    const photoId = req.params.id;
    const userId = req.user.id;

    const photo = await Photo.findById(photoId);
    
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    if (photo.user.toString() !== userId) {
      return res.status(403).json({ error: 'You can only edit your own photos' });
    }

    if (address !== undefined) photo.address = address;
    if (rating !== undefined) photo.rating = rating;
    if (caption !== undefined) photo.caption = caption;

    await photo.save();

    res.json({
      message: 'Photo updated',
      photo: {
        id: photo._id,
        image: photo.image,
        latitude: photo.location.lat,
        longitude: photo.location.lng,
        address: photo.address,
        rating: photo.rating,
        caption: photo.caption,
        created_at: photo.createdAt
      }
    });
  } catch (error) {
    console.error('Update photo error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete photo
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const photoId = req.params.id;
    const userId = req.user.id;

    const photo = await Photo.findById(photoId);
    
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    if (photo.user.toString() !== userId) {
      return res.status(403).json({ error: 'You can only delete your own photos' });
    }

    // Delete associated comments
    await Comment.deleteMany({ photo: photoId });
    
    // Delete photo
    await Photo.findByIdAndDelete(photoId);

    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Like/Unlike photo
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const photoId = req.params.id;
    const userId = req.user.id;

    const photo = await Photo.findById(photoId);
    
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    const likeIndex = photo.likes.findIndex(id => id.toString() === userId);
    
    if (likeIndex > -1) {
      // Unlike
      photo.likes.splice(likeIndex, 1);
      await photo.save();
      res.json({ message: 'Photo unliked', liked: false });
    } else {
      // Like
      photo.likes.push(userId);
      await photo.save();
      res.json({ message: 'Photo liked', liked: true });
    }
  } catch (error) {
    console.error('Like photo error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
