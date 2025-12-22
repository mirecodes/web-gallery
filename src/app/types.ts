export interface Photo {
  id: string;
  url: string;
  date: string; // Upload date
  title: string;
  albumId: string;

  // Manually entered
  location?: string;

  // Auto-extracted from EXIF
  takenAt?: string; // The date the photo was actually taken
  cameraMake?: string;
  cameraModel?: string;
  fNumber?: number;
  exposureTime?: number;
  iso?: number;
  gps?: {
    latitude: number;
    longitude: number;
  };
  locationName?: string; // City name from reverse geocoding

  // Original dimensions
  width?: number;
  height?: number;
  aspectRatio: 'landscape' | 'portrait' | 'square';
}

export interface Album {
  id: string;
  name: string;
  description: string;
  theme: string;
  createdAt: string;
  // Note: yearRange is calculated on the client-side in useGallery.ts
  // For a more robust solution, this should be updated via a server-side function.
  yearRange?: {
    start: number;
    end: number;
  };
}

export interface GalleryDocument {
  list: Photo[];
  albums: Album[];
}

export interface AlbumWithStats extends Album {
  coverPhotoUrl?: string;
  photoCount: number;
}
