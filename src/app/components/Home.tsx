import { useState, useEffect } from 'react';
import { Search, MapPin } from 'lucide-react';
import { useGallery } from '../hooks/useGallery';
import { getOptimizedImageUrl } from '../services/cloudinary';
import { Photo } from '../types';

export function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const { photos, loading, error } = useGallery();

  const filteredPhotos = photos.filter(
    (photo) =>
      photo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      photo.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (filteredPhotos.length === 0) return;
    const interval = setInterval(() => {
      setCurrentPhotoIndex((prevIndex) => (prevIndex + 1) % filteredPhotos.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [filteredPhotos.length]);

  if (loading) {
    return <div className="text-white text-center py-12">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center py-12">{error}</div>;
  }

  const currentPhoto = filteredPhotos[currentPhotoIndex] || photos[0];

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
                src={getOptimizedImageUrl(currentPhoto.url, 1200)}
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
              {filteredPhotos.map((_, index) => (
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filteredPhotos.slice(0, 8).map((photo) => (
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
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-6"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="max-w-6xl max-h-[90vh] relative">
            <img
              src={getOptimizedImageUrl(selectedPhoto.url, 1200)}
              alt={selectedPhoto.title}
              className="max-w-full max-h-[90vh] object-contain"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
              <h3 className="text-white">{selectedPhoto.title}</h3>
              <div className="flex items-center gap-4 text-sm text-white/60 mt-1">
                <span>{selectedPhoto.date}</span>
                {selectedPhoto.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{selectedPhoto.location}</span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 text-white/80 hover:text-white text-3xl"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
}
