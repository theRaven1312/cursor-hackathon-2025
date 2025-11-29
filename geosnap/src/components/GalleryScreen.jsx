import { useState, useMemo } from 'react';
import { ArrowRight, Trash2, Image, Star, MapPin, Filter } from 'lucide-react';
import { formatDate, formatTime } from '../utils/helpers';
import PostViewer from './PostViewer';

const GalleryScreen = ({ photos, onBack, onDeletePhoto }) => {
  const [viewMode, setViewMode] = useState('all'); // 'all' | 'byLocation'
  const [selectedPhotos, setSelectedPhotos] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState(null);

  // Group photos by date
  const groupedByDate = useMemo(() => {
    return photos.reduce((acc, photo) => {
      const date = formatDate(photo.timestamp);
      if (!acc[date]) acc[date] = [];
      acc[date].push(photo);
      return acc;
    }, {});
  }, [photos]);

  // Group photos by location
  const groupedByLocation = useMemo(() => {
    const groups = {};
    
    photos.forEach(photo => {
      const key = photo.address || 'Unknown location';
      if (!groups[key]) {
        groups[key] = {
          name: key,
          photos: [],
          avgRating: 0,
          location: photo.location
        };
      }
      groups[key].photos.push(photo);
    });

    // Calculate avg rating and sort photos
    Object.values(groups).forEach(group => {
      group.photos.sort((a, b) => b.timestamp - a.timestamp);
      const ratings = group.photos.filter(p => p.rating > 0).map(p => p.rating);
      group.avgRating = ratings.length > 0 
        ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length * 10) / 10
        : 0;
    });

    return Object.values(groups).sort((a, b) => 
      b.photos[0].timestamp - a.photos[0].timestamp
    );
  }, [photos]);

  const handlePhotoClick = (photoArray, index) => {
    setSelectedPhotos(photoArray);
    setSelectedIndex(index);
  };

  const handleDeleteRequest = (photo, e) => {
    e.stopPropagation();
    setPhotoToDelete(photo);
    setShowDeleteConfirm(true);
  };

  const handleDelete = () => {
    if (photoToDelete) {
      onDeletePhoto(photoToDelete.id);
      setPhotoToDelete(null);
      setShowDeleteConfirm(false);
      
      // Close viewer if deleted photo was being viewed
      if (selectedPhotos) {
        const remaining = selectedPhotos.filter(p => p.id !== photoToDelete.id);
        if (remaining.length === 0) {
          setSelectedPhotos(null);
        } else {
          setSelectedPhotos(remaining);
          setSelectedIndex(Math.min(selectedIndex, remaining.length - 1));
        }
      }
    }
  };

  return (
    <div className="h-full w-full bg-black flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 pt-safe">
        <div className="flex items-center justify-between p-4">
          <div className="glass rounded-full px-4 py-2">
            <span className="text-sm font-medium text-white">
              {photos.length} {photos.length === 1 ? 'memory' : 'memories'}
            </span>
          </div>

          <h1 className="text-xl font-bold text-white">Gallery</h1>

          <button
            onClick={onBack}
            className="w-12 h-12 rounded-full glass flex items-center justify-center active:scale-90 transition-transform"
          >
            <ArrowRight className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* View mode toggle */}
        {photos.length > 0 && (
          <div className="flex gap-2 px-4 pb-3">
            <button
              onClick={() => setViewMode('all')}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                viewMode === 'all'
                  ? 'bg-white text-black'
                  : 'glass text-white'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setViewMode('byLocation')}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                viewMode === 'byLocation'
                  ? 'bg-white text-black'
                  : 'glass text-white'
              }`}
            >
              <MapPin className="w-4 h-4" />
              Theo địa điểm
            </button>
          </div>
        )}
      </div>

      {/* Gallery content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-safe">
        {photos.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6">
            <div className="w-24 h-24 rounded-3xl glass flex items-center justify-center mb-6">
              <Image className="w-12 h-12 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Chưa có bài đăng</h3>
            <p className="text-gray-400 text-center">
              Bắt đầu chụp ảnh và chia sẻ những khoảnh khắc của bạn
            </p>
          </div>
        ) : viewMode === 'all' ? (
          /* All photos grouped by date */
          <div className="px-4 space-y-6">
            {Object.entries(groupedByDate).map(([date, datePhotos]) => (
              <div key={date}>
                {/* Date header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {date}
                  </span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                {/* Photo grid */}
                <div className="grid grid-cols-3 gap-2">
                  {datePhotos.map((photo, idx) => (
                    <button
                      key={photo.id}
                      onClick={() => handlePhotoClick(datePhotos, idx)}
                      className="relative aspect-square rounded-2xl overflow-hidden active:scale-95 transition-transform group"
                    >
                      <img
                        src={photo.image}
                        alt="Photo"
                        className="w-full h-full object-cover"
                      />
                      {/* Overlay with info */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent">
                        <div className="absolute bottom-0 left-0 right-0 p-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-white/80">
                              {formatTime(photo.timestamp)}
                            </span>
                            {photo.rating > 0 && (
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs text-yellow-400">{photo.rating}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Delete button (hover) */}
                      <button
                        onClick={(e) => handleDeleteRequest(photo, e)}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Photos grouped by location */
          <div className="px-4 space-y-4">
            {groupedByLocation.map((group) => (
              <div 
                key={group.name}
                className="glass rounded-2xl overflow-hidden"
              >
                {/* Location header */}
                <div className="p-3 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-orange-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium text-sm truncate max-w-[180px]">
                          {group.name}
                        </h3>
                        <p className="text-gray-500 text-xs">
                          {group.photos.length} {group.photos.length === 1 ? 'bài đăng' : 'bài đăng'}
                        </p>
                      </div>
                    </div>
                    {group.avgRating > 0 && (
                      <div className="flex items-center gap-1 bg-yellow-500/20 px-2 py-1 rounded-full">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-yellow-400 font-medium">{group.avgRating}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Photo strip */}
                <div className="p-2">
                  <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                    {group.photos.map((photo, idx) => (
                      <button
                        key={photo.id}
                        onClick={() => handlePhotoClick(group.photos, idx)}
                        className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 active:scale-95 transition-transform"
                      >
                        <img
                          src={photo.image}
                          alt="Photo"
                          className="w-full h-full object-cover"
                        />
                        {idx === 0 && group.photos.length > 1 && (
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center pb-1">
                            <span className="text-white text-xs font-medium">Mới nhất</span>
                          </div>
                        )}
                      </button>
                    ))}
                    
                    {/* View all button */}
                    {group.photos.length > 3 && (
                      <button
                        onClick={() => handlePhotoClick(group.photos, 0)}
                        className="w-20 h-20 rounded-xl bg-white/10 shrink-0 flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
                      >
                        <Filter className="w-5 h-5 text-white" />
                        <span className="text-white text-xs">Xem tất cả</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Post Viewer Modal */}
      {selectedPhotos && (
        <PostViewer
          photos={selectedPhotos}
          initialIndex={selectedIndex}
          onClose={() => {
            setSelectedPhotos(null);
            setSelectedIndex(0);
          }}
        />
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 z-[3000] flex items-center justify-center p-6 bg-black/80 animate-fade-in">
          <div className="w-full max-w-xs glass rounded-3xl p-6 animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-400" />
            </div>
            
            <h3 className="text-xl font-bold text-white text-center mb-2">
              Xóa bài đăng này?
            </h3>
            <p className="text-gray-400 text-center text-sm mb-6">
              Hành động này không thể hoàn tác
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setPhotoToDelete(null);
                }}
                className="flex-1 py-3 rounded-xl glass-light text-white font-medium active:scale-95 transition-transform"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium active:scale-95 transition-transform"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryScreen;
