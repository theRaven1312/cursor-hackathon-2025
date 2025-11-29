import { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, CircleMarker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { ArrowLeft, Navigation, Star, MapPin, Eye } from 'lucide-react';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Zoom threshold for showing detailed markers vs dots
const ZOOM_THRESHOLD = 14;

// Custom marker icon with photo
const createPhotoIcon = (imageUrl, count = 1, rating = 0) => {
  const size = count > 1 ? 56 : 48;
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        overflow: hidden;
        border: 3px solid ${rating >= 4 ? '#facc15' : '#FF6B6B'};
        box-shadow: 0 4px 20px rgba(255, 107, 107, 0.5);
        position: relative;
        background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
      ">
        <img 
          src="${imageUrl}" 
          style="width: 100%; height: 100%; object-fit: cover;"
          onerror="this.style.display='none'"
        />
        ${count > 1 ? `
          <div style="
            position: absolute;
            top: -4px;
            right: -4px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-size: 10px;
            font-weight: 700;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid #000;
          ">${count}</div>
        ` : ''}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
};

// Zoom tracker component
const ZoomTracker = ({ onZoomChange }) => {
  const map = useMapEvents({
    zoomend: () => {
      onZoomChange(map.getZoom());
    },
  });
  
  useEffect(() => {
    onZoomChange(map.getZoom());
  }, []);
  
  return null;
};

// Map control component
const MapController = ({ center, bounds }) => {
  const map = useMap();
  
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }
  }, [map, bounds]);
  
  const goToLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        map.flyTo([position.coords.latitude, position.coords.longitude], 15);
      },
      () => {
        map.flyTo(center, 13);
      }
    );
  };

  return (
    <button
      onClick={goToLocation}
      className="absolute bottom-24 right-4 z-[1000] w-12 h-12 rounded-full glass flex items-center justify-center active:scale-90 transition-transform shadow-lg"
    >
      <Navigation className="w-5 h-5 text-white" />
    </button>
  );
};

