import { useState, useMemo } from 'react';
import { ArrowRight, Trash2, Image, Star, MapPin, Filter } from 'lucide-react';
import { formatDate, formatTime } from '../utils/helpers';

const GalleryScreen = ({ photos, onBack, onDeletePhoto, onOpenPostViewer }) => {
  const [viewMode, setViewMode] = useState('all'); // 'all' | 'byLocation'
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
    if (onOpenPostViewer) {
      // Reorder so clicked photo is first
      const reordered = [
        ...photoArray.slice(index),
        ...photoArray.slice(0, index)
      ];
      onOpenPostViewer(reordered, photoArray[index]?.address);
    }
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
    }
  };

  return (
    <div className="h-full w-full bg-black flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0">
        <div className="flex items-center justify-between p-6 pt-12 pb-6">
          <div className="glass rounded-2xl px-6 py-3 shadow-lg">
            <span className="text-sm font-bold text-white">
              {photos.length} {photos.length === 1 ? 'kỷ niệm' : 'kỷ niệm'}
            </span>
          </div>

          <h1 className="text-3xl font-black text-white tracking-tight">Bộ sưu tập</h1>

          <button
            onClick={onBack}
            className="w-16 h-16 rounded-3xl glass flex items-center justify-center active-scale shadow-lg hover-lift"
          >
            <ArrowRight className="w-7 h-7 text-white" />
          </button>
        </div>

        {/* View mode toggle */}
        {photos.length > 0 && (
          <div className="px-6 pb-4">
            <div className="bg-black/30 p-1.5 rounded-3xl backdrop-blur-lg border border-white/10">
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('all')}
                  className={`flex-1 py-4 rounded-2xl text-sm font-bold transition-all ${
                    viewMode === 'all'
                      ? 'bg-white text-black shadow-lg'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => setViewMode('byLocation')}
                  className={`flex-1 py-4 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    viewMode === 'byLocation'
                      ? 'bg-white text-black shadow-lg'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  Theo địa điểm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Gallery content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {photos.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-10 animate-fade-in">
            <div className="w-32 h-32 rounded-3xl glass flex items-center justify-center mb-10 animate-float shadow-2xl">
              <Image className="w-16 h-16 text-gray-400" />
            </div>
            <h3 className="text-3xl font-black text-white mb-4 text-center">Chưa có kỷ niệm nào</h3>
            <p className="text-gray-400 text-center leading-relaxed max-w-sm text-lg">
              Hãy bắt đầu khám phá và ghi lại những khoảnh khắc đáng nhớ của bạn
            </p>
            <div className="mt-8 px-6 py-3 rounded-2xl glass text-gray-300 text-sm flex items-center gap-2">
              <span>💡</span>
              <span>Vuốt sang trái để mở camera</span>
            </div>
          </div>
        ) : viewMode === 'all' ? (
          /* All photos grouped by date */
          <div className="px-6 pb-8">
            {Object.entries(groupedByDate).map(([date, datePhotos], groupIndex) => (
              <div key={date} className="animate-fade-in mb-12 last:mb-0">
                {/* Date header */}
                <div className="flex items-center gap-6 mb-6">
                  <div className="h-0.5 flex-1 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full" />
                  <div className="glass-ultra rounded-full px-5 py-2.5 shadow-lg">
                    <span className="text-sm font-black text-white uppercase tracking-wider">
                      {date}
                    </span>
                  </div>
                  <div className="h-0.5 flex-1 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full" />
                </div>

                {/* Photo grid */}
                <div className="grid grid-cols-3 gap-4">
                  {datePhotos.map((photo, idx) => (
                    <button
                      key={photo.id}
                      onClick={() => handlePhotoClick(datePhotos, idx)}
                      className="relative aspect-square rounded-3xl overflow-hidden active-scale group shadow-2xl ring-1 ring-white/10 hover:ring-white/20 transition-all duration-300"
                      style={{ animationDelay: `${(groupIndex * datePhotos.length + idx) * 50}ms` }}
                    >
                      <img
                        src={photo.image}
                        alt="Photo"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      
                      {/* Always visible overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20">
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-white font-semibold drop-shadow-lg">
                              {formatTime(photo.timestamp)}
                            </span>
                            {photo.rating > 0 && (
                              <div className="flex items-center gap-1.5 bg-gradient-gold px-2.5 py-1 rounded-xl shadow-lg">
                                <Star className="w-3 h-3 fill-white text-white" />
                                <span className="text-xs text-white font-bold">{photo.rating}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Delete button (hover) */}
                      <button
                        onClick={(e) => handleDeleteRequest(photo, e)}
                        className="absolute top-3 right-3 w-10 h-10 rounded-2xl bg-red-500/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl hover:bg-red-500 transform hover:scale-110"
                      >
                        <Trash2 className="w-5 h-5 text-white" />
                      </button>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Photos grouped by location */
          <div className="px-6 pb-8 space-y-6">
            {groupedByLocation.map((group, index) => (
              <div 
                key={group.name}
                className="glass-ultra rounded-3xl overflow-hidden animate-slide-up shadow-2xl ring-1 ring-white/10"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Location header */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-14 h-14 rounded-3xl gradient-primary flex items-center justify-center shrink-0 shadow-glow-primary">
                        <MapPin className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-black text-lg truncate">
                          {group.name}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-gray-400 text-sm">
                            {group.photos.length} {group.photos.length === 1 ? 'kỷ niệm' : 'kỷ niệm'}
                          </p>
                          {group.avgRating > 0 && (
                            <div className="flex items-center gap-1.5 bg-gradient-gold px-3 py-1.5 rounded-xl shadow-lg">
                              <Star className="w-4 h-4 fill-white text-white" />
                              <span className="text-sm text-white font-bold">{group.avgRating}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Photo strip */}
                  <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                    {group.photos.slice(0, 5).map((photo, idx) => (
                      <button
                        key={photo.id}
                        onClick={() => handlePhotoClick(group.photos, idx)}
                        className="relative w-28 h-28 rounded-3xl overflow-hidden shrink-0 active-scale shadow-xl hover:shadow-2xl transition-all duration-300 ring-1 ring-white/20 hover:ring-white/30"
                      >
                        <img
                          src={photo.image}
                          alt="Photo"
                          className="w-full h-full object-cover"
                        />
                        {idx === 0 && group.photos.length > 1 && (
                          <div className="absolute top-2 left-2 bg-gradient-primary px-2.5 py-1 rounded-xl shadow-lg">
                            <span className="text-white text-xs font-bold">Mới</span>
                          </div>
                        )}
                        {photo.rating > 0 && (
                          <div className="absolute bottom-2 right-2 bg-gradient-gold px-2 py-1 rounded-lg shadow-lg flex items-center gap-1">
                            <Star className="w-3 h-3 fill-white text-white" />
                            <span className="text-xs text-white font-bold">{photo.rating}</span>
                          </div>
                        )}
                      </button>
                    ))}
                    
                    {/* View all button */}
                    {group.photos.length > 5 && (
                      <button
                        onClick={() => handlePhotoClick(group.photos, 0)}
                        className="w-28 h-28 rounded-3xl glass shrink-0 flex flex-col items-center justify-center gap-2 active-scale shadow-xl hover:shadow-2xl transition-all duration-300"
                      >
                        <Filter className="w-6 h-6 text-white" />
                        <span className="text-white text-xs font-bold">+{group.photos.length - 5}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 z-100 flex items-center justify-center p-8 bg-black/95 backdrop-blur-lg animate-fade-in">
          <div className="w-full max-w-sm glass-ultra rounded-3xl p-10 animate-scale-in shadow-2xl ring-1 ring-white/10">
            <div className="w-24 h-24 rounded-3xl bg-red-500/20 flex items-center justify-center mx-auto mb-8 shadow-xl">
              <Trash2 className="w-12 h-12 text-red-400" />
            </div>
            
            <h3 className="text-3xl font-black text-white text-center mb-4">
              Xóa kỷ niệm này?
            </h3>
            <p className="text-gray-400 text-center text-base mb-10 leading-relaxed">
              Hành động này không thể hoàn tác. Kỷ niệm sẽ bị xóa vĩnh viễn khỏi bộ sưu tập của bạn.
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setPhotoToDelete(null);
                }}
                className="flex-1 py-5 rounded-2xl glass text-white font-bold active-scale hover-lift shadow-lg text-lg"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-5 rounded-2xl bg-red-500 text-white font-bold active-scale hover-lift shadow-lg shadow-red-500/30 text-lg hover:bg-red-600 transition-colors"
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
