import { useState } from 'react';
import { useGallery } from '../hooks/useGallery';
import { X, Loader2, FolderPlus } from 'lucide-react';

interface CreateAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateAlbumModal({ isOpen, onClose }: CreateAlbumModalProps) {
  const [name, setName] = useState('');
  const [theme, setTheme] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const { createAlbum } = useGallery();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !theme) return;

    try {
      setIsCreating(true);
      await createAlbum(name, description, theme);
      onClose();
      setName('');
      setTheme('');
      setDescription('');
    } catch (error: any) {
      console.error('Failed to create album:', error);
      alert(`Failed to create album: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

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
            <FolderPlus className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl text-white font-semibold">Create New Album</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1">Theme</label>
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-white/40"
              placeholder="e.g. Travel, Events"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1">Album Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-white/40"
              placeholder="e.g. Summer Trip 2023"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-white/40 resize-none"
              placeholder="Optional description..."
              rows={3}
            />
          </div>

          <button
            type="submit"
            disabled={!name || !theme || isCreating}
            className="w-full bg-white text-black font-medium py-2 rounded hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Album'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
