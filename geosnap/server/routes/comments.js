import { Router } from 'express';
import { CommentDB, PhotoDB, UserDB } from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Get comments for a photo
router.get('/photo/:photoId', (req, res) => {
  try {
    const { photoId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const comments = CommentDB.findByPhotoId(photoId, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const total = CommentDB.countByPhotoId(photoId);

    // Enrich with user info
    const formattedComments = comments.map(comment => {
      const author = UserDB.findById(comment.user_id);
      return {
        id: comment.id,
        text: comment.text,
        created_at: comment.createdAt,
        author_username: author?.username,
        author_avatar: author?.avatar,
        user_id: comment.user_id
      };
    });

    res.json({
      comments: formattedComments,
      total
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add comment
router.post('/photo/:photoId', authenticateToken, (req, res) => {
  try {
    const { photoId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    // Check if photo exists
    const photo = PhotoDB.findById(photoId);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    const comment = CommentDB.create({
      photo_id: photoId,
      user_id: userId,
      text: text.trim()
    });

    const author = UserDB.findById(userId);

    res.status(201).json({
      message: 'Comment added',
      comment: {
        id: comment.id,
        text: comment.text,
        created_at: comment.createdAt,
        author_username: author?.username,
        author_avatar: author?.avatar,
        user_id: comment.user_id
      }
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update comment
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const comment = CommentDB.findById(id);
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    if (comment.user_id !== userId) {
      return res.status(403).json({ error: 'You can only edit your own comments' });
    }

    const updatedComment = CommentDB.update(id, { text: text.trim() });
    const author = UserDB.findById(userId);

    res.json({
      message: 'Comment updated',
      comment: {
        id: updatedComment.id,
        text: updatedComment.text,
        created_at: updatedComment.createdAt,
        author_username: author?.username,
        author_avatar: author?.avatar,
        user_id: updatedComment.user_id
      }
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete comment
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const comment = CommentDB.findById(id);
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    if (comment.user_id !== userId) {
      return res.status(403).json({ error: 'You can only delete your own comments' });
    }

    CommentDB.delete(id);
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
