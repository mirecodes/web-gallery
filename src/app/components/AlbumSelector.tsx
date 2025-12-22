import { useState, useMemo, useEffect } from 'react';
import { Search, Check } from 'lucide-react';
import { AlbumWithStats } from '../types';

interface AlbumSelectorProps {
  albums: AlbumWithStats[];
  selectedAlbumId: string;
  onSelect: (albumId: string) => void;
  onOpenChange?: (isOpen: boolean) => void;
}

export function AlbumSelector({ albums, selectedAlbumId, onSelect, onOpenChange }: AlbumSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  const filteredAlbums = useMemo(() => {
    return albums.filter(album => 
      album.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      album.theme.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [albums, searchQuery]);

  const selectedAlbum = albums.find(a => a.id === selectedAlbumId);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white text-left focus:outline-none focus:border-white/40"
      >
        {selectedAlbum ? `${selectedAlbum.name} (${selectedAlbum.theme})` : 'Select an album...'}
      </button>
      
      {isOpen && (
        <div className="absolute z-10 top-full mt-1 w-full bg-zinc-800 border border-white/10 rounded-lg shadow-lg p-2 space-y-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search albums..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2 py-1.5 bg-black/50 border border-white/10 rounded text-sm text-white"
            />
          </div>
          <div className="max-h-40 min-h-[10rem] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-600">
            {filteredAlbums.map(album => (
              <button
                key={album.id}
                type="button"
                onClick={() => {
                  onSelect(album.id);
                  setIsOpen(false);
                }}
                className="w-full text-left px-2 py-1.5 rounded hover:bg-white/10 flex justify-between items-center"
              >
                <span className="text-white">{album.name} <span className="text-white/50">({album.theme})</span></span>
                {selectedAlbumId === album.id && <Check className="w-4 h-4 text-blue-400" />}
              </button>
            ))}
            {filteredAlbums.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-white/40">No albums found.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
