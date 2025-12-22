import { useMemo } from 'react';
import { useGallery } from '../hooks/useGallery';
import { getOptimizedImageUrl } from '../services/cloudinary';
import { FolderOpen } from 'lucide-react';
import { AlbumWithStats } from '../types';

interface AlbumsProps {
  onAlbumClick: (albumId: string) => void;
}

export function Albums({ onAlbumClick }: AlbumsProps) {
  const { albums, loading, error } = useGallery();

  const groupedAlbums = useMemo(() => {
    if (!albums) return {};
    return albums.reduce((acc, album) => {
      const theme = album.theme || 'Uncategorized';
      if (!acc[theme]) {
        acc[theme] = [];
      }
      acc[theme].push(album);
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
        {Object.entries(groupedAlbums).map(([theme, themeAlbums]) => (
          <section key={theme}>
            <h3 className="text-xl text-white font-semibold mb-4 px-6">{theme}</h3>
            <div className="flex overflow-x-auto space-x-6 px-6 pb-4 -mx-6 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
              <div className="w-6 flex-shrink-0"></div> {/* Start padding */}
              {themeAlbums.map((album) => (
                <div 
                  key={album.id} 
                  className="group w-[25rem] flex-shrink-0 cursor-pointer"
                  onClick={() => onAlbumClick(album.id)}
                >
                  {/* Image Container */}
                  <div className="relative aspect-[4/3] rounded-lg overflow-hidden mb-3">
                    {album.coverPhotoUrl ? (
                      <img
                        src={getOptimizedImageUrl(album.coverPhotoUrl, 800)}
                        alt={album.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-white/20">
                        <FolderOpen className="w-12 h-12" />
                      </div>
                    )}
                    
                    {/* Hover Overlay (Optional: slightly darken on hover) */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

                    {/* Photo count badge */}
                    <div className="absolute bottom-3 right-3 bg-black/60 text-white px-2.5 py-0.5 rounded-full text-xs backdrop-blur-sm border border-white/10">
                      {album.photoCount} photos
                    </div>
                  </div>

                  {/* Text Info */}
                  <div>
                    <h3 className="text-white font-medium group-hover:text-white/80 transition-colors truncate">
                      {album.name}
                    </h3>
                    <p className="text-white/60 text-sm line-clamp-1 mt-0.5">
                      {album.description || "No description"}
                    </p>
                  </div>
                </div>
              ))}
              <div className="w-6 flex-shrink-0"></div> {/* End padding */}
            </div>
          </section>
        ))}

        {albums.length === 0 && (
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
