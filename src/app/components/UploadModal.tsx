import { useState, useEffect } from 'react';
import { useGallery } from '../hooks/useGallery';
import { X, Upload, Loader2, Plus, Calendar, Camera, MapPin } from 'lucide-react';
import exifr from 'exifr';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ExtractedMetadata {
  takenAt?: string;
  cameraModel?: string;
  gps?: {
    latitude: number;
    longitude: number;
  };
}

export function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [selectedAlbumId, setSelectedAlbumId] = useState('');
  const [metadata, setMetadata] = useState<ExtractedMetadata | null>(null);
  
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [newAlbumDesc, setNewAlbumDesc] = useState('');
  const [newAlbumTheme, setNewAlbumTheme] = useState('');

  const [isUploading, setIsUploading] = useState(false);
  const { uploadAndAddPhoto, createAlbum, albums } = useGallery();

  useEffect(() => {
    if (!file) {
      setMetadata(null);
      return;
    }

    const extractMeta = async () => {
      try {
        const output = await exifr.parse(file, {
          tiff: true,
          exif: true,
          gps: true,
        });
        
        if (output) {
          setMetadata({
            takenAt: output.DateTimeOriginal ? output.DateTimeOriginal.toISOString() : undefined,
            cameraModel: output.Model,
            gps: output.latitude && output.longitude ? {
              latitude: output.latitude,
              longitude: output.longitude
            } : undefined
          });
        }
      } catch (e) {
        console.warn('Failed to extract EXIF data for preview:', e);
        setMetadata(null);
      }
    };

    extractMeta();
  }, [file]);

  if (!isOpen) return null;

  const resetForm = () => {
    setFile(null);
    setTitle('');
    setSelectedAlbumId('');
    setIsCreatingAlbum(false);
    setNewAlbumName('');
    setNewAlbumDesc('');
    setNewAlbumTheme('');
    setMetadata(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return;

    try {
      setIsUploading(true);
      
      let targetAlbumId = selectedAlbumId;

      if (isCreatingAlbum) {
        if (!newAlbumName || !newAlbumTheme) {
          alert('Please fill in album details');
          setIsUploading(false);
          return;
        }
        targetAlbumId = await createAlbum(newAlbumName, newAlbumDesc, newAlbumTheme);
      }

      if (!targetAlbumId) {
        alert('Please select or create an album');
        setIsUploading(false);
        return;
      }

      await uploadAndAddPhoto(file, title, targetAlbumId, metadata || undefined);
      
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('Upload failed:', error);
      // Show detailed error message to user
      alert(`Upload failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-lg w-full max-w-md p-6 relative border border-white/10 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-xl text-white font-semibold mb-6">Upload Photo</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Input */}
          <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-white/40 transition-colors cursor-pointer relative">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {file ? (
              <div className="text-white">
                <p className="font-medium truncate">{file.name}</p>
                <p className="text-sm text-white/60 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            ) : (
              <div className="text-white/60">
                <Upload className="w-8 h-8 mx-auto mb-2" />
                <p>Click or drag to upload image</p>
              </div>
            )}
          </div>

          {/* Metadata Display */}
          {metadata && (
            <div className="bg-white/5 p-3 rounded border border-white/10 text-sm space-y-2">
              <h4 className="text-xs text-white/40 font-bold uppercase">Photo Info</h4>
              {metadata.takenAt && (
                <div className="flex items-center gap-2 text-white/70">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(metadata.takenAt).toLocaleString()}</span>
                </div>
              )}
              {metadata.cameraModel && (
                <div className="flex items-center gap-2 text-white/70">
                  <Camera className="w-4 h-4" />
                  <span>{metadata.cameraModel}</span>
                </div>
              )}
              {metadata.gps && (
                <div className="flex items-center gap-2 text-white/70">
                  <MapPin className="w-4 h-4" />
                  <span>
                    Location found ({metadata.gps.latitude.toFixed(4)}, {metadata.gps.longitude.toFixed(4)})
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Title Input */}
          <div>
            <label className="block text-sm text-white/60 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-white/40"
              placeholder="Enter photo title"
              required
            />
          </div>

          {/* Album Selection */}
          <div>
            <label className="block text-sm text-white/60 mb-1">Album</label>
            {!isCreatingAlbum ? (
              <div className="space-y-2">
                <select
                  value={selectedAlbumId}
                  onChange={(e) => setSelectedAlbumId(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-white/40"
                >
                  <option value="">Select an album...</option>
                  {albums.map((album) => (
                    <option key={album.id} value={album.id}>
                      {album.name} ({album.theme})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setIsCreatingAlbum(true)}
                  className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Create new album
                </button>
              </div>
            ) : (
              <div className="space-y-3 bg-white/5 p-3 rounded border border-white/10">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-white font-medium">New Album</span>
                  <button
                    type="button"
                    onClick={() => setIsCreatingAlbum(false)}
                    className="text-xs text-white/40 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
                <input
                  type="text"
                  value={newAlbumName}
                  onChange={(e) => setNewAlbumName(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white text-sm"
                  placeholder="Album Name"
                />
                <input
                  type="text"
                  value={newAlbumTheme}
                  onChange={(e) => setNewAlbumTheme(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white text-sm"
                  placeholder="Theme (e.g. Travel)"
                />
                <textarea
                  value={newAlbumDesc}
                  onChange={(e) => setNewAlbumDesc(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white text-sm"
                  placeholder="Description (Optional)"
                  rows={2}
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!file || !title || isUploading || (!selectedAlbumId && !isCreatingAlbum)}
            className="w-full bg-white text-black font-medium py-2 rounded hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload Photo'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
