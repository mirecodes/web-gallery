import { useState, useEffect } from 'react';
import { useGallery } from '../hooks/useGallery';
import { X, Loader2, Save, Trash2, FolderCog } from 'lucide-react';
import { AlbumWithStats } from '../types';

interface EditAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  album: AlbumWithStats | null;
}

export function EditAlbumModal({ isOpen, onClose, album }: EditAlbumModalProps) {
  const [name, setName] = useState('');
  const [theme, setTheme] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { updateAlbumDetails, updateTheme, deleteAlbumItem } = useGallery();

  useEffect(() => {
    if (album) {
      setName(album.name);
      setTheme(album.theme);
      setDescription(album.description);
    }
  }, [album]);

  if (!isOpen || !album) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !theme) return;

    try {
      setIsSaving(true);
      
      // If the theme name itself was changed, update it for all related albums
      if (theme !== album.theme) {
        await updateTheme(album.theme, theme);
      }

      // Update the specific details for this album
      await updateAlbumDetails(album.id, { name, theme, description });

      onClose();
    } catch (error: any) {
      console.error('Failed to update album:', error);
      alert(`Failed to update album: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete the album "${album.name}"? All photos within this album will become uncategorized. This action cannot be undone.`)) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteAlbumItem(album.id);
      onClose();
    } catch (error: any) {
      console.error('Failed to delete album:', error);
      alert(`Failed to delete album: ${error.message}`);
    } finally {
      setIsDeleting(false);
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
            <FolderCog className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl text-white font-semibold">Edit Album</h2>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
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

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || isSaving}
              className="w-full bg-red-600 text-white font-medium py-2 rounded hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
            <button
              type="submit"
              disabled={!name || !theme || isSaving || isDeleting}
              className="w-full bg-white text-black font-medium py-2 rounded hover:bg-white/90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
