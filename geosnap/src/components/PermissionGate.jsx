import { Camera, MapPin, ShieldAlert, RefreshCw } from 'lucide-react';

const PermissionGate = ({ onRequestPermissions, cameraPermission, locationPermission }) => {
  const bothDenied = cameraPermission === 'denied' && locationPermission === 'denied';
  const cameraDenied = cameraPermission === 'denied';
  const locationDenied = locationPermission === 'denied';

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-6 z-50">
      {/* Logo and Title */}
      <div className="text-center mb-12 animate-fade-in">
        <div className="w-24 h-24 mx-auto mb-6 rounded-3xl gradient-primary flex items-center justify-center shadow-2xl">
          <Camera className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
          GeoSnap
        </h1>
        <p className="text-gray-400 text-lg">Share moments, mark places</p>
      </div>

      {/* Permission Status */}
      {bothDenied || cameraDenied || locationDenied ? (
        <div className="w-full max-w-sm animate-scale-in">
          <div className="glass rounded-3xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Permission Required</h3>
                <p className="text-sm text-gray-400">Please enable access to continue</p>
              </div>
            </div>

            <div className="space-y-3">
              {cameraDenied && (
                <div className="flex items-center gap-3 p-3 bg-red-500/10 rounded-xl">
                  <Camera className="w-5 h-5 text-red-400" />
                  <span className="text-sm text-gray-300">Camera access denied</span>
                </div>
              )}
              {locationDenied && (
                <div className="flex items-center gap-3 p-3 bg-red-500/10 rounded-xl">
                  <MapPin className="w-5 h-5 text-red-400" />
                  <span className="text-sm text-gray-300">Location access denied</span>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center">
              Please update permissions in your browser settings and refresh
            </p>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="w-full py-4 rounded-2xl glass-light flex items-center justify-center gap-2 text-white font-medium active:scale-95 transition-transform"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh Page
          </button>
        </div>
      ) : (
        <div className="w-full max-w-sm animate-slide-up">
          {/* Permission Cards */}
          <div className="space-y-4 mb-8">
            <div className="glass rounded-2xl p-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shrink-0">
                <Camera className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Camera Access</h3>
                <p className="text-sm text-gray-400">Take photos and capture moments</p>
              </div>
            </div>

            <div className="glass rounded-2xl p-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl gradient-secondary flex items-center justify-center shrink-0">
                <MapPin className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Location Access</h3>
                <p className="text-sm text-gray-400">Tag photos with your location</p>
              </div>
            </div>
          </div>

          {/* Continue Button */}
          <button
            onClick={onRequestPermissions}
            className="w-full py-4 rounded-2xl gradient-primary text-white font-semibold text-lg shadow-lg shadow-orange-500/30 active:scale-95 transition-transform"
          >
            Get Started
          </button>

          <p className="text-center text-xs text-gray-500 mt-4">
            We only access these while using the app
          </p>
        </div>
      )}
    </div>
  );
};

export default PermissionGate;

