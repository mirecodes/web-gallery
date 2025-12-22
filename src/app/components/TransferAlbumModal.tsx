import { useState, useEffect } from 'react';
import { useGallery } from '../hooks/useGallery';
import { X, Loader2, ArrowRightLeft } from 'lucide-react';
import { AlbumWithStats } from '../types';
import { AlbumSelector } from './AlbumSelector';

interface TransferAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceAlbum: AlbumWithStats | null;
}

export function TransferAlbumModal({ isOpen, onClose, sourceAlbum }: TransferAlbumModalProps) {
  const [targetAlbumId, setTargetAlbumId] = useState('');
  const [deleteSource, setDeleteSource] = useState(true);
  const [isTransferring, setIsTransferring] = useState(false);
  
  const { albums, transferAlbumPhotos } = useGallery();

  useEffect(() => {
    if (!isOpen) {
      setTargetAlbumId('');
      setDeleteSource(true);
    }
  }, [isOpen]);

  if (!isOpen || !sourceAlbum) return null;

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAlbumId || targetAlbumId === sourceAlbum.id) return;

    if (!confirm(`Are you sure you want to transfer all photos from "${sourceAlbum.name}" to the selected album?`)) {
      return;
    }

    try {
      setIsTransferring(true);
      await transferAlbumPhotos(sourceAlbum.id, targetAlbumId, deleteSource);
      onClose();
    } catch (error: any) {
      console.error('Failed to transfer photos:', error);
      alert(`Failed to transfer photos: ${error.message}`);
    } finally {
      setIsTransferring(false);
    }
  };

  const availableAlbums = albums.filter(a => a.id !== sourceAlbum.id);

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-lg w-full max-w-md p-6 relative border border-white/10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <ArrowRightLeft className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl text-white font-semibold">Transfer Album</h2>
        </div>

        <form onSubmit={handleTransfer} className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1">From</label>
            <p className="font-medium text-white p-2 bg-black/20 rounded">{sourceAlbum.name}</p>
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1">To</label>
            <AlbumSelector
              albums={availableAlbums}
              selectedAlbumId={targetAlbumId}
              onSelect={setTargetAlbumId}
            />
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 text-sm text-white/80">
              <input
                type="checkbox"
                checked={deleteSource}
                onChange={(e) => setDeleteSource(e.target.checked)}
                className="w-4 h-4 rounded bg-black/50 border-white/20 text-blue-500 focus:ring-blue-500"
              />
              Delete "{sourceAlbum.name}" album after transfer
            </label>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={!targetAlbumId || isTransferring}
              className="w-full bg-blue-600 text-white font-medium py-2 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isTransferring ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRightLeft className="w-4 h-4" />}
              {isTransferring ? 'Transferring...' : `Transfer ${sourceAlbum.photoCount} Photos`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
