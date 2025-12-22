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
}

export interface GalleryDocument {
  list: Photo[];
  albums: Album[];
}

export interface AlbumWithStats extends Album {
  coverPhotoUrl?: string;
  photoCount: number;
}
