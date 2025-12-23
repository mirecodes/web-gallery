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
  theme: string; // Theme name as a string
  createdAt: string;
  coverPhotoId?: string; // ID of the photo to use as cover
  yearRange?: {
    start: number;
    end: number;
  };
}

// Helper type for UI display
export interface AlbumWithStats extends Album {
  coverPhotoUrl?: string;
  photoCount: number;
  latestPhotoDate?: string; // Date of the most recent photo in the album
}
