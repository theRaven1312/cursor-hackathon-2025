import { useState, useEffect, useCallback, useRef } from 'react';
import { usePhotos, usePermissions, useComments } from './store/useStore';
import { useAuth } from './context/AuthContext';
import PermissionGate from './components/PermissionGate';
import AuthScreen from './components/AuthScreen';
import CameraScreen from './components/CameraScreen';
import MapScreen from './components/MapScreen';
import GalleryScreen from './components/GalleryScreen';
import PostViewer from './components/PostViewer';
import { LogOut, User } from 'lucide-react';

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
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Post viewer state (lifted to App level)
  const [postViewerData, setPostViewerData] = useState(null);
  
  const { photos, addPhoto, deletePhoto, toggleLike, loading: photosLoading, refetch } = usePhotos();
  const { comments, addComment, deleteComment, getCommentCount, getComments } = useComments();
  const { cameraPermission, locationPermission, requestAllPermissions } = usePermissions();
  const { user, isAuthenticated, loading: authCheckLoading, login, register, logout } = useAuth();

  // Check if permissions were previously granted
  useEffect(() => {
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

  // Handle login
  const handleLogin = async (email, password) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      await login(email, password);
      refetch(); // Refresh photos after login
    } catch (err) {
      setAuthError(err.message);
      throw err;
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle register
  const handleRegister = async (username, email, password) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      await register(username, email, password);
      refetch(); // Refresh photos after register
    } catch (err) {
      setAuthError(err.message);
      throw err;
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
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
  const handlePhotoCapture = useCallback(async (photoData) => {
    await addPhoto(photoData);
  }, [addPhoto]);

  // Handle photo delete
  const handleDeletePhoto = useCallback(async (id) => {
    await deletePhoto(id);
  }, [deletePhoto]);

  // Open post viewer (called from MapScreen or GalleryScreen)
  const openPostViewer = useCallback(async (photosToShow, locationName) => {
    // Store only photo IDs so we always get fresh data from main photos state
    const photoIds = photosToShow.map(p => p.id);
    setPostViewerData({ photoIds, locationName });
    // Fetch comments for all photos being shown
    for (const photo of photosToShow) {
      await getComments(photo.id);
    }
  }, [getComments]);

  // Close post viewer
  const closePostViewer = useCallback(() => {
    setPostViewerData(null);
  }, []);

  // Touch/Swipe handling for screen transitions
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndX = useRef(0);
  const touchEndY = useRef(0);
  const isSwiping = useRef(false);

  const handleTouchStart = (e) => {
    if (postViewerData) return;
    
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
    isSwiping.current = false;
  };

  const handleTouchMove = (e) => {
    if (postViewerData) return;
    
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
    
    const diffX = Math.abs(touchEndX.current - touchStartX.current);
    const diffY = Math.abs(touchEndY.current - touchStartY.current);
    
    if (diffX > diffY && diffX > 10) {
      isSwiping.current = true;
    }
  };

  const handleTouchEnd = () => {
    if (postViewerData) return;
    if (!isSwiping.current) return;
    
    const diffX = touchStartX.current - touchEndX.current;
    const diffY = Math.abs(touchEndY.current - touchStartY.current);
    const threshold = 80;

    if (Math.abs(diffX) > threshold && diffY < 100) {
      if (diffX > 0) {
        if (currentScreen === SCREENS.GALLERY) {
          navigateTo(SCREENS.CAMERA);
        } else if (currentScreen === SCREENS.CAMERA) {
          navigateTo(SCREENS.MAP);
        }
      } else {
        if (currentScreen === SCREENS.MAP) {
          navigateTo(SCREENS.CAMERA);
        } else if (currentScreen === SCREENS.CAMERA) {
          navigateTo(SCREENS.GALLERY);
        }
      }
    }
    
    isSwiping.current = false;
  };

  // Calculate transform based on current screen
  const getTransform = () => {
    switch (currentScreen) {
      case SCREENS.GALLERY:
        return 'translateX(0%)';
      case SCREENS.CAMERA:
        return 'translateX(-33.333%)';
      case SCREENS.MAP:
        return 'translateX(-66.666%)';
      default:
        return 'translateX(-33.333%)';
    }
  };

  // Show loading while checking auth
  if (authCheckLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="w-16 h-16 rounded-3xl gradient-primary flex items-center justify-center animate-pulse">
          <span className="text-2xl">📍</span>
        </div>
      </div>
    );
  }

  // Show auth screen if not authenticated
  if (!isAuthenticated) {
    return (
      <AuthScreen
        onLogin={handleLogin}
        onRegister={handleRegister}
        isLoading={authLoading}
        error={authError}
      />
    );
  }

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
      className="fixed inset-0 overflow-hidden bg-black"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* User menu button */}
      <button
        onClick={() => setShowUserMenu(!showUserMenu)}
        className="fixed top-6 right-6 z-[100] w-16 h-16 p-3 rounded-2xl glass flex items-center justify-center active-scale shadow-lg hover-lift"
      >
        {user?.avatar ? (
          <img src={user.avatar} alt="" className="w-full h-full rounded-xl object-cover" />
        ) : (
          <User className="w-7 h-7 text-white" />
        )}
      </button>

      {/* User menu dropdown */}
      {showUserMenu && (
        <>
          <div 
            className="fixed inset-0 z-[99]" 
            onClick={() => setShowUserMenu(false)} 
          />
          <div className="fixed top-24 right-6 z-[100] glass-ultra rounded-3xl p-6 min-w-[240px] animate-scale-in shadow-2xl">
            <div className="flex items-center gap-4 pb-5 border-b border-white/10">
              <div className="w-16 h-16 p-3 rounded-2xl gradient-primary flex items-center justify-center shadow-lg">
                <User className="w-full h-full text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-base truncate">{user?.username}</p>
                <p className="text-gray-400 text-xs truncate mt-1">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full mt-4 px-6 py-4 rounded-2xl bg-red-500/20 text-red-400 font-bold flex items-center justify-center gap-3 hover:bg-red-500/30 active-scale transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Đăng xuất
            </button>
          </div>
        </>
      )}

      {/* Screen container with horizontal sliding */}
      <div
        className="flex h-full transition-transform duration-300 ease-out"
        style={{
          width: '300vw',
          transform: getTransform()
        }}
      >
        {/* Gallery Screen - Only show current user's photos */}
        <div className="w-screen h-full flex-shrink-0">
          <GalleryScreen
            photos={photos.filter(p => p.userId === user?.id)}
            onBack={() => navigateTo(SCREENS.CAMERA)}
            onDeletePhoto={handleDeletePhoto}
            onOpenPostViewer={openPostViewer}
          />
        </div>

        {/* Camera Screen */}
        <div className="w-screen h-full flex-shrink-0">
          <CameraScreen
            onNavigateGallery={() => navigateTo(SCREENS.GALLERY)}
            onNavigateMap={() => navigateTo(SCREENS.MAP)}
            onPhotoCapture={handlePhotoCapture}
          />
        </div>

        {/* Map Screen */}
        <div className="w-screen h-full flex-shrink-0">
          <MapScreen
            photos={photos}
            onBack={() => navigateTo(SCREENS.CAMERA)}
            onOpenPostViewer={openPostViewer}
          />
        </div>
      </div>

      {/* Screen indicators */}
      {!postViewerData && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-50 pointer-events-auto p-3 rounded-2xl glass backdrop-blur-lg">
          {[SCREENS.GALLERY, SCREENS.CAMERA, SCREENS.MAP].map((screen) => (
            <button
              key={screen}
              onClick={() => navigateTo(screen)}
              className={`h-3 rounded-full transition-all duration-300 p-1 ${
                currentScreen === screen
                  ? 'w-10 bg-white shadow-lg'
                  : 'w-3 bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      )}

      {/* Post Viewer - Rendered at App level (outside transform container) */}
      {postViewerData && (
        <PostViewer
          photos={photos.filter(p => postViewerData.photoIds.includes(p.id))}
          locationName={postViewerData.locationName}
          onClose={closePostViewer}
          comments={comments}
          onAddComment={addComment}
          onDeleteComment={deleteComment}
          getCommentCount={getCommentCount}
          getComments={getComments}
          onToggleLike={toggleLike}
        />
      )}
    </div>
  );
}

export default App;
