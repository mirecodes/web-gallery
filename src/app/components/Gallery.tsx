import { useState, useMemo } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { useGallery } from '../hooks/useGallery';
import { getOptimizedImageUrl } from '../services/cloudinary';
import { Photo } from '../types';
import { PhotoViewer } from './PhotoViewer';

interface GalleryProps {
  albumId?: string;
  onBack?: () => void;
  isEditMode?: boolean;
}

export function Gallery({ albumId, onBack, isEditMode = false }: GalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { photos, albums, loading, error } = useGallery();

  const filteredPhotos = useMemo(() => {
    // 1. Filter and sort photos
    let sortedPhotos = photos
      .filter(photo => {
        if (albumId && photo.albumId !== albumId) return false;
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const photoAlbum = albums.find(a => a.id === photo.albumId);
          
          return (
            photo.title.toLowerCase().includes(query) ||
            photo.locationName?.toLowerCase().includes(query) ||
            (photo.takenAt || photo.date).toLowerCase().includes(query) ||
            photoAlbum?.name.toLowerCase().includes(query) ||
            photoAlbum?.theme.toLowerCase().includes(query)
          );
        }
        return true;
      })
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

      if (startCol === 4 && photo1Span === 1 && photo2Span === 2) {
        [layoutOptimizedPhotos[i], layoutOptimizedPhotos[i + 1]] = [photo2, photo1];
      }

      const currentSpan = layoutOptimizedPhotos[i].aspectRatio === 'landscape' ? 2 : 1;
      col += currentSpan;
    }

    return layoutOptimizedPhotos;
  }, [photos, albums, albumId, searchQuery]);

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
        {/* Header */}
        <div className="mb-8">
          {albumId && currentAlbum ? (
            <>
              <button 
                onClick={onBack}
                className="flex items-center gap-2 text-white/60 hover:text-white mb-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Albums
              </button>
              <h2 className="text-3xl text-white font-light">{currentAlbum.name}</h2>
              <p className="text-white/60 mt-2">{currentAlbum.description}</p>
            </>
          ) : (
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  placeholder="Search by title, location, date, album, or theme..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-full text-white placeholder-white/40 focus:outline-none focus:border-white/60 transition-colors"
                />
              </div>
            </div>
          )}
        </div>

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
            <p>No photos found for your search.</p>
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
          isEditMode={isEditMode}
        />
      )}
    </>
  );
}
