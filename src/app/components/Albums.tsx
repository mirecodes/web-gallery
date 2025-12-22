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
                  className="group w-80 flex-shrink-0 bg-zinc-900 rounded-lg overflow-hidden border border-white/5 hover:border-white/20 transition-all cursor-pointer"
                  onClick={() => onAlbumClick(album.id)}
                >
                  <div className="aspect-[3/2] relative overflow-hidden bg-zinc-800">
                    {album.coverPhotoUrl ? (
                      <img
                        src={getOptimizedImageUrl(album.coverPhotoUrl, 600)}
                        alt={album.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-white/20">
                        <FolderOpen className="w-12 h-12" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                    <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm px-2 py-1 rounded text-xs text-white border border-white/10">
                      {album.photoCount} Photos
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-xl text-white font-medium group-hover:text-blue-400 transition-colors truncate">
                      {album.name}
                    </h3>
                    <p className="text-sm text-white/60 line-clamp-2 mt-1 h-10">
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
