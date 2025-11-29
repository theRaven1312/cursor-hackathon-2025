import { Router } from 'express';
import { Comment, Photo } from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Get comments for a photo
router.get('/photo/:photoId', async (req, res) => {
  try {
    const { photoId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const comments = await Comment.find({ photo: photoId })
      .populate('user', 'username avatar')
      .sort({ createdAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .lean();

    const total = await Comment.countDocuments({ photo: photoId });

    const formattedComments = comments.map(comment => ({
      id: comment._id,
      text: comment.text,
      created_at: comment.createdAt,
      author_username: comment.user?.username,
      author_avatar: comment.user?.avatar,
      user_id: comment.user?._id
    }));

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
router.post('/photo/:photoId', authenticateToken, async (req, res) => {
  try {
    const { photoId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    // Check if photo exists
    const photo = await Photo.findById(photoId);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    const comment = new Comment({
      photo: photoId,
      user: userId,
      text: text.trim()
    });

    await comment.save();
    await comment.populate('user', 'username avatar');

    res.status(201).json({
      message: 'Comment added',
      comment: {
        id: comment._id,
        text: comment.text,
        created_at: comment.createdAt,
        author_username: comment.user?.username,
        author_avatar: comment.user?.avatar,
        user_id: comment.user?._id
      }
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update comment
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const comment = await Comment.findById(id);
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    if (comment.user.toString() !== userId) {
      return res.status(403).json({ error: 'You can only edit your own comments' });
    }

    comment.text = text.trim();
    await comment.save();
    await comment.populate('user', 'username avatar');

    res.json({
      message: 'Comment updated',
      comment: {
        id: comment._id,
        text: comment.text,
        created_at: comment.createdAt,
        author_username: comment.user?.username,
        author_avatar: comment.user?.avatar,
        user_id: comment.user?._id
      }
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete comment
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const comment = await Comment.findById(id);
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    if (comment.user.toString() !== userId) {
      return res.status(403).json({ error: 'You can only delete your own comments' });
    }

    await Comment.findByIdAndDelete(id);
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
