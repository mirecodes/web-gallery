import { useState, useEffect, useCallback, useMemo } from 'react';
import { getGalleryData, addPhoto, addAlbum } from '../services/firebase';
import { uploadToCloudinary } from '../services/cloudinary';
import { Photo, Album, AlbumWithStats } from '../types';
import exifr from 'exifr';
import { getCityFromCoordinates } from '../services/geocoding';

export const useGallery = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { list, albums: albumList } = await getGalleryData();

      // --- Data Integrity Check ---
      const validAlbumIds = new Set(albumList.map(a => a.id));
      const validatedPhotos = list.map(photo => {
        // If a photo has an albumId that no longer exists, treat it as un-albumed.
        if (photo.albumId && !validAlbumIds.has(photo.albumId)) {
          return { ...photo, albumId: '' };
        }
        return photo;
      });
      // --- End of Check ---

      setPhotos(validatedPhotos.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setAlbums(albumList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
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
    return albums.map(album => {
      const albumPhotos = photos.filter(p => p.albumId === album.id);
      const coverPhoto = albumPhotos.length > 0 ? albumPhotos[0] : undefined;
      
      return {
        ...album,
        photoCount: albumPhotos.length,
        coverPhotoUrl: coverPhoto?.url
      };
    });
  }, [albums, photos]);

  const processAndUploadSinglePhoto = async (file: File, title: string, albumId: string, preExtractedMetadata?: any) => {
    // 1. Use pre-extracted metadata or extract it now
    let exifData = preExtractedMetadata || {};
    
    if (!preExtractedMetadata) {
      try {
        const output = await exifr.parse(file, {
          tiff: true,
          exif: true,
          gps: true,
        });
        
        if (output) {
          exifData = {
            takenAt: output.DateTimeOriginal ? output.DateTimeOriginal.toISOString() : undefined,
            cameraMake: output.Make,
            cameraModel: output.Model,
            fNumber: output.FNumber,
            exposureTime: output.ExposureTime,
            iso: output.ISO,
            gps: output.latitude && output.longitude ? {
              latitude: output.latitude,
              longitude: output.longitude
            } : undefined
          };
        }
      } catch (e) {
        console.warn(`Failed to extract EXIF data for ${file.name}:`, e);
      }
    }

    // Fetch location name if GPS exists but locationName is missing (e.g. batch upload)
    if (exifData.gps && !exifData.locationName) {
      const city = await getCityFromCoordinates(exifData.gps.latitude, exifData.gps.longitude);
      if (city) {
        exifData.locationName = city;
      }
    }

    // 2. Upload to Cloudinary
    const imageUrl = await uploadToCloudinary(file);
    
    // 3. Get Image Dimensions
    const image = new Image();
    image.src = imageUrl;
    await image.decode();

    // 4. Create Photo Object
    const newPhoto: Photo = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Unique ID
      url: imageUrl,
      date: new Date().toISOString().split('T')[0].replace(/-/g, '.'), // Upload date
      title,
      albumId,
      width: image.width,
      height: image.height,
      aspectRatio: image.width > image.height ? 'landscape' : 'portrait',
      ...exifData
    };

    // 5. Save to Firestore
    await addPhoto(newPhoto);
    return newPhoto;
  };

  const uploadAndAddPhoto = async (file: File, title: string, albumId: string, preExtractedMetadata?: any) => {
    try {
      const newPhoto = await processAndUploadSinglePhoto(file, title, albumId, preExtractedMetadata);
      setPhotos(prevPhotos => [newPhoto, ...prevPhotos]);
    } catch (err) {
      setError('Failed to upload and add photo.');
      console.error(err);
      throw err;
    }
  };

  const batchUploadPhotos = async (files: File[], albumId: string, onProgress?: (completed: number, total: number) => void) => {
    try {
      let completedCount = 0;
      const total = files.length;
      const newPhotos: Photo[] = [];

      const chunkSize = 3;
      for (let i = 0; i < files.length; i += chunkSize) {
        const chunk = files.slice(i, i + chunkSize);
        const promises = chunk.map(async (file) => {
          const title = file.name.replace(/\.[^/.]+$/, "");
          const photo = await processAndUploadSinglePhoto(file, title, albumId);
          return photo;
        });

        const results = await Promise.all(promises);
        newPhotos.push(...results);
        completedCount += results.length;
        if (onProgress) onProgress(completedCount, total);
      }

      setPhotos(prevPhotos => [...newPhotos, ...prevPhotos]);
    } catch (err)
 {
      setError('Failed to batch upload photos.');
      console.error(err);
      throw err;
    }
  };

  const createAlbum = async (name: string, description: string, theme: string) => {
    try {
      const newAlbum: Album = {
        id: Date.now().toString(),
        name,
        description,
        theme,
        createdAt: new Date().toISOString()
      };

      await addAlbum(newAlbum);
      setAlbums(prevAlbums => [newAlbum, ...prevAlbums]);
      return newAlbum.id;
    } catch (err) {
      setError('Failed to create album.');
      console.error(err);
      throw err;
    }
  };

  return { 
    photos, 
    albums: albumsWithStats, 
    loading, 
    error, 
    refetch: fetchData, 
    uploadAndAddPhoto,
    batchUploadPhotos,
    createAlbum 
  };
};
