import { useState } from 'react';
import { ArrowRight, X, Clock, MapPin, Trash2, Image } from 'lucide-react';
import { formatRelativeTime, formatDate, formatTime } from '../utils/helpers';

const GalleryScreen = ({ photos, onBack, onDeletePhoto }) => {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Group photos by date
  const groupedByDate = photos.reduce((acc, photo) => {
    const date = formatDate(photo.timestamp);
    if (!acc[date]) acc[date] = [];
    acc[date].push(photo);
    return acc;
  }, {});

  const handleDelete = () => {
    if (selectedPhoto) {
      onDeletePhoto(selectedPhoto.id);
      setSelectedPhoto(null);
      setShowDeleteConfirm(false);
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
      </div>

      {/* Gallery content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-safe">
        {photos.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6">
            <div className="w-24 h-24 rounded-3xl glass flex items-center justify-center mb-6">
              <Image className="w-12 h-12 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No snaps yet</h3>
            <p className="text-gray-400 text-center">
              Start capturing moments and they'll appear here
            </p>
          </div>
        ) : (
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
                  {datePhotos.map((photo) => (
                    <button
                      key={photo.id}
                      onClick={() => setSelectedPhoto(photo)}
                      className="relative aspect-square rounded-2xl overflow-hidden active:scale-95 transition-transform"
                    >
                      <img
                        src={photo.image}
                        alt="Photo"
                        className="w-full h-full object-cover"
                      />
                      {/* Time overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                        <span className="text-xs text-white/80">
                          {formatTime(photo.timestamp)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Photo detail modal */}
      {selectedPhoto && (
        <div className="absolute inset-0 z-50 bg-black flex flex-col animate-fade-in">
          {/* Header */}
          <div className="shrink-0 pt-safe">
            <div className="flex items-center justify-between p-4">
              <button
                onClick={() => setSelectedPhoto(null)}
                className="w-12 h-12 rounded-full glass flex items-center justify-center active:scale-90 transition-transform"
              >
                <X className="w-6 h-6 text-white" />
              </button>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-12 h-12 rounded-full glass flex items-center justify-center active:scale-90 transition-transform"
              >
                <Trash2 className="w-5 h-5 text-red-400" />
              </button>
            </div>
          </div>

          {/* Image */}
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="w-full max-w-sm animate-scale-in">
              <div className="rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src={selectedPhoto.image}
                  alt="Photo"
                  className="w-full aspect-square object-cover"
                />
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="shrink-0 p-6 pb-safe">
            <div className="glass rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Captured</p>
                  <p className="text-white font-medium">
                    {formatRelativeTime(selectedPhoto.timestamp)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Location</p>
                  <p className="text-white font-medium">
                    {selectedPhoto.address || `${selectedPhoto.location.lat.toFixed(4)}, ${selectedPhoto.location.lng.toFixed(4)}`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 animate-fade-in">
          <div className="w-full max-w-xs glass rounded-3xl p-6 animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-400" />
            </div>
            
            <h3 className="text-xl font-bold text-white text-center mb-2">
              Delete this snap?
            </h3>
            <p className="text-gray-400 text-center text-sm mb-6">
              This action cannot be undone
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-xl glass-light text-white font-medium active:scale-95 transition-transform"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium active:scale-95 transition-transform"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryScreen;

