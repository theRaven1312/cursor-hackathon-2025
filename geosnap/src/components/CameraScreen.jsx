import { useRef, useState, useEffect } from 'react';
import { Grid3X3, Map, Camera, X, Send, RotateCcw, MapPin, Loader2, Star, MessageSquare, Navigation } from 'lucide-react';
import { useCurrentLocation } from '../store/useStore';
import { compressImage } from '../utils/helpers';

// Star Rating Component
const StarRating = ({ rating, onRatingChange, size = 'md' }) => {
  const [hoverRating, setHoverRating] = useState(0);
  const sizes = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-9 h-9'
  };

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRatingChange(star)}
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          className="transition-transform active:scale-90"
        >
          <Star
            className={`${sizes[size]} transition-colors ${
              star <= (hoverRating || rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-500'
            }`}
          />
        </button>
      ))}
    </div>
  );
};

const CameraScreen = ({ onNavigateGallery, onNavigateMap, onPhotoCapture }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [facingMode, setFacingMode] = useState('user');
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  // Form states
  const [locationName, setLocationName] = useState('');
  const [rating, setRating] = useState(0);
  const [caption, setCaption] = useState('');
  
  const { location, loading: locationLoading, getCurrentLocation } = useCurrentLocation();

  // Initialize camera
  const startCamera = async (facing = facingMode) => {
    try {
      setCameraError(null);
      setCameraReady(false);
      
      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1080 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      streamRef.current = newStream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setCameraReady(true);
        };
      }
    } catch (err) {
      console.error('Error starting camera:', err);
      setCameraError(err.message || 'Cannot access camera');
    }
  };

  useEffect(() => {
    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Switch camera
  const switchCamera = () => {
    const newFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacing);
    startCamera(newFacing);
  };

  // Capture photo
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || isCapturing || !cameraReady) return;

    setIsCapturing(true);

    // Flash effect
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 150);

    // Get current location
    let currentLocation = location;
    if (!currentLocation) {
      try {
        currentLocation = await getCurrentLocation();
      } catch (err) {
        console.error('Could not get location:', err);
        // Use default Ho Chi Minh City location if GPS fails
        currentLocation = { lat: 10.7769, lng: 106.7009 };
      }
    }

    // Capture from video
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const size = Math.min(video.videoWidth, video.videoHeight);
    
    if (size === 0) {
      setIsCapturing(false);
      return;
    }
    
    canvas.width = size;
    canvas.height = size;
    
    const ctx = canvas.getContext('2d');
    
    // Calculate crop to center square
    const offsetX = (video.videoWidth - size) / 2;
    const offsetY = (video.videoHeight - size) / 2;
    
    // Mirror if front camera
    if (facingMode === 'user') {
      ctx.translate(size, 0);
      ctx.scale(-1, 1);
    }
    
    ctx.drawImage(video, offsetX, offsetY, size, size, 0, 0, size, size);
    
    const imageData = compressImage(canvas, 0.85, 800);
    
    setCapturedImage({
      image: imageData,
      location: currentLocation
    });

    // Reset form
    setLocationName('');
    setRating(0);
    setCaption('');
    setShowForm(true);
    setIsCapturing(false);
  };

  // Save photo with form data
  const savePhoto = () => {
    if (capturedImage) {
      onPhotoCapture({
        ...capturedImage,
        address: locationName || 'Unknown location',
        rating: rating,
        caption: caption
      });
      setCapturedImage(null);
      setShowForm(false);
      setLocationName('');
      setRating(0);
      setCaption('');
    }
  };

  // Discard photo
  const discardPhoto = () => {
    setCapturedImage(null);
    setShowForm(false);
    setLocationName('');
    setRating(0);
    setCaption('');
  };

  return (
    <div className="h-full w-full bg-black flex flex-col relative overflow-hidden">
      {/* Flash overlay */}
      {isFlashing && (
        <div className="absolute inset-0 bg-white z-50 animate-flash" />
      )}

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center relative px-6 py-8">
        {/* Camera viewfinder */}
        {!capturedImage ? (
          <div className="relative w-full max-w-[360px] aspect-square">
            {/* Video container with rounded corners */}
            <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden shadow-2xl bg-neutral-900 ring-2 ring-white/10">
              {cameraError ? (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mb-6">
                    <Camera className="w-8 h-8 text-red-400" />
                  </div>
                  <p className="text-red-400 text-sm font-medium mb-2">{cameraError}</p>
                  <button
                    onClick={() => startCamera()}
                    className="mt-4 px-6 py-2.5 rounded-full glass text-white text-sm font-medium active-scale"
                  >
                    Thử lại
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                    style={{ minHeight: '100%', minWidth: '100%' }}
                  />
                  {!cameraReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
                      <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Corner decorations */}
            <div className="absolute -inset-2 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
                <path d="M2 20 L2 8 Q2 2 8 2 L20 2" stroke="white" strokeWidth="0.5" strokeLinecap="round" opacity="0.5"/>
                <path d="M80 2 L92 2 Q98 2 98 8 L98 20" stroke="white" strokeWidth="0.5" strokeLinecap="round" opacity="0.5"/>
                <path d="M2 80 L2 92 Q2 98 8 98 L20 98" stroke="white" strokeWidth="0.5" strokeLinecap="round" opacity="0.5"/>
                <path d="M80 98 L92 98 Q98 98 98 92 L98 80" stroke="white" strokeWidth="0.5" strokeLinecap="round" opacity="0.5"/>
              </svg>
            </div>

            {/* Camera switch button */}
            <button
              onClick={switchCamera}
              className="absolute top-5 right-5 w-12 h-12 rounded-2xl glass flex items-center justify-center active-scale shadow-lg hover-lift"
            >
              <RotateCcw className="w-5 h-5 text-white" />
            </button>

            {/* Location indicator */}
            <div className="absolute bottom-5 left-5 glass rounded-full px-4 py-2 flex items-center gap-2.5 shadow-lg z-10">
              {locationLoading ? (
                <Loader2 className="w-4 h-4 text-orange-400 animate-spin" />
              ) : (
                <MapPin className="w-4 h-4 text-orange-400" />
              )}
              <span className="text-xs text-white font-medium">
                {location ? 'Vị trí sẵn sàng' : 'Đang lấy vị trí...'}
              </span>
            </div>
          </div>
        ) : (
          /* Preview captured image with form */
          <div className="w-full max-w-[380px] animate-scale-in">
            {/* Image preview - smaller when form is shown */}
            <div className={`relative ${showForm ? 'w-40 h-40 mx-auto mb-4' : 'w-full aspect-square'}`}>
              <div className="absolute inset-0 rounded-[1.5rem] overflow-hidden shadow-2xl">
                <img
                  src={capturedImage.image}
                  alt="Captured"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Form */}
            {showForm && (
              <div className="glass-ultra rounded-3xl p-6 space-y-5 animate-slide-up shadow-2xl">
                {/* Location name input */}
                <div>
                  <label className="flex items-center gap-2.5 text-sm text-gray-400 mb-3">
                    <div className="w-5 h-5 rounded-lg bg-orange-500/20 flex items-center justify-center">
                      <Navigation className="w-3.5 h-3.5 text-orange-400" />
                    </div>
                    Tên địa điểm
                  </label>
                  <input
                    type="text"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="Nhập tên địa điểm..."
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-orange-400 focus:bg-white/15 transition-all"
                  />
                </div>

                {/* Star rating */}
                <div>
                  <label className="flex items-center gap-2.5 text-sm text-gray-400 mb-3">
                    <div className="w-5 h-5 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                      <Star className="w-3.5 h-3.5 text-yellow-400" />
                    </div>
                    Đánh giá
                  </label>
                  <div className="flex items-center gap-4">
                    <StarRating rating={rating} onRatingChange={setRating} size="md" />
                    {rating > 0 && (
                      <div className="flex items-center gap-2 bg-yellow-500/20 px-3 py-1.5 rounded-full animate-scale-in">
                        <span className="text-yellow-400 font-bold text-lg">{rating}</span>
                        <span className="text-yellow-400/80 text-xs">/5</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Caption input */}
                <div>
                  <label className="flex items-center gap-2.5 text-sm text-gray-400 mb-3">
                    <div className="w-5 h-5 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    Bài đăng
                  </label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Chia sẻ cảm nghĩ của bạn..."
                    rows={3}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 focus:bg-white/15 transition-all resize-none"
                  />
                </div>

                {/* Location coordinates */}
                <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-white/10">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>
                    {capturedImage.location.lat.toFixed(4)}, {capturedImage.location.lng.toFixed(4)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action bar */}
      <div className="h-32 flex items-center justify-center px-8 shrink-0">
        {!capturedImage ? (
          <div className="flex items-center justify-between w-full max-w-[360px]">
            {/* Gallery button */}
            <button
              onClick={onNavigateGallery}
              className="w-16 h-16 rounded-2xl glass flex items-center justify-center active-scale shadow-lg hover-lift"
            >
              <Grid3X3 className="w-6 h-6 text-white" />
            </button>

            {/* Capture button */}
            <button
              onClick={capturePhoto}
              disabled={isCapturing || !cameraReady}
              className="relative w-24 h-24 rounded-full flex items-center justify-center active-scale disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 rounded-full border-4 border-white/40" />
              <div className="w-20 h-20 rounded-full gradient-primary shadow-glow-primary flex items-center justify-center">
                {isCapturing ? (
                  <Loader2 className="w-9 h-9 text-white animate-spin" />
                ) : (
                  <Camera className="w-9 h-9 text-white" />
                )}
              </div>
              {isCapturing && (
                <div className="absolute inset-0 rounded-full bg-orange-500/50 animate-pulse-ring" />
              )}
            </button>

            {/* Map button */}
            <button
              onClick={onNavigateMap}
              className="w-16 h-16 rounded-2xl glass flex items-center justify-center active-scale shadow-lg hover-lift"
            >
              <Map className="w-6 h-6 text-white" />
            </button>
          </div>
        ) : (
          /* Preview actions */
          <div className="flex items-center gap-4 animate-slide-up">
            {/* Discard button */}
            <button
              onClick={discardPhoto}
              className="w-16 h-16 rounded-2xl glass flex items-center justify-center active-scale shadow-lg"
            >
              <X className="w-7 h-7 text-white" />
            </button>

            {/* Save button */}
            <button
              onClick={savePhoto}
              disabled={!locationName.trim()}
              className="px-10 py-5 rounded-2xl gradient-success shadow-glow-primary flex items-center justify-center gap-3 active-scale disabled:opacity-50 disabled:cursor-not-allowed hover-lift"
            >
              <Send className="w-5 h-5 text-white" />
              <span className="text-white font-bold text-lg">Đăng</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraScreen;
