import { useState, useEffect, useCallback, useRef } from 'react';
import { getOptimizedImageUrl } from '../services/cloudinary';
import { ArrowLeft, ChevronLeft, ChevronRight, Info, X, MapPin, Calendar, Camera, Aperture, Clock } from 'lucide-react';
import { Photo } from '../types';

interface PhotoViewerProps {
  photos: Photo[];
  initialIndex: number;
  onClose: () => void;
  albumName?: string;
  showThumbnails?: boolean;
}

export function PhotoViewer({ photos, initialIndex, onClose, albumName, showThumbnails = false }: PhotoViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showInfo, setShowInfo] = useState(false);
  const thumbnailScrollRef = useRef<HTMLDivElement>(null);

  const currentPhoto = photos[currentIndex];

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  }, [photos.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  }, [photos.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'Escape') {
        if (showInfo) setShowInfo(false);
        else onClose();
      }
      if (e.key === 'i') setShowInfo(s => !s);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext, onClose, showInfo]);

  // Scroll active thumbnail into view
  useEffect(() => {
    if (showThumbnails && thumbnailScrollRef.current) {
      const activeThumb = thumbnailScrollRef.current.children[currentIndex] as HTMLElement;
      if (activeThumb) {
        activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentIndex, showThumbnails]);

  if (!currentPhoto) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col" onClick={onClose}>
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20 pointer-events-none">
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="pointer-events-auto text-white/60 hover:text-white flex items-center gap-2 transition-colors p-2"
        >
          <ArrowLeft className="w-8 h-8" />
          {albumName && <span className="text-lg font-light drop-shadow-md">{albumName}</span>}
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); setShowInfo(!showInfo); }}
          className={`pointer-events-auto p-2 rounded-full transition-colors mr-2 ${
            showInfo ? 'bg-white text-black' : 'bg-black/20 text-white/80 hover:text-white'
          }`}
        >
          <Info className="w-6 h-6" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
        {/* Image Area */}
        <div 
          className={`relative flex-1 flex items-center justify-center transition-all duration-300 ease-in-out p-4 md:p-12 ${
            showInfo ? 'mr-80' : 'mr-0'
          }`}
        >
          {/* Navigation Buttons */}
          <button 
            onClick={handlePrev}
            className="absolute left-4 z-10 text-white/60 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-10 h-10" />
          </button>
          
          <button 
            onClick={handleNext}
            className="absolute right-4 z-10 text-white/60 hover:text-white transition-colors"
          >
            <ChevronRight className="w-10 h-10" />
          </button>

          {/* Image */}
          <img
            key={currentPhoto.id}
            src={getOptimizedImageUrl(currentPhoto.url, 1600)}
            alt={currentPhoto.title}
            className="max-w-full max-h-full object-contain shadow-2xl animate-fade-in"
          />
        </div>

        {/* Info Side Panel */}
        <div 
          className={`bg-zinc-900 border-l border-white/10 overflow-y-auto transition-all duration-300 ease-in-out absolute right-0 top-0 bottom-0 z-20 ${
            showInfo ? 'w-80 translate-x-0' : 'w-0 translate-x-full border-none'
          }`}
        >
          <div className="p-6 w-80">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl text-white font-light">{currentPhoto.title}</h3>
              <button onClick={() => setShowInfo(false)} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6 text-white">
              <div>
                <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span>{currentPhoto.takenAt ? new Date(currentPhoto.takenAt).toLocaleDateString() : currentPhoto.date}</span>
                </div>
                {currentPhoto.location && (
                  <div className="flex items-center gap-2 text-white/60 text-sm">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span>{currentPhoto.location}</span>
                  </div>
                )}
              </div>

              {(currentPhoto.cameraModel || currentPhoto.fNumber) && (
                <div className="border-t border-white/10 pt-4 space-y-3">
                  <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider">EXIF Data</h4>
                  
                  {currentPhoto.cameraModel && (
                    <div className="flex items-center gap-3 text-sm text-white/80">
                      <Camera className="w-4 h-4 flex-shrink-0" />
                      <span>{currentPhoto.cameraMake} {currentPhoto.cameraModel}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 text-sm text-white/80">
                    {currentPhoto.fNumber && (
                      <div className="flex items-center gap-2">
                        <Aperture className="w-4 h-4 flex-shrink-0" />
                        <span>f/{Number(currentPhoto.fNumber.toFixed(4))}</span>
                      </div>
                    )}
                    {currentPhoto.exposureTime && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span>1/{Math.round(1/currentPhoto.exposureTime)}s</span>
                      </div>
                    )}
                    {currentPhoto.iso && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold border border-white/40 px-1 rounded flex-shrink-0">ISO</span>
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
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    View on Map
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Indicator Bar */}
      {showThumbnails && (
        <div className="h-20 bg-black/80 backdrop-blur-sm border-t border-white/10 flex items-center justify-center px-4 z-20" onClick={(e) => e.stopPropagation()}>
          <div 
            ref={thumbnailScrollRef}
            className="flex gap-2 overflow-x-auto max-w-full px-4 py-2 scrollbar-hide"
          >
            {photos.map((photo, index) => (
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
      )}
    </div>
  );
}
