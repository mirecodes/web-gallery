import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getOptimizedImageUrl } from '../services/cloudinary';
import { ArrowLeft, ChevronLeft, ChevronRight, Info, X, MapPin, Calendar, Camera, Aperture, Clock, Folder, Save, Loader2, Trash2, Image as ImageIcon } from 'lucide-react';
import { Photo } from '../types';
import { useGallery } from '../hooks/useGallery';
import { AlbumSelector } from './AlbumSelector';
import { calculateOptimalImageWidth, THUMBNAIL_SIZES } from '../config/imageConfig';

interface PhotoViewerProps {
  photos: Photo[];
  initialIndex: number;
  onClose: () => void;
  albumName?: string;
  showThumbnails?: boolean;
  isEditMode?: boolean;
}

export function PhotoViewer({ photos, initialIndex, onClose, albumName, showThumbnails = false, isEditMode = false }: PhotoViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showInfo, setShowInfo] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [optimalWidth, setOptimalWidth] = useState(1600);
  const thumbnailScrollRef = useRef<HTMLDivElement>(null);
  
  const { albums, updatePhotoDetails, deletePhotoItem, updateAlbum } = useGallery();

  const currentPhoto = photos[currentIndex];

  // Editable state
  const [editedTitle, setEditedTitle] = useState(currentPhoto?.title || '');
  const [editedAlbumId, setEditedAlbumId] = useState(currentPhoto?.albumId || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSettingCover, setIsSettingCover] = useState(false);

  // Reset edited state when photo changes
  useEffect(() => {
    if (currentPhoto) {
      setEditedTitle(currentPhoto.title);
      setEditedAlbumId(currentPhoto.albumId);
    }
  }, [currentPhoto]);

  const currentPhotoAlbum = useMemo(() => {
    if (!currentPhoto || !currentPhoto.albumId) return null;
    return albums.find(a => a.id === currentPhoto.albumId);
  }, [currentPhoto, albums]);

  const isCoverPhoto = useMemo(() => {
    if (!currentPhotoAlbum) return false;
    // If album has explicit coverPhotoId, check against it.
    if (currentPhotoAlbum.coverPhotoId) {
      return currentPhotoAlbum.coverPhotoId === currentPhoto.id;
    }
    // Fallback: if no explicit cover, first photo is cover.
    // However, we only want to show the "Set as Cover" button if it's NOT already the explicit cover.
    // But for the visual indicator (glowing border), we might want to know if it IS the effective cover.
    // The requirement says: "Set as Cover" button makes it the cover.
    // And "thumbnail ... has glowing effect".
    // Let's check if this photo is the *effective* cover.
    return currentPhotoAlbum.coverPhotoUrl === currentPhoto.url;
  }, [currentPhotoAlbum, currentPhoto]);

  const handleSave = async () => {
    if (!currentPhoto) return;
    setIsSaving(true);
    try {
      await updatePhotoDetails(currentPhoto.id, {
        title: editedTitle,
        albumId: editedAlbumId,
      });
      setShowInfo(false);
    } catch (error) {
      console.error("Failed to save photo details:", error);
      alert("Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!currentPhoto) return;
    if (!confirm(`Are you sure you want to delete "${currentPhoto.title}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await deletePhotoItem(currentPhoto.id);
      onClose();
    } catch (error) {
      console.error("Failed to delete photo:", error);
      alert("Failed to delete photo.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSetAsCover = async () => {
    if (!currentPhoto || !currentPhotoAlbum) return;
    setIsSettingCover(true);
    try {
      await updateAlbum(currentPhotoAlbum.id, { coverPhotoId: currentPhoto.id });
      // No need to alert, the UI will update
    } catch (error) {
      console.error("Failed to set cover photo:", error);
      alert("Failed to set cover photo.");
    } finally {
      setIsSettingCover(false);
    }
  };

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
        if (isFullscreen) setIsFullscreen(false);
        else if (showInfo) setShowInfo(false);
        else onClose();
      }
      if (e.key === 'i') setShowInfo(s => !s);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext, onClose, showInfo, isFullscreen]);

  useEffect(() => {
    if (showThumbnails && thumbnailScrollRef.current) {
      const activeThumb = thumbnailScrollRef.current.children[currentIndex] as HTMLElement;
      if (activeThumb) {
        activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentIndex, showThumbnails]);

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

  if (!currentPhoto) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col" onClick={onClose}>
      {/* Top Bar */}
      <div className={`absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20 pointer-events-none transition-opacity duration-300 ${isFullscreen ? 'opacity-0' : 'opacity-100'}`}>
        <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="pointer-events-auto text-white/60 hover:text-white flex items-center gap-2 transition-colors p-2">
          <ArrowLeft className="w-8 h-8" />
          {albumName && <span className="text-lg font-light drop-shadow-md">{albumName}</span>}
        </button>
        <button onClick={(e) => { e.stopPropagation(); setShowInfo(!showInfo); }} className={`pointer-events-auto p-2 rounded-full transition-colors mr-2 ${showInfo ? 'bg-white text-black' : 'bg-black/20 text-white/80 hover:text-white'}`}>
          <Info className="w-6 h-6" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
        <div className={`relative flex-1 flex items-center justify-center transition-all duration-300 ease-in-out ${isFullscreen ? 'p-0' : 'p-4 md:p-12'} ${showInfo && !isFullscreen ? 'mr-80' : 'mr-0'}`} onClick={() => setIsFullscreen(!isFullscreen)}>
          <button onClick={(e) => { e.stopPropagation(); handlePrev(); }} className={`absolute left-4 z-10 text-white/60 hover:text-white transition-all duration-300 ${isFullscreen ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
            <ChevronLeft className="w-10 h-10" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleNext(); }} className={`absolute right-4 z-10 text-white/60 hover:text-white transition-all duration-300 ${isFullscreen ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
            <ChevronRight className="w-10 h-10" />
          </button>
          <img key={currentPhoto.id} src={getOptimizedImageUrl(currentPhoto.url, optimalWidth)} alt={currentPhoto.title} className={`max-w-full max-h-full object-contain shadow-2xl animate-fade-in cursor-pointer transition-transform duration-300 ${isFullscreen ? 'scale-100' : ''}`} />
        </div>

        {/* Info Side Panel */}
        <div className={`bg-zinc-900 border-l border-white/10 overflow-y-auto transition-all duration-300 ease-in-out absolute right-0 top-0 bottom-0 z-20 ${showInfo && !isFullscreen ? 'w-80 translate-x-0' : 'w-0 translate-x-full border-none'}`}>
          <div className="p-6 w-80 flex flex-col h-full">
            <div className="flex justify-between items-start mb-6">
              {isEditMode ? (
                <input type="text" value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded px-3 py-1 text-xl text-white focus:outline-none focus:border-white/40 font-light" />
              ) : (
                <h3 className="text-xl text-white font-light">{currentPhoto.title}</h3>
              )}
              <button onClick={() => setShowInfo(false)} className="text-white/40 hover:text-white ml-4"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-6 text-white flex-1">
              <div>
                <div className="flex items-center gap-2 text-white/60 text-sm mb-2"><Calendar className="w-4 h-4 flex-shrink-0" /><span>{currentPhoto.takenAt ? new Date(currentPhoto.takenAt).toLocaleDateString() : currentPhoto.date}</span></div>
                {(currentPhoto.location || currentPhoto.locationName) && (<div className="flex items-center gap-2 text-white/60 text-sm"><MapPin className="w-4 h-4 flex-shrink-0" /><span>{currentPhoto.location || currentPhoto.locationName}</span></div>)}
              </div>

              <div className="border-t border-white/10 pt-4">
                <h4 className="text-xs font-bold text-white/40 uppercase mb-2">Album</h4>
                {isEditMode ? (
                  <AlbumSelector albums={albums} selectedAlbumId={editedAlbumId} onSelect={setEditedAlbumId} />
                ) : (
                  <div className="flex items-center gap-2 text-white/80 text-sm">
                    <Folder className="w-4 h-4 flex-shrink-0" />
                    <span>{currentPhotoAlbum?.name || 'Uncategorized'}</span>
                  </div>
                )}
              </div>

              {(currentPhoto.cameraModel || currentPhoto.fNumber) && (
                <div className="border-t border-white/10 pt-4 space-y-3">
                  <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider">EXIF Data</h4>
                  {currentPhoto.cameraModel && (<div className="flex items-center gap-3 text-sm text-white/80"><Camera className="w-4 h-4 flex-shrink-0" /><span>{currentPhoto.cameraMake} {currentPhoto.cameraModel}</span></div>)}
                  <div className="grid grid-cols-2 gap-3 text-sm text-white/80">
                    {currentPhoto.fNumber && (<div className="flex items-center gap-2"><Aperture className="w-4 h-4 flex-shrink-0" /><span>f/{Number(currentPhoto.fNumber.toFixed(4))}</span></div>)}
                    {currentPhoto.exposureTime && (<div className="flex items-center gap-2"><Clock className="w-4 h-4 flex-shrink-0" /><span>1/{Math.round(1/currentPhoto.exposureTime)}s</span></div>)}
                    {currentPhoto.iso && (<div className="flex items-center gap-2"><span className="text-xs font-bold border border-white/40 px-1 rounded flex-shrink-0">ISO</span><span>{currentPhoto.iso}</span></div>)}
                  </div>
                </div>
              )}

              {currentPhoto.gps && (<div className="border-t border-white/10 pt-4"><a href={`https://www.google.com/maps/search/?api=1&query=${currentPhoto.gps.latitude},${currentPhoto.gps.longitude}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"><MapPin className="w-4 h-4 flex-shrink-0" />View on Map</a></div>)}
            </div>

            {isEditMode && (
              <div className="mt-auto pt-6 space-y-3">
                {/* Set as Cover Button */}
                <button 
                  onClick={handleSetAsCover} 
                  disabled={isSettingCover || isCoverPhoto} 
                  className={`w-full font-medium py-2 rounded flex items-center justify-center gap-2 transition-colors ${isCoverPhoto ? 'bg-green-600/20 text-green-400 cursor-default' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}
                >
                  {isSettingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                  {isCoverPhoto ? 'Current Cover Image' : 'Set as Cover Image'}
                </button>

                <button onClick={handleSave} disabled={isSaving} className="w-full bg-white text-black font-medium py-2 rounded hover:bg-white/90 disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button onClick={handleDelete} disabled={isDeleting} className="w-full bg-red-600 text-white font-medium py-2 rounded hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {isDeleting ? 'Deleting...' : 'Delete Photo'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showThumbnails && (
        <div className={`h-20 bg-black/80 backdrop-blur-sm border-t border-white/10 flex items-center justify-center px-4 z-20 transition-transform duration-300 ${isFullscreen ? 'translate-y-full' : 'translate-y-0'}`} onClick={(e) => e.stopPropagation()}>
          <div ref={thumbnailScrollRef} className="flex gap-2 overflow-x-auto max-w-full px-4 py-2 scrollbar-hide">
            {photos.map((photo, index) => {
              // Check if this photo is the cover photo for the current album context
              // We need to know if this photo is the cover of the album we are viewing.
              // Since we are in PhotoViewer, we might be viewing photos from a specific album or all photos.
              // If albumName is provided, we can assume we are in an album context, but we need the album object to be sure.
              // Let's use the photo's albumId to find the album and check.
              const photoAlbum = albums.find(a => a.id === photo.albumId);
              const isThisPhotoCover = photoAlbum && photoAlbum.coverPhotoUrl === photo.url;

              return (
                <button 
                  key={photo.id} 
                  onClick={() => setCurrentIndex(index)} 
                  className={`relative flex-shrink-0 w-12 h-12 rounded overflow-hidden transition-all duration-300 
                    ${index === currentIndex ? 'ring-2 ring-white scale-110 opacity-100' : 'opacity-40 hover:opacity-70 hover:scale-105'}
                    ${isEditMode && isThisPhotoCover ? 'ring-2 ring-yellow-400 ring-offset-1 ring-offset-black animate-pulse' : ''}
                  `}
                >
                  <img src={getOptimizedImageUrl(photo.url, THUMBNAIL_SIZES.VIEWER_THUMBNAIL)} alt="" className="w-full h-full object-cover" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
