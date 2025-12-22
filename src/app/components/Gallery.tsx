import { useState, useMemo } from 'react';
import { MapPin, Camera, Aperture, Clock, Calendar, ArrowLeft } from 'lucide-react';
import { useGallery } from '../hooks/useGallery';
import { getOptimizedImageUrl } from '../services/cloudinary';
import { Photo } from '../types';

interface GalleryProps {
  albumId?: string;
  onBack?: () => void;
}

export function Gallery({ albumId, onBack }: GalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const { photos, albums, loading, error } = useGallery();

  const filteredPhotos = useMemo(() => {
    if (!albumId) return photos;
    return photos.filter(photo => photo.albumId === albumId);
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
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-0">
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
                className={`group relative overflow-hidden cursor-pointer rounded-lg w-full h-full ${
                  photo.aspectRatio === 'landscape'
                    ? 'aspect-[3/2]'
                    : 'aspect-[3/4]'
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
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-6"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="max-w-6xl w-full max-h-[90vh] flex flex-col md:flex-row gap-6" onClick={e => e.stopPropagation()}>
            {/* Image Container */}
            <div className="flex-1 relative flex items-center justify-center bg-black/50 rounded-lg overflow-hidden">
              <img
                src={getOptimizedImageUrl(selectedPhoto.url, 1200)}
                alt={selectedPhoto.title}
                className="max-w-full max-h-[85vh] object-contain"
              />
            </div>

            {/* Info Panel */}
            <div className="w-full md:w-80 flex-shrink-0 text-white space-y-6 overflow-y-auto max-h-[30vh] md:max-h-[85vh] p-2">
              <div>
                <h3 className="text-2xl font-light mb-2">{selectedPhoto.title}</h3>
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>{selectedPhoto.takenAt ? new Date(selectedPhoto.takenAt).toLocaleDateString() : selectedPhoto.date}</span>
                </div>
                {selectedPhoto.location && (
                  <div className="flex items-center gap-2 text-white/60 text-sm mt-1">
                    <MapPin className="w-4 h-4" />
                    <span>{selectedPhoto.location}</span>
                  </div>
                )}
              </div>

              {/* EXIF Data */}
              {(selectedPhoto.cameraModel || selectedPhoto.fNumber) && (
                <div className="border-t border-white/10 pt-4 space-y-3">
                  <h4 className="text-sm font-medium text-white/80 uppercase tracking-wider">Details</h4>
                  
                  {selectedPhoto.cameraModel && (
                    <div className="flex items-center gap-3 text-sm text-white/70">
                      <Camera className="w-4 h-4" />
                      <span>{selectedPhoto.cameraMake} {selectedPhoto.cameraModel}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-sm text-white/70">
                    {selectedPhoto.fNumber && (
                      <div className="flex items-center gap-2">
                        <Aperture className="w-4 h-4" />
                        <span>f/{selectedPhoto.fNumber}</span>
                      </div>
                    )}
                    {selectedPhoto.exposureTime && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>1/{Math.round(1/selectedPhoto.exposureTime)}s</span>
                      </div>
                    )}
                    {selectedPhoto.iso && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold border border-white/40 px-1 rounded">ISO</span>
                        <span>{selectedPhoto.iso}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* GPS Data */}
              {selectedPhoto.gps && (
                <div className="border-t border-white/10 pt-4">
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${selectedPhoto.gps.latitude},${selectedPhoto.gps.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <MapPin className="w-4 h-4" />
                    View on Map
                  </a>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 md:top-0 md:right-0 md:relative text-white/60 hover:text-white p-2"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
}
