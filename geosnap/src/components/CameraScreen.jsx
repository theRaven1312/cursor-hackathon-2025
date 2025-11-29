import { useRef, useState, useEffect, useCallback } from 'react';
import { Grid3X3, Map, Camera, X, Send, RotateCcw, MapPin, Loader2 } from 'lucide-react';
import { useCurrentLocation } from '../store/useStore';
import { compressImage } from '../utils/helpers';

const CameraScreen = ({ onNavigateGallery, onNavigateMap, onPhotoCapture }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [facingMode, setFacingMode] = useState('user');
  const [isCapturing, setIsCapturing] = useState(false);
  const { location, loading: locationLoading, getCurrentLocation } = useCurrentLocation();

  // Initialize camera
  const startCamera = useCallback(async (facing = facingMode) => {
    try {
      // Stop existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1080 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.error('Error starting camera:', err);
    }
  }, [stream, facingMode]);

  useEffect(() => {
    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
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
    if (!videoRef.current || !canvasRef.current || isCapturing) return;

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

    setIsCapturing(false);
  };

  // Save photo
  const savePhoto = () => {
    if (capturedImage) {
      onPhotoCapture(capturedImage);
      setCapturedImage(null);
    }
  };

  // Discard photo
  const discardPhoto = () => {
    setCapturedImage(null);
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
      <div className="flex-1 flex items-center justify-center relative">
        {/* Camera viewfinder */}
        {!capturedImage ? (
          <div className="relative w-[85vw] max-w-[400px] aspect-square">
            {/* Video container with rounded corners */}
            <div className="absolute inset-0 rounded-[2rem] overflow-hidden shadow-2xl">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />
            </div>

            {/* Corner decorations */}
            <div className="absolute -inset-2 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
                {/* Top left corner */}
                <path d="M2 20 L2 8 Q2 2 8 2 L20 2" stroke="white" strokeWidth="0.5" strokeLinecap="round" opacity="0.5"/>
                {/* Top right corner */}
                <path d="M80 2 L92 2 Q98 2 98 8 L98 20" stroke="white" strokeWidth="0.5" strokeLinecap="round" opacity="0.5"/>
                {/* Bottom left corner */}
                <path d="M2 80 L2 92 Q2 98 8 98 L20 98" stroke="white" strokeWidth="0.5" strokeLinecap="round" opacity="0.5"/>
                {/* Bottom right corner */}
                <path d="M80 98 L92 98 Q98 98 98 92 L98 80" stroke="white" strokeWidth="0.5" strokeLinecap="round" opacity="0.5"/>
              </svg>
            </div>

            {/* Camera switch button */}
            <button
              onClick={switchCamera}
              className="absolute top-4 right-4 w-10 h-10 rounded-full glass flex items-center justify-center active:scale-90 transition-transform"
            >
              <RotateCcw className="w-5 h-5 text-white" />
            </button>

            {/* Location indicator */}
            <div className="absolute bottom-4 left-4 glass rounded-full px-3 py-1.5 flex items-center gap-2">
              {locationLoading ? (
                <Loader2 className="w-4 h-4 text-orange-400 animate-spin" />
              ) : (
                <MapPin className="w-4 h-4 text-orange-400" />
              )}
              <span className="text-xs text-white font-medium">
                {location ? 'Location ready' : 'Getting location...'}
              </span>
            </div>
          </div>
        ) : (
          /* Preview captured image */
          <div className="relative w-[85vw] max-w-[400px] aspect-square animate-scale-in">
            <div className="absolute inset-0 rounded-[2rem] overflow-hidden shadow-2xl">
              <img
                src={capturedImage.image}
                alt="Captured"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Location badge */}
            <div className="absolute bottom-4 left-4 glass rounded-full px-3 py-1.5 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-green-400" />
              <span className="text-xs text-white font-medium">
                {capturedImage.location.lat.toFixed(4)}, {capturedImage.location.lng.toFixed(4)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Action bar */}
      <div className="h-32 flex items-center justify-center px-6 pb-safe">
        {!capturedImage ? (
          <div className="flex items-center justify-between w-full max-w-[320px]">
            {/* Gallery button */}
            <button
              onClick={onNavigateGallery}
              className="w-14 h-14 rounded-2xl glass flex items-center justify-center active:scale-90 transition-transform"
            >
              <Grid3X3 className="w-6 h-6 text-white" />
            </button>

            {/* Capture button */}
            <button
              onClick={capturePhoto}
              disabled={isCapturing}
              className="relative w-20 h-20 rounded-full flex items-center justify-center active:scale-90 transition-transform disabled:opacity-50"
            >
              {/* Outer ring */}
              <div className="absolute inset-0 rounded-full border-4 border-white/30" />
              {/* Inner button */}
              <div className="w-16 h-16 rounded-full gradient-primary shadow-lg shadow-orange-500/50 flex items-center justify-center">
                {isCapturing ? (
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                ) : (
                  <Camera className="w-8 h-8 text-white" />
                )}
              </div>
              {/* Pulse effect when capturing */}
              {isCapturing && (
                <div className="absolute inset-0 rounded-full bg-orange-500/50 animate-pulse-ring" />
              )}
            </button>

            {/* Map button */}
            <button
              onClick={onNavigateMap}
              className="w-14 h-14 rounded-2xl glass flex items-center justify-center active:scale-90 transition-transform"
            >
              <Map className="w-6 h-6 text-white" />
            </button>
          </div>
        ) : (
          /* Preview actions */
          <div className="flex items-center gap-6 animate-slide-up">
            {/* Discard button */}
            <button
              onClick={discardPhoto}
              className="w-16 h-16 rounded-full glass flex items-center justify-center active:scale-90 transition-transform"
            >
              <X className="w-8 h-8 text-white" />
            </button>

            {/* Save button */}
            <button
              onClick={savePhoto}
              className="w-20 h-20 rounded-full gradient-success shadow-lg shadow-green-500/50 flex items-center justify-center active:scale-90 transition-transform"
            >
              <Send className="w-8 h-8 text-white" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraScreen;

