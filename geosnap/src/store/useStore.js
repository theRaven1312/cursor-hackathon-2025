import { useState, useEffect, useCallback } from 'react';
import { photosAPI, commentsAPI } from '../services/api';

// Photos hook - uses API
export const usePhotos = () => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all photos
  const fetchPhotos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await photosAPI.getAll();
      // Transform API response to match frontend format
      const formattedPhotos = data.photos.map(photo => ({
        id: photo.id,
        userId: photo.user_id,
        image: photo.image,
        location: {
          lat: photo.latitude,
          lng: photo.longitude
        },
        address: photo.address,
        rating: photo.rating,
        caption: photo.caption,
        timestamp: new Date(photo.created_at).getTime(),
        author: photo.author_username,
        authorAvatar: photo.author_avatar,
        likesCount: photo.likes_count,
        commentsCount: photo.comments_count,
        userLiked: photo.user_liked
      }));
      setPhotos(formattedPhotos);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch photos:', err);
      setError(err.message);
      // Fallback to localStorage if API fails
      const stored = localStorage.getItem('geosnap_photos');
      if (stored) {
        setPhotos(JSON.parse(stored));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const addPhoto = async (photoData) => {
    try {
      const data = await photosAPI.create(photoData);
      const newPhoto = {
        id: data.photo.id,
        userId: data.photo.user_id,
        image: data.photo.image,
        location: {
          lat: data.photo.latitude,
          lng: data.photo.longitude
        },
        address: data.photo.address,
        rating: data.photo.rating,
        caption: data.photo.caption,
        timestamp: new Date(data.photo.created_at).getTime(),
        author: data.photo.author_username,
        likesCount: 0,
        commentsCount: 0
      };
      setPhotos(prev => [newPhoto, ...prev]);
      return newPhoto;
    } catch (err) {
      console.error('Failed to add photo:', err);
      // Fallback to local storage
      const newPhoto = {
        ...photoData,
        id: Date.now().toString(),
        timestamp: Date.now()
      };
      setPhotos(prev => [newPhoto, ...prev]);
      return newPhoto;
    }
  };

  const deletePhoto = async (id) => {
    try {
      await photosAPI.delete(id);
      setPhotos(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Failed to delete photo:', err);
      // Still remove from local state
      setPhotos(prev => prev.filter(p => p.id !== id));
    }
  };

  const toggleLike = async (id) => {
    try {
      const data = await photosAPI.toggleLike(id);
      setPhotos(prev => prev.map(p => 
        p.id === id 
          ? { ...p, userLiked: data.liked, likesCount: p.likesCount + (data.liked ? 1 : -1) }
          : p
      ));
      return data.liked;
    } catch (err) {
      console.error('Failed to toggle like:', err);
      return null;
    }
  };

  const refetch = () => fetchPhotos();

  return {
    photos,
    loading,
    error,
    addPhoto,
    deletePhoto,
    toggleLike,
    refetch
  };
};

// Comments hook - uses API
export const useComments = () => {
  const [commentsCache, setCommentsCache] = useState({});
  const [loading, setLoading] = useState(false);

  const getComments = async (photoId) => {
    if (commentsCache[photoId]) {
      return commentsCache[photoId];
    }

    try {
      setLoading(true);
      const data = await commentsAPI.getByPhoto(photoId);
      const comments = data.comments.map(c => ({
        id: c.id,
        text: c.text,
        author: c.author_username,
        authorAvatar: c.author_avatar,
        timestamp: new Date(c.created_at).getTime(),
        userId: c.user_id
      }));
      setCommentsCache(prev => ({ ...prev, [photoId]: comments }));
      return comments;
    } catch (err) {
      console.error('Failed to fetch comments:', err);
      return commentsCache[photoId] || [];
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (photoId, text) => {
    try {
      const data = await commentsAPI.create(photoId, text);
      const newComment = {
        id: data.comment.id,
        text: data.comment.text,
        author: data.comment.author_username,
        authorAvatar: data.comment.author_avatar,
        timestamp: new Date(data.comment.created_at).getTime(),
        userId: data.comment.user_id
      };
      setCommentsCache(prev => ({
        ...prev,
        [photoId]: [...(prev[photoId] || []), newComment]
      }));
      return newComment;
    } catch (err) {
      console.error('Failed to add comment:', err);
      // Fallback
      const newComment = {
        id: `c${Date.now()}`,
        text,
        author: 'Bạn',
        timestamp: Date.now()
      };
      setCommentsCache(prev => ({
        ...prev,
        [photoId]: [...(prev[photoId] || []), newComment]
      }));
      return newComment;
    }
  };

  const deleteComment = async (photoId, commentId) => {
    try {
      await commentsAPI.delete(commentId);
      setCommentsCache(prev => ({
        ...prev,
        [photoId]: (prev[photoId] || []).filter(c => c.id !== commentId)
      }));
    } catch (err) {
      console.error('Failed to delete comment:', err);
      // Still remove from cache
      setCommentsCache(prev => ({
        ...prev,
        [photoId]: (prev[photoId] || []).filter(c => c.id !== commentId)
      }));
    }
  };

  const getCommentCount = (photoId) => {
    return (commentsCache[photoId] || []).length;
  };

  // For backward compatibility
  const comments = commentsCache;

  return {
    comments,
    loading,
    getComments,
    addComment,
    deleteComment,
    getCommentCount
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
