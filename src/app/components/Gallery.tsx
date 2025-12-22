import { useState, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useGallery } from '../hooks/useGallery';
import { getOptimizedImageUrl } from '../services/cloudinary';
import { Photo } from '../types';
import { PhotoViewer } from './PhotoViewer';

interface GalleryProps {
  albumId?: string;
  onBack?: () => void;
}

export function Gallery({ albumId, onBack }: GalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const { photos, albums, loading, error } = useGallery();

  const filteredPhotos = useMemo(() => {
    // 1. Filter and sort photos
    let sortedPhotos = photos
      .filter(photo => !albumId || photo.albumId === albumId)
      .sort((a, b) => {
        const dateA = new Date(a.takenAt || a.date).getTime();
        const dateB = new Date(b.takenAt || b.date).getTime();
        return dateB - dateA;
      });

    // 2. Apply layout optimization to prevent gaps
    const layoutOptimizedPhotos = [...sortedPhotos];
    let col = 0;
    for (let i = 0; i < layoutOptimizedPhotos.length - 1; i++) {
      const startCol = col % 6;
      const photo1 = layoutOptimizedPhotos[i];
      const photo2 = layoutOptimizedPhotos[i + 1];

      const photo1Span = photo1.aspectRatio === 'landscape' ? 2 : 1;
      const photo2Span = photo2.aspectRatio === 'landscape' ? 2 : 1;

      // If a portrait photo at column 5 is followed by a landscape photo, swap them.
      if (startCol === 4 && photo1Span === 1 && photo2Span === 2) {
        [layoutOptimizedPhotos[i], layoutOptimizedPhotos[i + 1]] = [photo2, photo1];
      }

      // Update column count for the next iteration using the (potentially swapped) photo's span.
      const currentSpan = layoutOptimizedPhotos[i].aspectRatio === 'landscape' ? 2 : 1;
      col += currentSpan;
    }

    return layoutOptimizedPhotos;
  }, [photos, albumId]);

  const currentAlbum = useMemo(() => {
    if (!albumId) return null;
    return albums.find(a => a.id === albumId);
  }, [albums, albumId]);

  if (loading) {
    return <div className="text-white text-center py-12">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center py-12">{error}</div>;
  }

  return (
    <>
      <div className="max-w-[1600px] mx-auto px-6 py-12">
        {/* Album Header */}
        {albumId && currentAlbum && (
          <div className="mb-8">
            <button 
              onClick={onBack}
              className="flex items-center gap-2 text-white/60 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Albums
            </button>
            <h2 className="text-3xl text-white font-light">{currentAlbum.name}</h2>
            <p className="text-white/60 mt-2">{currentAlbum.description}</p>
          </div>
        )}

        {/* Photo Grid */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-0">
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              className={`p-1.5 ${
                photo.aspectRatio === 'landscape'
                  ? 'md:col-span-2'
                  : ''
              }`}
            >
              <div
                className={`group relative overflow-hidden cursor-pointer rounded-lg w-full h-full aspect-square ${
                  photo.aspectRatio === 'landscape'
                    ? 'md:aspect-[3/2]'
                    : 'md:aspect-[3/4]'
                }`}
                onClick={() => setSelectedPhoto(photo)}
              >
                <img
                  src={getOptimizedImageUrl(photo.url, 600)}
                  alt={photo.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-end p-4 opacity-0 group-hover:opacity-100">
                  <div className="text-white">
                    <p className="text-sm font-medium truncate">{photo.title}</p>
                    <p className="text-xs text-white/60">{photo.date}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredPhotos.length === 0 && (
          <div className="text-center py-20 text-white/40">
            <p>No photos in this album yet.</p>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {selectedPhoto && (
        <PhotoViewer
          photos={filteredPhotos}
          initialIndex={filteredPhotos.findIndex(p => p.id === selectedPhoto.id)}
          onClose={() => setSelectedPhoto(null)}
          albumName={currentAlbum?.name}
        />
      )}
    </>
  );
}
