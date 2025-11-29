import { useState, useEffect, useCallback, useRef } from 'react';
import { usePhotos, usePermissions } from './store/useStore';
import PermissionGate from './components/PermissionGate';
import CameraScreen from './components/CameraScreen';
import MapScreen from './components/MapScreen';
import GalleryScreen from './components/GalleryScreen';

// Screen names
const SCREENS = {
  GALLERY: 'gallery',
  CAMERA: 'camera',
  MAP: 'map'
};

function App() {
  const [currentScreen, setCurrentScreen] = useState(SCREENS.CAMERA);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef(null);
  
  const { photos, addPhoto, deletePhoto } = usePhotos();
  const { cameraPermission, locationPermission, requestAllPermissions } = usePermissions();

  // Check if permissions were previously granted
  useEffect(() => {
    // Try to check permissions status
    const checkPermissions = async () => {
      try {
        const cameraStatus = await navigator.permissions.query({ name: 'camera' });
        const geoStatus = await navigator.permissions.query({ name: 'geolocation' });
        
        if (cameraStatus.state === 'granted' && geoStatus.state === 'granted') {
          setPermissionsGranted(true);
        }
      } catch {
        // Permissions API not supported, will request on interaction
      }
    };
    
    checkPermissions();
  }, []);

  // Handle permission request
  const handleRequestPermissions = async () => {
    const result = await requestAllPermissions();
    if (result.camera && result.location) {
      setPermissionsGranted(true);
    }
  };

  // Navigate with transition
  const navigateTo = useCallback((screen) => {
    if (isTransitioning || screen === currentScreen) return;
    
    setIsTransitioning(true);
    setCurrentScreen(screen);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  }, [isTransitioning, currentScreen]);

  // Handle photo capture
  const handlePhotoCapture = useCallback((photoData) => {
    addPhoto(photoData);
  }, [addPhoto]);

  // Handle photo delete
  const handleDeletePhoto = useCallback((id) => {
    deletePhoto(id);
  }, [deletePhoto]);

  // Touch/Swipe handling for screen transitions
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 80;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        // Swipe left - go right
        if (currentScreen === SCREENS.GALLERY) {
          navigateTo(SCREENS.CAMERA);
        } else if (currentScreen === SCREENS.CAMERA) {
          navigateTo(SCREENS.MAP);
        }
      } else {
        // Swipe right - go left
        if (currentScreen === SCREENS.MAP) {
          navigateTo(SCREENS.CAMERA);
        } else if (currentScreen === SCREENS.CAMERA) {
          navigateTo(SCREENS.GALLERY);
        }
      }
    }
  };

  // Calculate transform based on current screen
  const getTransform = () => {
    switch (currentScreen) {
      case SCREENS.GALLERY:
        return 'translateX(0%)';
      case SCREENS.CAMERA:
        return 'translateX(-100%)';
      case SCREENS.MAP:
        return 'translateX(-200%)';
      default:
        return 'translateX(-100%)';
    }
  };

  // Show permission gate if not granted
  if (!permissionsGranted) {
    return (
      <PermissionGate
        onRequestPermissions={handleRequestPermissions}
        cameraPermission={cameraPermission}
        locationPermission={locationPermission}
      />
    );
  }

  return (
    <div 
      className="h-full w-full overflow-hidden bg-black"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Screen container with horizontal sliding */}
      <div
        ref={containerRef}
        className="h-full flex transition-transform duration-300 ease-out"
        style={{
          width: '300%',
          transform: getTransform()
        }}
      >
        {/* Gallery Screen */}
        <div className="w-1/3 h-full shrink-0">
          <GalleryScreen
            photos={photos}
            onBack={() => navigateTo(SCREENS.CAMERA)}
            onDeletePhoto={handleDeletePhoto}
          />
        </div>

        {/* Camera Screen */}
        <div className="w-1/3 h-full shrink-0">
          <CameraScreen
            onNavigateGallery={() => navigateTo(SCREENS.GALLERY)}
            onNavigateMap={() => navigateTo(SCREENS.MAP)}
            onPhotoCapture={handlePhotoCapture}
          />
        </div>

        {/* Map Screen */}
        <div className="w-1/3 h-full shrink-0">
          <MapScreen
            photos={photos}
            onBack={() => navigateTo(SCREENS.CAMERA)}
          />
        </div>
      </div>

      {/* Screen indicators */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-50">
        {[SCREENS.GALLERY, SCREENS.CAMERA, SCREENS.MAP].map((screen) => (
          <button
            key={screen}
            onClick={() => navigateTo(screen)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              currentScreen === screen
                ? 'w-6 bg-white'
                : 'bg-white/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default App;
