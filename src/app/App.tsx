import { useState } from 'react';
import { Gallery } from './components/Gallery';
import { Navigation } from './components/Navigation';
import { Home } from './components/Home';
import { Albums } from './components/Albums';
import { AlbumViewer } from './components/AlbumViewer';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSelectedAlbumId(null); // Reset album selection when changing tabs
  };

  const handleAlbumClick = (albumId: string) => {
    setSelectedAlbumId(albumId);
  };

  const handleBackToAlbums = () => {
    setSelectedAlbumId(null);
  };

  return (
    <div className="min-h-screen bg-black">
      <Navigation activeTab={activeTab} onTabChange={handleTabChange} />
      
      <main className="pt-14">
        {activeTab === 'home' && <Home />}
        
        {activeTab === 'photos' && <Gallery />}
        
        {activeTab === 'albums' && (
          selectedAlbumId ? (
            <AlbumViewer albumId={selectedAlbumId} onBack={handleBackToAlbums} />
          ) : (
            <Albums onAlbumClick={handleAlbumClick} />
          )
        )}
      </main>
    </div>
  );
}
