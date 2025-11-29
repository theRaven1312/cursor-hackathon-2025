import { useState, useRef } from 'react';
import { X, MapPin, Star, Clock, Heart, ChevronDown, MessageCircle, Send, User, Trash2 } from 'lucide-react';
import { formatRelativeTime, formatDate, formatTime } from '../utils/helpers';

// Star Display Component
const StarDisplay = ({ rating }) => {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-gray-600'
          }`}
        />
      ))}
    </div>
  );
};

// Comment Item Component
const CommentItem = ({ comment, onDelete }) => {
  return (
    <div className="flex gap-3 group">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shrink-0">
        <User className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-white font-medium text-sm">{comment.author}</span>
          <span className="text-gray-500 text-xs">{formatRelativeTime(comment.timestamp)}</span>
        </div>
        <p className="text-gray-300 text-sm mt-0.5">{comment.text}</p>
      </div>
      {comment.author === 'Bạn' && (
        <button
          onClick={() => onDelete(comment.id)}
          className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center transition-opacity"
        >
          <Trash2 className="w-3 h-3 text-red-400" />
        </button>
      )}
    </div>
  );
};

// Comments Section Component
const CommentsSection = ({ photoId, comments, onAddComment, onDeleteComment }) => {
  const [newComment, setNewComment] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newComment.trim()) {
      onAddComment(photoId, newComment.trim());
      setNewComment('');
    }
  };

  const photoComments = comments || [];
  const displayComments = isExpanded ? photoComments : photoComments.slice(0, 2);

  return (
    <div className="border-t border-white/10 pt-3 mt-3">
      {/* Comment count & expand */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-gray-400">
          <MessageCircle className="w-4 h-4" />
          <span className="text-sm">{photoComments.length} bình luận</span>
        </div>
        {photoComments.length > 2 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-orange-400 hover:text-orange-300"
          >
            {isExpanded ? 'Thu gọn' : `Xem tất cả ${photoComments.length} bình luận`}
          </button>
        )}
      </div>

      {/* Comments list */}
      {photoComments.length > 0 && (
        <div className="space-y-3 mb-3">
          {displayComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onDelete={(commentId) => onDeleteComment(photoId, commentId)}
            />
          ))}
        </div>
      )}

      {/* Add comment form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center shrink-0">
          <User className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Viết bình luận..."
            className="flex-1 bg-white/10 border border-white/10 rounded-full px-4 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-orange-400 transition-colors"
          />
          <button
            type="submit"
            disabled={!newComment.trim()}
            className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed active:scale-90 transition-transform"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </form>
    </div>
  );
};

// Single Post Card Component
const PostCard = ({ photo, isLiked, onLike, comments, onAddComment, onDeleteComment, getCommentCount }) => {
  const [showHeart, setShowHeart] = useState(false);
  const lastTap = useRef(0);

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      onLike(photo.id);
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 1000);
    }
    lastTap.current = now;
  };

  const commentCount = getCommentCount(photo.id);

  return (
    <div className="bg-neutral-900 rounded-3xl overflow-hidden mb-4">
      {/* Post Header */}
      <div className="flex items-center gap-3 p-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center shrink-0">
          <MapPin className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-sm truncate">
            {photo.address || 'Unknown location'}
          </h3>
          <p className="text-gray-500 text-xs flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatRelativeTime(photo.timestamp)}
          </p>
        </div>
        {photo.rating > 0 && (
          <div className="flex items-center gap-1 bg-yellow-500/20 px-2 py-1 rounded-full shrink-0">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-yellow-400 font-medium">{photo.rating}</span>
          </div>
        )}
      </div>

      {/* Image */}
      <div 
        className="relative w-full aspect-square"
        onClick={handleDoubleTap}
      >
        <img
          src={photo.image}
          alt="Photo"
          className="w-full h-full object-cover"
          draggable={false}
        />
        
        {/* Double tap heart animation */}
        {showHeart && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart className="w-24 h-24 text-red-500 fill-red-500 animate-scale-in" />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4">
        {/* Like & Rating row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onLike(photo.id)}
              className="flex items-center gap-1 active:scale-90 transition-transform"
            >
              <Heart 
                className={`w-6 h-6 transition-colors ${
                  isLiked 
                    ? 'fill-red-500 text-red-500' 
                    : 'text-white hover:text-red-400'
                }`} 
              />
            </button>
            <div className="flex items-center gap-1 text-gray-400">
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm">{commentCount}</span>
            </div>
          </div>

          {photo.rating > 0 && (
            <StarDisplay rating={photo.rating} />
          )}
        </div>

        {/* Caption */}
        {photo.caption && (
          <div className="mb-3">
            <p className="text-white leading-relaxed">{photo.caption}</p>
          </div>
        )}

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-gray-500 text-xs mb-1">
          <span>{formatDate(photo.timestamp)}</span>
          <span>•</span>
          <span>{formatTime(photo.timestamp)}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {photo.location.lat.toFixed(4)}, {photo.location.lng.toFixed(4)}
          </span>
        </div>

        {/* Comments section */}
        <CommentsSection
          photoId={photo.id}
          comments={comments[photo.id] || []}
          onAddComment={onAddComment}
          onDeleteComment={onDeleteComment}
        />
      </div>
    </div>
  );
};

const PostViewer = ({ photos, initialIndex = 0, onClose, locationName, comments, onAddComment, onDeleteComment, getCommentCount }) => {
  const [liked, setLiked] = useState({});

  const toggleLike = (photoId) => {
    setLiked(prev => ({
      ...prev,
      [photoId]: !prev[photoId]
    }));
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black/95 flex flex-col overflow-hidden">
      {/* Header - Fixed */}
      <div className="shrink-0 bg-black border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:scale-90 transition-transform"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Location badge */}
          <div className="flex items-center gap-2 flex-1 justify-center px-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-white font-semibold text-sm truncate">
                {locationName || photos[0]?.address || 'Unknown'}
              </h2>
              <p className="text-gray-500 text-xs">{photos.length} bài đăng</p>
            </div>
          </div>

          {/* Placeholder for alignment */}
          <div className="w-10" />
        </div>
      </div>

      {/* Scroll hint */}
      {photos.length > 1 && (
        <div className="flex items-center justify-center gap-2 py-2 text-gray-500 text-xs">
          <ChevronDown className="w-4 h-4 animate-bounce" />
          <span>Cuộn xuống để xem thêm</span>
          <ChevronDown className="w-4 h-4 animate-bounce" />
        </div>
      )}

      {/* Scrollable Feed */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="w-full max-w-lg mx-auto px-4 pb-8">
          {photos.map((photo) => (
            <PostCard
              key={photo.id}
              photo={photo}
              isLiked={liked[photo.id]}
              onLike={toggleLike}
              comments={comments}
              onAddComment={onAddComment}
              onDeleteComment={onDeleteComment}
              getCommentCount={getCommentCount}
            />
          ))}

          {/* End of feed */}
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-3">
              <MapPin className="w-8 h-8 text-orange-400" />
            </div>
            <p className="text-gray-500 text-sm">Bạn đã xem hết tất cả bài đăng</p>
            <p className="text-gray-600 text-xs mt-1">tại địa điểm này</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostViewer;