const MapScreen = ({ photos, onBack, onOpenPostViewer }) => {
  const [previewGroup, setPreviewGroup] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(13);

  // Default center (Ho Chi Minh City)
  const defaultCenter = [10.7769, 106.7009];

  // Group photos by location (clustering)
  const groupedPhotos = useMemo(() => {
    const groups = [];
    const used = new Set();

    photos.forEach((photo, index) => {
      if (used.has(index)) return;

      const group = {
        photos: [photo],
        center: photo.location,
        avgRating: photo.rating || 0,
        locationName: photo.address
      };

      // Find nearby photos - adjust radius based on clustering needs
      photos.forEach((other, otherIndex) => {
        if (index === otherIndex || used.has(otherIndex)) return;
        
        const dLat = Math.abs(photo.location.lat - other.location.lat);
        const dLng = Math.abs(photo.location.lng - other.location.lng);
        
        if (dLat < 0.002 && dLng < 0.002) {
          group.photos.push(other);
          used.add(otherIndex);
        }
      });

      // Sort photos by timestamp (newest first)
      group.photos.sort((a, b) => b.timestamp - a.timestamp);

      // Calculate average rating
      const ratings = group.photos.filter(p => p.rating > 0).map(p => p.rating);
      group.avgRating = ratings.length > 0 
        ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length) 
        : 0;

      used.add(index);
      groups.push(group);
    });

    return groups;
  }, [photos]);

  // Calculate bounds
  const bounds = useMemo(() => {
    if (photos.length === 0) return null;
    
    const lats = photos.map(p => p.location.lat);
    const lngs = photos.map(p => p.location.lng);
    
    return [
      [Math.min(...lats) - 0.01, Math.min(...lngs) - 0.01],
      [Math.max(...lats) + 0.01, Math.max(...lngs) + 0.01]
    ];
  }, [photos]);

  const handleMarkerClick = (group) => {
    setPreviewGroup(group);
  };

  const openPostViewer = () => {
    if (previewGroup && onOpenPostViewer) {
      onOpenPostViewer(previewGroup.photos, previewGroup.locationName);
      setPreviewGroup(null);
    }
  };

  // Check if should show detailed markers
  const showDetailedMarkers = currentZoom >= ZOOM_THRESHOLD;

  // Calculate dot size based on photo count
  const getDotRadius = (count) => {
    if (count === 1) return 6;
    if (count <= 3) return 8;
    if (count <= 5) return 10;
    return 12;
  };

  return (
    <div className="h-full w-full bg-neutral-900 relative overflow-hidden">
      {/* Map */}
      <div className="absolute inset-0">
        <MapContainer
          center={defaultCenter}
          zoom={13}
          className="h-full w-full"
          style={{ height: '100%', width: '100%', background: '#1a1a1a' }}
          zoomControl={false}
          whenReady={() => setMapReady(true)}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          
          {/* Zoom tracker */}
          <ZoomTracker onZoomChange={setCurrentZoom} />
          
          {mapReady && groupedPhotos.map((group, index) => (
            showDetailedMarkers ? (
              // Detailed photo markers when zoomed in
              <Marker
                key={`marker-${index}`}
                position={[group.center.lat, group.center.lng]}
                icon={createPhotoIcon(group.photos[0].image, group.photos.length, group.avgRating)}
                eventHandlers={{
                  click: () => handleMarkerClick(group)
                }}
              />
            ) : (
              // Simple dots when zoomed out
              <CircleMarker
                key={`dot-${index}`}
                center={[group.center.lat, group.center.lng]}
                radius={getDotRadius(group.photos.length)}
                pathOptions={{
                  fillColor: group.avgRating >= 4 ? '#facc15' : '#FF6B6B',
                  fillOpacity: 0.9,
                  color: '#fff',
                  weight: 2,
                  opacity: 0.8
                }}
                eventHandlers={{
                  click: () => handleMarkerClick(group)
                }}
              />
            )
          ))}

          <MapController center={defaultCenter} bounds={bounds} />
        </MapContainer>
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-[1000]">
        <div className="flex items-center justify-between p-4 pt-6">
          <button
            onClick={onBack}
            className="w-12 h-12 rounded-full glass flex items-center justify-center active:scale-90 transition-transform"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>

          <div className="glass rounded-full px-4 py-2">
            <span className="text-sm font-medium text-white">
              {photos.length} {photos.length === 1 ? 'snap' : 'snaps'}
            </span>
          </div>

          <div className="w-12" />
        </div>

        {/* Zoom hint */}
        {!showDetailedMarkers && photos.length > 0 && (
          <div className="flex justify-center">
            <div className="glass rounded-full px-4 py-2 text-xs text-gray-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              Zoom lại gần để xem ảnh chi tiết
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      {!showDetailedMarkers && photos.length > 0 && (
        <div className="absolute bottom-24 left-4 z-[1000] glass rounded-xl p-3">
          <p className="text-xs text-gray-400 mb-2">Chú thích:</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 border border-white"></span>
              <span className="text-xs text-white">Địa điểm có ảnh</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-yellow-400 border border-white"></span>
              <span className="text-xs text-white">Rating cao (≥4⭐)</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Chấm lớn = nhiều ảnh</span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Preview Card */}
      {previewGroup && (
        <div 
          className="absolute bottom-0 left-0 right-0 z-[1000] p-4 animate-slide-up"
          onClick={() => setPreviewGroup(null)}
        >
          <div 
            className="glass rounded-3xl overflow-hidden max-w-md mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Preview images */}
            <div className="flex gap-1 p-2 overflow-x-auto">
              {previewGroup.photos.slice(0, 4).map((photo, idx) => (
                <div 
                  key={photo.id}
                  className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0"
                >
                  <img
                    src={photo.image}
                    alt="Photo"
                    className="w-full h-full object-cover"
                  />
                  {idx === 3 && previewGroup.photos.length > 4 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white font-bold">+{previewGroup.photos.length - 4}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Info & Action */}
            <div className="p-4 pt-2">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-orange-400" />
                  <span className="text-white font-medium text-sm truncate max-w-[180px]">
                    {previewGroup.locationName || 'Unknown location'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {previewGroup.avgRating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-yellow-400 text-sm font-medium">{previewGroup.avgRating}</span>
                    </div>
                  )}
                  <span className="text-gray-500 text-sm">
                    {previewGroup.photos.length} bài
                  </span>
                </div>
              </div>

              <button
                onClick={openPostViewer}
                className="w-full py-3 rounded-xl gradient-primary text-white font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <Eye className="w-5 h-5" />
                Xem tất cả bài đăng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tap to close overlay */}
      {previewGroup && (
        <div 
          className="absolute inset-0 z-[999]"
          onClick={() => setPreviewGroup(null)}
        />
      )}
    </div>
  );
};

export default MapScreen;
