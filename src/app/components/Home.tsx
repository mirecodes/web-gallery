import { useState, useEffect } from 'react';
import { Search, MapPin } from 'lucide-react';
import { useGallery } from '../hooks/useGallery';
import { getOptimizedImageUrl } from '../services/cloudinary';
import { Photo } from '../types';
import { PhotoViewer } from './PhotoViewer';

export function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [optimalWidth, setOptimalWidth] = useState(1200);
  const { photos, loading, error } = useGallery();

  const filteredPhotos = photos.filter(
    (photo) =>
      photo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      photo.location?.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    const dateA = new Date(a.takenAt || a.date).getTime();
    const dateB = new Date(b.takenAt || b.date).getTime();
    return dateB - dateA;
  });

  const carouselPhotos = filteredPhotos.slice(0, 12);

  useEffect(() => {
    if (carouselPhotos.length === 0) return;
    const interval = setInterval(() => {
      setCurrentPhotoIndex((prevIndex) => (prevIndex + 1) % carouselPhotos.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [carouselPhotos.length]);

  const currentPhoto = carouselPhotos[currentPhotoIndex] || photos[0];

  // Calculate optimal image width based on screen size and pixel density
  useEffect(() => {
    if (!currentPhoto) return;

    const calculateOptimalWidth = () => {
      const screenWidth = window.innerWidth;
      const pixelRatio = window.devicePixelRatio || 1;
      
      const containerWidth = Math.min(screenWidth, 1200);
      const targetWidth = containerWidth * pixelRatio;
      
      const maxWidth = currentPhoto.aspectRatio === 'portrait' ? 2400 : 3200;
      const roundedWidth = Math.min(Math.ceil(targetWidth / 100) * 100, maxWidth);
      
      setOptimalWidth(Math.max(roundedWidth, 800));
    };

    calculateOptimalWidth();
  }, [currentPhoto]);

  if (loading) {
    return <div className="text-white text-center py-12">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center py-12">{error}</div>;
  }

  return (
    <>
      <div className="min-h-[calc(100vh-56px)] px-6 py-12">
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="사진 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-full text-white placeholder-white/40 focus:outline-none focus:border-white/60 transition-colors"
            />
          </div>
        </div>

        {/* Featured Photo Slideshow */}
        {currentPhoto && (
          <div className="max-w-6xl mx-auto">
            <div
              className="relative aspect-[16/10] rounded-lg overflow-hidden cursor-pointer group"
              onClick={() => setSelectedPhoto(currentPhoto)}
            >
              <img
                key={currentPhoto.id}
                src={getOptimizedImageUrl(currentPhoto.url, optimalWidth)}
                alt={currentPhoto.title}
                className="w-full h-full object-cover animate-fade-in"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <h2 className="text-white mb-2">{currentPhoto.title}</h2>
                <div className="flex items-center gap-4 text-sm text-white/60">
                  <span>{currentPhoto.date}</span>
                  {currentPhoto.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{currentPhoto.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Photo Counter */}
            <div className="flex justify-center gap-2 mt-6">
              {carouselPhotos.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPhotoIndex(index)}
                  className={`h-1 rounded-full transition-all ${
                    index === currentPhotoIndex
                      ? 'w-8 bg-white'
                      : 'w-1 bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Recent Photos Grid */}
        <div className="max-w-6xl mx-auto mt-16">
          <h3 className="text-white mb-6">Recent Photos</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {filteredPhotos.slice(0, 20).map((photo) => (
              <div
                key={photo.id}
                className="aspect-square rounded overflow-hidden cursor-pointer group"
                onClick={() => setSelectedPhoto(photo)}
              >
                <img
                  src={getOptimizedImageUrl(photo.url, 400)}
                  alt={photo.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {selectedPhoto && (
        <PhotoViewer
          photos={filteredPhotos}
          initialIndex={filteredPhotos.findIndex(p => p.id === selectedPhoto.id)}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </>
  );
}
