import { useState, useEffect } from 'react';

// Mock data - photos around Ho Chi Minh City
const MOCK_PHOTOS = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400&h=400&fit=crop',
    location: {
      lat: 10.7769,
      lng: 106.7009
    },
    timestamp: Date.now() - 86400000 * 2, // 2 days ago
    address: 'Ben Thanh Market',
    rating: 5,
    caption: 'Chợ Bến Thành buổi sáng thật tuyệt vời! 🌅'
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1555921015-5532091f6026?w=400&h=400&fit=crop',
    location: {
      lat: 10.7867,
      lng: 106.6964
    },
    timestamp: Date.now() - 86400000, // 1 day ago
    address: 'Notre-Dame Cathedral',
    rating: 4,
    caption: 'Nhà thờ Đức Bà cổ kính giữa lòng thành phố 🏛️'
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=400&h=400&fit=crop',
    location: {
      lat: 10.7731,
      lng: 106.7046
    },
    timestamp: Date.now() - 3600000 * 5, // 5 hours ago
    address: 'Independence Palace',
    rating: 5,
    caption: 'Dinh Độc Lập - nơi lưu giữ lịch sử 🇻🇳'
  },
  {
    id: '4',
    image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=400&h=400&fit=crop',
    location: {
      lat: 10.7628,
      lng: 106.6603
    },
    timestamp: Date.now() - 3600000, // 1 hour ago
    address: 'Landmark 81',
    rating: 4,
    caption: 'View từ Landmark 81 về đêm cực đẹp! 🌃'
  }
];

const STORAGE_KEY = 'geosnap_photos';

// Initialize localStorage with mock data if empty
const initializeStorage = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_PHOTOS));
    return MOCK_PHOTOS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_PHOTOS));
    return MOCK_PHOTOS;
  }
};

export const usePhotos = () => {
  const [photos, setPhotos] = useState(() => initializeStorage());

  // Save to localStorage whenever photos change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
  }, [photos]);

  const addPhoto = (photo) => {
    const newPhoto = {
      ...photo,
      id: Date.now().toString(),
      timestamp: Date.now()
    };
    setPhotos(prev => [newPhoto, ...prev]);
    return newPhoto;
  };

  const deletePhoto = (id) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  const getPhotosByLocation = (lat, lng, radius = 0.01) => {
    return photos.filter(photo => {
      const dLat = Math.abs(photo.location.lat - lat);
      const dLng = Math.abs(photo.location.lng - lng);
      return dLat < radius && dLng < radius;
    });
  };

  return {
    photos,
    addPhoto,
    deletePhoto,
    getPhotosByLocation
  };
};

// Permission hook
export const usePermissions = () => {
  const [cameraPermission, setCameraPermission] = useState('prompt');
  const [locationPermission, setLocationPermission] = useState('prompt');

  const requestCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setCameraPermission('granted');
      return true;
    } catch {
      setCameraPermission('denied');
      return false;
    }
  };

  const requestLocation = async () => {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => {
          setLocationPermission('granted');
          resolve(true);
        },
        () => {
          setLocationPermission('denied');
          resolve(false);
        },
        { enableHighAccuracy: true }
      );
    });
  };

  const requestAllPermissions = async () => {
    const [camera, location] = await Promise.all([
      requestCamera(),
      requestLocation()
    ]);
    return { camera, location };
  };

  return {
    cameraPermission,
    locationPermission,
    requestCamera,
    requestLocation,
    requestAllPermissions
  };
};

// Current location hook
export const useCurrentLocation = () => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getCurrentLocation = () => {
    setLoading(true);
    setError(null);

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        setError('Geolocation is not supported');
        setLoading(false);
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setLocation(loc);
          setLoading(false);
          resolve(loc);
        },
        (err) => {
          setError(err.message);
          setLoading(false);
          reject(err);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  };

  return {
    location,
    loading,
    error,
    getCurrentLocation
  };
};
