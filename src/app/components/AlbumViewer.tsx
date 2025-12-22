import { useGallery } from '../hooks/useGallery';
import { ArrowLeft } from 'lucide-react';
import { PhotoViewer } from './PhotoViewer';

interface AlbumViewerProps {
  albumId: string;
  onBack: () => void;
}

export function AlbumViewer({ albumId, onBack }: AlbumViewerProps) {
  const { photos, albums } = useGallery();
  
  const albumPhotos = photos.filter(p => p.albumId === albumId);
  const currentAlbum = albums.find(a => a.id === albumId);

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
    <PhotoViewer
      photos={albumPhotos}
      initialIndex={0}
      onClose={onBack}
      albumName={currentAlbum.name}
      showThumbnails={true}
    />
  );
}
