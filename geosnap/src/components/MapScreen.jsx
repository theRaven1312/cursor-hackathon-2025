import { useState, useMemo, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, CircleMarker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { ArrowLeft, Navigation, Star, MapPin, Eye, Search, X, Loader2, MapPinned } from 'lucide-react';

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

// Search result marker icon
const createSearchMarkerIcon = () => {
  return L.divIcon({
    className: 'search-marker',
    html: `
      <div style="
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 4px 20px rgba(59, 130, 246, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="transform: rotate(45deg); color: white; font-size: 18px;">📍</div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
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

// Map controller component
const MapController = ({ center, bounds, flyToLocation }) => {
  const map = useMap();
  
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }
  }, [map, bounds]);

  useEffect(() => {
    if (flyToLocation) {
      map.flyTo([flyToLocation.lat, flyToLocation.lng], 16, {
        duration: 1.5
      });
    }
  }, [map, flyToLocation]);
  
  const goToMyLocation = () => {
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
      onClick={goToMyLocation}
      className="absolute bottom-24 right-4 z-[1000] w-12 h-12 rounded-full glass flex items-center justify-center active:scale-90 transition-transform shadow-lg"
    >
      <Navigation className="w-5 h-5 text-white" />
    </button>
  );
};

// Search component
const SearchBar = ({ onSelectLocation }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeout = useRef(null);
  const inputRef = useRef(null);

  // Search using Nominatim API
  const searchLocation = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&countrycodes=vn&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'vi'
          }
        }
      );
      const data = await response.json();
      setResults(data);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    }
    setIsSearching(false);
  };

  // Debounced search
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      searchLocation(value);
    }, 500);
  };

  const handleSelectResult = (result) => {
    onSelectLocation({
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      name: result.display_name
    });
    setQuery(result.display_name.split(',')[0]);
    setShowResults(false);
    setResults([]);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full max-w-md">
      {/* Search input */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {isSearching ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder="Tìm kiếm địa điểm..."
          className="w-full bg-black/80 backdrop-blur-lg border border-white/20 rounded-2xl pl-11 pr-10 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-400 transition-colors"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Search results dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-black/90 backdrop-blur-lg border border-white/20 rounded-2xl overflow-hidden z-[1001] max-h-[300px] overflow-y-auto">
          {results.map((result, index) => (
            <button
              key={index}
              onClick={() => handleSelectResult(result)}
              className="w-full px-4 py-3 flex items-start gap-3 hover:bg-white/10 transition-colors text-left border-b border-white/10 last:border-b-0"
            >
              <MapPinned className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {result.display_name.split(',')[0]}
                </p>
                <p className="text-gray-500 text-xs truncate mt-0.5">
                  {result.display_name.split(',').slice(1, 3).join(',')}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {showResults && query && !isSearching && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-black/90 backdrop-blur-lg border border-white/20 rounded-2xl p-4 z-[1001]">
          <p className="text-gray-400 text-sm text-center">
            Không tìm thấy địa điểm "{query}"
          </p>
        </div>
      )}
    </div>
  );
};

const MapScreen = ({ photos, onBack, onOpenPostViewer }) => {
  const [previewGroup, setPreviewGroup] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(13);
  const [searchLocation, setSearchLocation] = useState(null);
  const [showSearch, setShowSearch] = useState(false);

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

      photos.forEach((other, otherIndex) => {
        if (index === otherIndex || used.has(otherIndex)) return;
        
        const dLat = Math.abs(photo.location.lat - other.location.lat);
        const dLng = Math.abs(photo.location.lng - other.location.lng);
        
        if (dLat < 0.002 && dLng < 0.002) {
          group.photos.push(other);
          used.add(otherIndex);
        }
      });

      group.photos.sort((a, b) => b.timestamp - a.timestamp);

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
    setSearchLocation(null);
  };

  const openPostViewer = () => {
    if (previewGroup && onOpenPostViewer) {
      onOpenPostViewer(previewGroup.photos, previewGroup.locationName);
      setPreviewGroup(null);
    }
  };

  const handleSelectSearchLocation = (location) => {
    setSearchLocation(location);
    setPreviewGroup(null);
  };

  const showDetailedMarkers = currentZoom >= ZOOM_THRESHOLD;

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
          
          <ZoomTracker onZoomChange={setCurrentZoom} />
          
          {mapReady && groupedPhotos.map((group, index) => (
            showDetailedMarkers ? (
              <Marker
                key={`marker-${index}`}
                position={[group.center.lat, group.center.lng]}
                icon={createPhotoIcon(group.photos[0].image, group.photos.length, group.avgRating)}
                eventHandlers={{
                  click: () => handleMarkerClick(group)
                }}
              />
            ) : (
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

          {/* Search result marker */}
          {searchLocation && (
            <Marker
              position={[searchLocation.lat, searchLocation.lng]}
              icon={createSearchMarkerIcon()}
            />
          )}

          <MapController 
            center={defaultCenter} 
            bounds={bounds} 
            flyToLocation={searchLocation}
          />
        </MapContainer>
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-[1000]">
        <div className="flex items-center gap-3 p-4 pt-6">
          <button
            onClick={onBack}
            className="w-12 h-12 rounded-full glass flex items-center justify-center active:scale-90 transition-transform shrink-0"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>

          {showSearch ? (
            <SearchBar onSelectLocation={handleSelectSearchLocation} />
          ) : (
            <>
              <div className="glass rounded-full px-4 py-2 flex-1 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {photos.length} {photos.length === 1 ? 'snap' : 'snaps'}
                </span>
              </div>
              <button
                onClick={() => setShowSearch(true)}
                className="w-12 h-12 rounded-full glass flex items-center justify-center active:scale-90 transition-transform shrink-0"
              >
                <Search className="w-5 h-5 text-white" />
              </button>
            </>
          )}

          {showSearch && (
            <button
              onClick={() => {
                setShowSearch(false);
                setSearchLocation(null);
              }}
              className="w-12 h-12 rounded-full glass flex items-center justify-center active:scale-90 transition-transform shrink-0"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          )}
        </div>

        {/* Zoom hint */}
        {!showDetailedMarkers && photos.length > 0 && !showSearch && (
          <div className="flex justify-center">
            <div className="glass rounded-full px-4 py-2 text-xs text-gray-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              Zoom lại gần để xem ảnh chi tiết
            </div>
          </div>
        )}
      </div>

      {/* Search location info */}
      {searchLocation && (
        <div className="absolute top-24 left-4 right-4 z-[1000]">
          <div className="glass rounded-2xl p-3 max-w-md mx-auto flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
              <MapPinned className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {searchLocation.name.split(',')[0]}
              </p>
              <p className="text-gray-500 text-xs truncate">
                {searchLocation.name.split(',').slice(1, 3).join(',')}
              </p>
            </div>
            <button
              onClick={() => setSearchLocation(null)}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      )}

      {/* Legend */}
      {!showDetailedMarkers && photos.length > 0 && !previewGroup && !showSearch && (
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
