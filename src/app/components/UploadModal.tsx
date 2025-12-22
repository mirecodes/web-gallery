import { useState, useEffect } from 'react';
import { useGallery } from '../hooks/useGallery';
import { X, Upload, Loader2, Plus, Calendar, Camera, MapPin, FileImage } from 'lucide-react';
import exifr from 'exifr';
import { Progress } from './ui/progress';
import { getCityFromCoordinates } from '../services/geocoding';
import { AlbumSelector } from './AlbumSelector';

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
  locationName?: string;
}

export function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [selectedAlbumId, setSelectedAlbumId] = useState('');
  const [metadata, setMetadata] = useState<ExtractedMetadata | null>(null);
  
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [newAlbumDesc, setNewAlbumDesc] = useState('');
  const [newAlbumTheme, setNewAlbumTheme] = useState('');

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ completed: 0, total: 0 });
  
  const [isAlbumSelectorOpen, setIsAlbumSelectorOpen] = useState(false);

  const { uploadAndAddPhoto, batchUploadPhotos, createAlbum, albums } = useGallery();

  // Handle single file metadata preview
  useEffect(() => {
    if (files.length !== 1) {
      setMetadata(null);
      return;
    }

    const extractMeta = async () => {
      try {
        const output = await exifr.parse(files[0], {
          tiff: true,
          exif: true,
          gps: true,
        });
        
        let meta: ExtractedMetadata = {};

        if (output) {
          meta = {
            takenAt: output.DateTimeOriginal ? output.DateTimeOriginal.toISOString() : undefined,
            cameraModel: output.Model,
            gps: output.latitude && output.longitude ? {
              latitude: output.latitude,
              longitude: output.longitude
            } : undefined
          };

          if (meta.gps) {
            setMetadata(meta); // Show GPS coords immediately
            const locationName = await getCityFromCoordinates(meta.gps.latitude, meta.gps.longitude);
            if (locationName) {
              setMetadata(prev => prev ? { ...prev, locationName } : { locationName });
            }
          } else {
            setMetadata(meta);
          }
        }
      } catch (e) {
        console.warn('Failed to extract EXIF data for preview:', e);
        setMetadata(null);
      }
    };

    extractMeta();
  }, [files]);

  if (!isOpen) return null;

  const resetForm = () => {
    setFiles([]);
    setTitle('');
    setSelectedAlbumId('');
    setIsCreatingAlbum(false);
    setNewAlbumName('');
    setNewAlbumDesc('');
    setNewAlbumTheme('');
    setMetadata(null);
    setUploadProgress({ completed: 0, total: 0 });
    setIsAlbumSelectorOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return;
    if (files.length === 1 && !title) return;

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

      if (files.length === 1) {
        setUploadProgress({ completed: 0, total: 1 });
        await uploadAndAddPhoto(files[0], title, targetAlbumId, metadata || undefined);
        setUploadProgress({ completed: 1, total: 1 });
      } else {
        setUploadProgress({ completed: 0, total: files.length });
        await batchUploadPhotos(files, targetAlbumId, (completed, total) => {
          setUploadProgress({ completed, total });
        });
      }
      
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('Upload failed:', error);
      alert(`Upload failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const isSingleFile = files.length === 1;
  const progressValue = uploadProgress.total > 0 ? (uploadProgress.completed / uploadProgress.total) * 100 : 0;

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-lg w-full max-w-md p-6 relative border border-white/10 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 transition-all duration-300">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-xl text-white font-semibold mb-6">
          {isSingleFile ? 'Upload Photo' : files.length > 1 ? `Upload ${files.length} Photos` : 'Upload Photos'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Input */}
          <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-white/40 transition-colors cursor-pointer relative">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {files.length > 0 ? (
              <div className="text-white">
                {isSingleFile ? (
                  <>
                    <p className="font-medium truncate">{files[0].name}</p>
                    <p className="text-sm text-white/60 mt-1">{(files[0].size / 1024 / 1024).toFixed(2)} MB</p>
                  </>
                ) : (
                  <>
                    <div className="flex justify-center mb-2">
                      <div className="relative">
                        <FileImage className="w-8 h-8 text-white/80" />
                        <div className="absolute -top-2 -right-2 bg-blue-500 text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {files.length}
                        </div>
                      </div>
                    </div>
                    <p className="font-medium">{files.length} photos selected</p>
                    <p className="text-sm text-white/60 mt-1">
                      {(files.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024).toFixed(2)} MB Total
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="text-white/60">
                <Upload className="w-8 h-8 mx-auto mb-2" />
                <p>Click or drag to upload images</p>
              </div>
            )}
          </div>

          {/* Metadata Display (Single file only) */}
          {isSingleFile && metadata && (
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
                    {metadata.locationName ? metadata.locationName : `GPS: ${metadata.gps.latitude.toFixed(4)}, ${metadata.gps.longitude.toFixed(4)}`}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Title Input (Single file only) */}
          {isSingleFile && (
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
          )}

          {/* Album Selection */}
          <div>
            <label className="block text-sm text-white/60 mb-1">Album</label>
            {!isCreatingAlbum ? (
              <div className="space-y-2">
                <div 
                  className="transition-all duration-300 ease-in-out"
                  style={{ marginBottom: isAlbumSelectorOpen ? '14rem' : '0' }}
                >
                  <AlbumSelector
                    albums={albums}
                    selectedAlbumId={selectedAlbumId}
                    onSelect={setSelectedAlbumId}
                    onOpenChange={setIsAlbumSelectorOpen}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingAlbum(true);
                    setSelectedAlbumId('');
                  }}
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
                  value={newAlbumTheme}
                  onChange={(e) => setNewAlbumTheme(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white text-sm"
                  placeholder="Theme (e.g. Travel)"
                />
                <input
                  type="text"
                  value={newAlbumName}
                  onChange={(e) => setNewAlbumName(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white text-sm"
                  placeholder="Album Name"
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

          {/* Progress Bar */}
          {isUploading && (
            <div className="space-y-1 pt-2">
              <Progress value={progressValue} className="w-full h-2 bg-white/10 [&>div]:bg-white" />
              <p className="text-xs text-white/60 text-right">
                {uploadProgress.completed} / {uploadProgress.total}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={files.length === 0 || (isSingleFile && !title) || isUploading || (!selectedAlbumId && !isCreatingAlbum)}
            className="w-full bg-white text-black font-medium py-2 rounded hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {files.length > 1 ? `Uploading...` : 'Uploading...'}
              </>
            ) : (
              files.length > 1 ? 'Upload All Photos' : 'Upload Photo'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
