import { useState, useEffect, useCallback, useMemo } from 'react';
import { getGalleryData, addPhoto, addAlbum } from '../services/firebase';
import { uploadToCloudinary } from '../services/cloudinary';
import { Photo, Album, AlbumWithStats } from '../types';
import exifr from 'exifr';

export const useGallery = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { list, albums: albumList } = await getGalleryData();
      setPhotos(list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
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

  const uploadAndAddPhoto = async (file: File, title: string, albumId: string, preExtractedMetadata?: any) => {
    try {
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
          console.warn('Failed to extract EXIF data:', e);
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
        id: new Date().toISOString(),
        url: imageUrl,
        date: new Date().toISOString().split('T')[0].replace(/-/g, '.'), // Upload date
        title,
        // location field is removed from manual input, relying on GPS or future reverse geocoding
        albumId,
        width: image.width,
        height: image.height,
        aspectRatio: image.width > image.height ? 'landscape' : 'portrait',
        ...exifData // Spread extracted metadata
      };

      // 5. Save to Firestore
      await addPhoto(newPhoto);
      setPhotos(prevPhotos => [newPhoto, ...prevPhotos]);
    } catch (err) {
      setError('Failed to upload and add photo.');
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
    createAlbum 
  };
};
