import { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ArrowLeft, Navigation, X, Clock, MapPin } from 'lucide-react';
import { formatRelativeTime } from '../utils/helpers';

// Custom marker icon
const createCustomIcon = (imageUrl, count = 1) => {
  const size = count > 1 ? 56 : 48;
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        overflow: hidden;
        border: 3px solid #FF6B6B;
        box-shadow: 0 4px 20px rgba(255, 107, 107, 0.5);
        position: relative;
      ">
        <img 
          src="${imageUrl}" 
          style="width: 100%; height: 100%; object-fit: cover;"
          onerror="this.style.background='linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)'"
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
    popupAnchor: [0, -size / 2 - 10]
  });
};

// Map control component
const MapController = ({ center }) => {
  const map = useMap();
  
  const goToLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        map.flyTo([position.coords.latitude, position.coords.longitude], 15);
      },
      () => {
        // Use default if geolocation fails
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

const MapScreen = ({ photos, onBack }) => {
  const [selectedPhoto, setSelectedPhoto] = useState(null);

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
        center: photo.location
      };

      // Find nearby photos
      photos.forEach((other, otherIndex) => {
        if (index === otherIndex || used.has(otherIndex)) return;
        
        const dLat = Math.abs(photo.location.lat - other.location.lat);
        const dLng = Math.abs(photo.location.lng - other.location.lng);
        
        if (dLat < 0.002 && dLng < 0.002) {
          group.photos.push(other);
          used.add(otherIndex);
        }
      });

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

  return (
    <div className="h-full w-full bg-black relative overflow-hidden">
      {/* Map */}
      <MapContainer
        center={defaultCenter}
        zoom={13}
        bounds={bounds}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {groupedPhotos.map((group, index) => (
          <Marker
            key={index}
            position={[group.center.lat, group.center.lng]}
            icon={createCustomIcon(group.photos[0].image, group.photos.length)}
            eventHandlers={{
              click: () => setSelectedPhoto(group.photos[0])
            }}
          >
            <Popup className="custom-popup">
              <div className="w-48">
                <img
                  src={group.photos[0].image}
                  alt="Photo"
                  className="w-full h-32 object-cover rounded-lg"
                />
                {group.photos.length > 1 && (
                  <p className="text-xs text-gray-500 mt-1">
                    +{group.photos.length - 1} more photos
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        <MapController center={defaultCenter} />
      </MapContainer>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-[1000] pt-safe">
        <div className="flex items-center justify-between p-4">
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

          <div className="w-12" /> {/* Spacer */}
        </div>
      </div>

      {/* Photo preview modal */}
      {selectedPhoto && (
        <div className="absolute inset-0 z-[1001] flex items-center justify-center p-6 bg-black/80 animate-fade-in">
          <div className="relative w-full max-w-sm animate-scale-in">
            {/* Close button */}
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-12 right-0 w-10 h-10 rounded-full glass flex items-center justify-center"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Image */}
            <div className="rounded-3xl overflow-hidden shadow-2xl">
              <img
                src={selectedPhoto.image}
                alt="Photo"
                className="w-full aspect-square object-cover"
              />
            </div>

            {/* Info */}
            <div className="mt-4 glass rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">
                  {formatRelativeTime(selectedPhoto.timestamp)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-orange-400" />
                <span className="text-sm text-gray-300">
                  {selectedPhoto.address || `${selectedPhoto.location.lat.toFixed(4)}, ${selectedPhoto.location.lng.toFixed(4)}`}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapScreen;

