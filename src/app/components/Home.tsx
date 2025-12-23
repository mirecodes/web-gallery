import { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { useGallery } from '../hooks/useGallery';
import { getOptimizedImageUrl } from '../services/cloudinary';
import { Photo } from '../types';
import { PhotoViewer } from './PhotoViewer';
import { calculateOptimalImageWidth, THUMBNAIL_SIZES } from '../config/imageConfig';

interface HomeProps {
  isEditMode: boolean;
}

export function Home({ isEditMode }: HomeProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [optimalWidth, setOptimalWidth] = useState(1200);
  const { photos, albums, loading, error, updatePhotoDetails, deletePhotoItem, updateAlbum } = useGallery();

  const sortedPhotos = photos.sort((a, b) => {
    const dateA = new Date(a.takenAt || a.date).getTime();
    const dateB = new Date(b.takenAt || b.date).getTime();
    return dateB - dateA;
  });

  const carouselPhotos = sortedPhotos.slice(0, 12);

  useEffect(() => {
    if (carouselPhotos.length === 0) return;
    const interval = setInterval(() => {
      setCurrentPhotoIndex((prevIndex) => (prevIndex + 1) % carouselPhotos.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [carouselPhotos.length]);

  const currentPhoto = carouselPhotos[currentPhotoIndex] || photos[0];

  useEffect(() => {
    if (!currentPhoto) return;

    const updateWidth = () => {
      const width = calculateOptimalImageWidth(
        window.innerWidth,
        window.devicePixelRatio,
        currentPhoto.aspectRatio
      );
      setOptimalWidth(width);
    };

    updateWidth();

    let resizeTimer: number;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(updateWidth, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
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
            {sortedPhotos.slice(0, 20).map((photo) => (
              <div
                key={photo.id}
                className="aspect-square rounded overflow-hidden cursor-pointer group"
                onClick={() => setSelectedPhoto(photo)}
              >
                <img
                  src={getOptimizedImageUrl(photo.url, THUMBNAIL_SIZES.HOME_GRID)}
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
          photos={sortedPhotos}
          initialIndex={sortedPhotos.findIndex(p => p.id === selectedPhoto.id)}
          onClose={() => setSelectedPhoto(null)}
          albumName={undefined} // Home tab doesn't have a specific album context
          isEditMode={isEditMode}
          albums={albums}
          updatePhotoDetails={updatePhotoDetails}
          deletePhotoItem={deletePhotoItem}
          updateAlbum={updateAlbum}
        />
      )}
    </>
  );
}
