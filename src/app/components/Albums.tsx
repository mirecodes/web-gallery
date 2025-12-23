import { useMemo, useState, useEffect } from 'react';
import { useGallery } from '../hooks/useGallery';
import { getOptimizedImageUrl } from '../services/cloudinary';
import { FolderOpen, Plus, Edit2, ArrowRightLeft } from 'lucide-react';
import { AlbumWithStats } from '../types';
import { getResponsiveAlbumCoverSize } from '../config/imageConfig';

interface AlbumsProps {
  onAlbumClick: (albumId: string) => void;
  isEditMode?: boolean;
  onAddNewAlbum?: () => void;
  onEditAlbum?: (album: AlbumWithStats) => void;
  onTransferAlbum?: (album: AlbumWithStats) => void;
}

export function Albums({ onAlbumClick, isEditMode = false, onAddNewAlbum, onEditAlbum, onTransferAlbum }: AlbumsProps) {
  const { albums, loading, error } = useGallery();
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const groupedAlbums = useMemo(() => {
    if (!albums) return {};

    // 1. Group albums by theme
    const grouped = albums.reduce((acc, album) => {
      const theme = album.theme || 'Uncategorized';
      if (!acc[theme]) {
        acc[theme] = [];
      }
      acc[theme].push(album);
      return acc;
    }, {} as Record<string, AlbumWithStats[]>);

    // 2. Sort themes by the latest photo date of any album within that theme
    const sortedThemes = Object.entries(grouped).sort(([, albumsA], [, albumsB]) => {
      // Find the max date in theme A
      const maxDateA = Math.max(...albumsA.map(a => a.latestPhotoDate ? new Date(a.latestPhotoDate).getTime() : 0));
      // Find the max date in theme B
      const maxDateB = Math.max(...albumsB.map(b => b.latestPhotoDate ? new Date(b.latestPhotoDate).getTime() : 0));

      return maxDateB - maxDateA;
    });

    // 3. Reconstruct the object with sorted keys
    return sortedThemes.reduce((acc, [theme, albums]) => {
      acc[theme] = albums; // Albums within theme are already sorted by useGallery
      return acc;
    }, {} as Record<string, AlbumWithStats[]>);
  }, [albums]);

  if (loading) {
    return <div className="text-white text-center py-12">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center py-12">{error}</div>;
  }

  return (
    <div className="max-w-full mx-auto py-12">
      <div className="space-y-12">
        {isEditMode && (
          <section>
            <h3 className="text-xl text-white font-semibold mb-4 px-6">Add a new album</h3>
            <div className="flex overflow-x-auto space-x-6 px-6 pb-4 -mx-6 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
              <div className="w-6 flex-shrink-0"></div> {/* Start padding */}
              <div 
                className="group w-[18rem] md:w-[25rem] flex-shrink-0 cursor-pointer"
                onClick={onAddNewAlbum}
              >
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-3 border-2 border-dashed border-white/20 hover:border-white/40 transition-colors flex items-center justify-center">
                  <div className="text-center text-white/60 group-hover:text-white/80 transition-colors">
                    <Plus className="w-12 h-12 mx-auto" />
                    <p className="mt-2">Add New Album</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {Object.entries(groupedAlbums).map(([theme, themeAlbums]) => (
          <section key={theme}>
            <h3 className="text-xl text-white font-semibold mb-4 px-6">{theme}</h3>
            <div className="flex overflow-x-auto space-x-6 px-6 pb-4 -mx-6 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
              <div className="w-6 flex-shrink-0"></div> {/* Start padding */}
              {themeAlbums.map((album) => (
                <div 
                  key={album.id} 
                  className="group w-[18rem] md:w-[25rem] flex-shrink-0 cursor-pointer relative"
                  onClick={() => onAlbumClick(album.id)}
                >
                  {/* Image Container */}
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-3">
                    {album.coverPhotoUrl ? (
                      <img
                        src={getOptimizedImageUrl(
                          album.coverPhotoUrl, 
                          getResponsiveAlbumCoverSize(screenWidth)
                        )}
                        alt={album.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-white/20">
                        <FolderOpen className="w-12 h-12" />
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

                    <div className="absolute bottom-3 right-3 bg-black/60 text-white px-2.5 py-0.5 rounded-full text-xs backdrop-blur-sm border border-white/10 opacity-75 group-hover:opacity-100 transition-opacity">
                      {album.photoCount} photos
                    </div>

                    {/* Edit & Transfer Buttons (Visible on hover in Edit Mode) */}
                    {isEditMode && (
                      <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTransferAlbum?.(album);
                          }}
                          className="bg-black/60 text-white p-2 rounded-full backdrop-blur-sm border border-white/10 hover:bg-black/80"
                          title="Transfer Photos"
                        >
                          <ArrowRightLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditAlbum?.(album);
                          }}
                          className="bg-black/60 text-white p-2 rounded-full backdrop-blur-sm border border-white/10 hover:bg-black/80"
                          title="Edit Album"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Text Info */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="text-white font-medium group-hover:text-white/80 transition-colors truncate">
                        {album.name}
                      </h3>
                      <p className="text-white/60 text-sm line-clamp-1 mt-0.5">
                        {album.description || "No description"}
                      </p>
                    </div>
                    {album.yearRange && (
                      <div className="text-sm text-white/40 flex-shrink-0 mt-0.5">
                        {album.yearRange.start === album.yearRange.end
                          ? album.yearRange.start
                          : `${album.yearRange.start}—${album.yearRange.end}`
                        }
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div className="w-6 flex-shrink-0"></div> {/* End padding */}
            </div>
          </section>
        ))}

        {albums.length === 0 && !isEditMode && (
          <div className="col-span-full text-center py-20 text-white/40 px-6">
            <FolderOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No albums yet</p>
            <p className="text-sm mt-2">Upload a photo to create your first album</p>
          </div>
        )}
      </div>
    </div>
  );
}
