import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  getGalleryData, 
  addPhoto, 
  updatePhoto, 
  deletePhoto, 
  addAlbum,
  updateAlbum as fbUpdateAlbum,
  deleteAlbum,
  logDeletedPhoto,
  updatePhotosAlbumId
} from '../services/firebase';
import { uploadToCloudinary } from '../services/cloudinary';
import { Photo, Album, AlbumWithStats } from '../types';
import exifr from 'exifr';
import { getCityFromCoordinates } from '../services/geocoding';

type PhotoWithChunk = Photo & { _chunkId: string };

export const useGallery = () => {
  const [photos, setPhotos] = useState<PhotoWithChunk[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { photos, albums } = await getGalleryData();
      setPhotos(photos.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setAlbums(albums);
    } catch (err) {
      setError('Failed to fetch gallery data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const albumsWithStats: AlbumWithStats[] = useMemo(() => {
    const albumsWithComputedStats = albums.map(album => {
      const albumPhotos = photos.filter(p => p.albumId === album.id);
      
      // Determine cover photo:
      // 1. If coverPhotoId is set and exists in photos, use it.
      // 2. Fallback to the first photo in the album.
      let coverPhoto: Photo | undefined;
      if (album.coverPhotoId) {
        coverPhoto = photos.find(p => p.id === album.coverPhotoId);
      }
      if (!coverPhoto && albumPhotos.length > 0) {
        coverPhoto = albumPhotos[0];
      }
      
      let yearRange: { start: number, end: number } | undefined = undefined;
      if (albumPhotos.length > 0) {
        const years = albumPhotos.map(p => new Date(p.takenAt || p.date).getFullYear());
        yearRange = { start: Math.min(...years), end: Math.max(...years) };
      }

      return {
        ...album,
        photoCount: albumPhotos.length,
        coverPhotoUrl: coverPhoto?.url,
        yearRange: yearRange,
      };
    });

    return albumsWithComputedStats.sort((a, b) => {
      const endYearA = a.yearRange?.end || 0;
      const endYearB = b.yearRange?.end || 0;
      if (endYearA !== endYearB) return endYearB - endYearA;
      return a.name.localeCompare(b.name);
    });
  }, [albums, photos]);

  const updatePhotoDetails = async (photoId: string, details: Partial<Pick<Photo, 'title' | 'albumId'>>) => {
    try {
      const photoToUpdate = photos.find(p => p.id === photoId);
      if (!photoToUpdate) throw new Error("Photo not found in local state");
      
      await updatePhoto(photoId, photoToUpdate._chunkId, details);
      setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, ...details } : p));
    } catch (err) { console.error(err); throw err; }
  };

  const deletePhotoItem = async (photoId: string) => {
    try {
      const photoToDelete = photos.find(p => p.id === photoId);
      if (!photoToDelete) throw new Error("Photo not found in local state");

      await logDeletedPhoto(photoToDelete);
      await deletePhoto(photoId, photoToDelete._chunkId);
      setPhotos(prev => prev.filter(p => p.id !== photoId));
    } catch (err) { console.error(err); throw err; }
  };

  const updateAlbum = async (albumId: string, details: Partial<Album>, oldTheme?: string) => {
    try {
      // If theme name has changed, update all albums that used the old theme.
      if (details.theme && oldTheme && details.theme !== oldTheme) {
        const themeUpdatePromises = albums
          .filter(a => a.theme === oldTheme)
          .map(a => fbUpdateAlbum(a.id, { theme: details.theme }));
        await Promise.all(themeUpdatePromises);
      }
      
      // Update the primary album's details.
      await fbUpdateAlbum(albumId, details);

      // Update local state optimistically
      setAlbums(prev => prev.map(a => a.id === albumId ? { ...a, ...details } : a));
    } catch (err) {
      console.error("Failed to update album:", err);
      throw err;
    }
  };

  const deleteAlbumItem = async (albumId: string) => {
    try {
      await deleteAlbum(albumId);
      setAlbums(prev => prev.filter(a => a.id !== albumId));
      fetchData(); 
    } catch (err) { console.error(err); throw err; }
  };

  const transferAlbumPhotos = async (sourceAlbumId: string, targetAlbumId: string, deleteSource: boolean) => {
    try {
      const photosToTransfer = photos
        .filter(p => p.albumId === sourceAlbumId)
        .map(p => ({ photoId: p.id, chunkId: p._chunkId }));

      if (photosToTransfer.length > 0) {
        await updatePhotosAlbumId(photosToTransfer, targetAlbumId);
      }

      if (deleteSource) {
        await deleteAlbum(sourceAlbumId);
      }
      
      fetchData();

    } catch (err) { console.error(err); throw err; }
  };

  const createAlbum = async (name: string, description: string, theme: string) => {
    try {
      const newAlbum: Album = { id: `album_${Date.now()}`, name, description, theme, createdAt: new Date().toISOString() };
      await addAlbum(newAlbum);
      setAlbums(prev => [...prev, newAlbum]);
      return newAlbum.id;
    } catch (err) { console.error(err); throw err; }
  };

  const processAndUploadSinglePhoto = async (file: File, title: string, albumId: string, preExtractedMetadata?: any) => {
    let exifData = preExtractedMetadata || {};
    if (!preExtractedMetadata) {
      try {
        const output = await exifr.parse(file, { tiff: true, exif: true, gps: true });
        if (output) {
          exifData = {
            takenAt: output.DateTimeOriginal?.toISOString(),
            cameraMake: output.Make,
            cameraModel: output.Model,
            fNumber: output.FNumber,
            exposureTime: output.ExposureTime,
            iso: output.ISO,
            gps: output.latitude && output.longitude ? { latitude: output.latitude, longitude: output.longitude } : undefined
          };
        }
      } catch (e) { console.warn(`Failed to extract EXIF data for ${file.name}:`, e); }
    }
    if (exifData.gps && !exifData.locationName) {
      const city = await getCityFromCoordinates(exifData.gps.latitude, exifData.gps.longitude);
      if (city) { exifData.locationName = city; }
    }
    const imageUrl = await uploadToCloudinary(file);
    const image = new Image();
    image.src = imageUrl;
    await image.decode();

    // Create photo object and remove undefined fields
    const newPhoto: Photo = {
      id: `photo_${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url: imageUrl,
      date: new Date().toISOString().split('T')[0],
      title,
      albumId,
      width: image.width,
      height: image.height,
      aspectRatio: image.width > image.height ? 'landscape' : 'portrait',
      ...exifData
    };

    // Remove undefined values to prevent Firestore errors
    Object.keys(newPhoto).forEach(key => {
      if ((newPhoto as any)[key] === undefined) {
        delete (newPhoto as any)[key];
      }
    });

    const chunkId = await addPhoto(newPhoto);
    return { ...newPhoto, _chunkId: chunkId };
  };

  const uploadAndAddPhoto = async (file: File, title: string, albumId: string, preExtractedMetadata?: any) => {
    try {
      const newPhoto = await processAndUploadSinglePhoto(file, title, albumId, preExtractedMetadata);
      setPhotos(prev => [newPhoto, ...prev]);
    } catch (err) { console.error(err); throw err; }
  };

  const batchUploadPhotos = async (files: File[], albumId: string, onProgress?: (completed: number, total: number) => void) => {
    try {
      let completedCount = 0;
      const total = files.length;
      const newPhotos: PhotoWithChunk[] = [];
      const chunkSize = 3;
      for (let i = 0; i < files.length; i += chunkSize) {
        const chunk = files.slice(i, i + chunkSize);
        const promises = chunk.map(async (file) => {
          const photo = await processAndUploadSinglePhoto(file, file.name.replace(/\.[^/.]+$/, ""), albumId);
          completedCount++;
          onProgress?.(completedCount, total);
          return photo;
        });
        const results = await Promise.all(promises);
        newPhotos.push(...results);
      }
      setPhotos(prev => [...newPhotos, ...prev]);
    } catch (err) { console.error(err); throw err; }
  };

  return { 
    photos, albums: albumsWithStats, loading, error, refetch: fetchData, 
    uploadAndAddPhoto, batchUploadPhotos, createAlbum, updatePhotoDetails, deletePhotoItem,
    updateAlbum, deleteAlbumItem, transferAlbumPhotos
  };
};
