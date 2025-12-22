import { useState, useEffect, useCallback } from 'react';
import { useGallery } from '../hooks/useGallery';
import { getOptimizedImageUrl } from '../services/cloudinary';
import { ArrowLeft, ChevronLeft, ChevronRight, Info, X, MapPin, Calendar, Camera, Aperture, Clock } from 'lucide-react';
import { Photo } from '../types';

interface AlbumViewerProps {
  albumId: string;
  onBack: () => void;
}

export function AlbumViewer({ albumId, onBack }: AlbumViewerProps) {
  const { photos, albums } = useGallery();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showInfo, setShowInfo] = useState(false);

  // Filter photos for this album
  const albumPhotos = photos.filter(p => p.albumId === albumId);
  const currentAlbum = albums.find(a => a.id === albumId);
  const currentPhoto = albumPhotos[currentIndex];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'Escape') {
        if (showInfo) setShowInfo(false);
        else onBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, showInfo, onBack]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? albumPhotos.length - 1 : prev - 1));
  }, [albumPhotos.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === albumPhotos.length - 1 ? 0 : prev + 1));
  }, [albumPhotos.length]);

  if (!currentAlbum || albumPhotos.length === 0) {
    return (
      <div className="min-h-[calc(100vh-56px)] flex flex-col items-center justify-center text-white">
        <p className="text-xl mb-4">No photos in this album</p>
        <button onClick={onBack} className="text-blue-400 hover:text-blue-300 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Albums
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
        <button 
          onClick={onBack}
          className="pointer-events-auto text-white/80 hover:text-white flex items-center gap-2 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">{currentAlbum.name}</span>
        </button>

        <button
          onClick={() => setShowInfo(!showInfo)}
          className={`pointer-events-auto p-2 rounded-full transition-colors ${
            showInfo ? 'bg-white text-black' : 'bg-black/20 text-white hover:bg-white/20'
          }`}
        >
          <Info className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content Area (Split View) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Image Area */}
        <div className={`relative flex-1 flex items-center justify-center transition-all duration-300 ease-in-out ${showInfo ? 'mr-0' : ''}`}>
          {/* Navigation Buttons */}
          <button 
            onClick={handlePrev}
            className="absolute left-4 z-10 p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          
          <button 
            onClick={handleNext}
            className="absolute right-4 z-10 p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all"
          >
            <ChevronRight className="w-8 h-8" />
          </button>

          {/* Image */}
          <div className="w-full h-full flex items-center justify-center p-4 md:p-12">
            <img
              key={currentPhoto.id}
              src={getOptimizedImageUrl(currentPhoto.url, 1600)}
              alt={currentPhoto.title}
              className="max-w-full max-h-full object-contain shadow-2xl"
            />
          </div>
        </div>

        {/* Info Side Panel */}
        <div 
          className={`bg-zinc-900 border-l border-white/10 overflow-y-auto transition-all duration-300 ease-in-out ${
            showInfo ? 'w-80 translate-x-0' : 'w-0 translate-x-full border-none'
          }`}
        >
          <div className="p-6 w-80"> {/* Fixed width container to prevent content squishing */}
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl text-white font-light">{currentPhoto.title}</h3>
              <button onClick={() => setShowInfo(false)} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6 text-white">
              <div>
                <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
                  <Calendar className="w-4 h-4" />
                  <span>{currentPhoto.takenAt ? new Date(currentPhoto.takenAt).toLocaleDateString() : currentPhoto.date}</span>
                </div>
                {currentPhoto.location && (
                  <div className="flex items-center gap-2 text-white/60 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>{currentPhoto.location}</span>
                  </div>
                )}
              </div>

              {(currentPhoto.cameraModel || currentPhoto.fNumber) && (
                <div className="border-t border-white/10 pt-4 space-y-3">
                  <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider">EXIF Data</h4>
                  
                  {currentPhoto.cameraModel && (
                    <div className="flex items-center gap-3 text-sm text-white/80">
                      <Camera className="w-4 h-4" />
                      <span>{currentPhoto.cameraMake} {currentPhoto.cameraModel}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 text-sm text-white/80">
                    {currentPhoto.fNumber && (
                      <div className="flex items-center gap-2">
                        <Aperture className="w-4 h-4" />
                        <span>f/{currentPhoto.fNumber}</span>
                      </div>
                    )}
                    {currentPhoto.exposureTime && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>1/{Math.round(1/currentPhoto.exposureTime)}s</span>
                      </div>
                    )}
                    {currentPhoto.iso && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold border border-white/40 px-1 rounded">ISO</span>
                        <span>{currentPhoto.iso}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {currentPhoto.gps && (
                <div className="border-t border-white/10 pt-4">
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${currentPhoto.gps.latitude},${currentPhoto.gps.longitude}`}
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
          </div>
        </div>
      </div>

      {/* Bottom Indicator Bar */}
      <div className="h-20 bg-black/80 backdrop-blur-sm border-t border-white/10 flex items-center justify-center px-4 z-20">
        <div className="flex gap-2 overflow-x-auto max-w-full px-4 py-2 scrollbar-hide">
          {albumPhotos.map((photo, index) => (
            <button
              key={photo.id}
              onClick={() => setCurrentIndex(index)}
              className={`relative flex-shrink-0 w-12 h-12 rounded overflow-hidden transition-all duration-300 ${
                index === currentIndex 
                  ? 'ring-2 ring-white scale-110 opacity-100' 
                  : 'opacity-40 hover:opacity-70 hover:scale-105'
              }`}
            >
              <img
                src={getOptimizedImageUrl(photo.url, 100)}
                alt=""
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
