import { useState, useEffect } from 'react';
import { Gallery } from './components/Gallery';
import { Navigation } from './components/Navigation';
import { Home } from './components/Home';
import { Albums } from './components/Albums';
import { AlbumViewer } from './components/AlbumViewer';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  
  // Centralized state management
  const [user, setUser] = useState<User | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Handle user authentication state
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // Automatically turn off edit mode if user logs out
      if (!currentUser) {
        setIsEditMode(false);
      }
    });
    return () => unsubscribe();
  }, []);

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

  const handleEditModeToggle = () => {
    // Only allow toggling if a user is logged in
    if (user) {
      setIsEditMode(prev => !prev);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Navigation 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
        user={user}
        isEditMode={isEditMode}
        onEditModeToggle={handleEditModeToggle}
      />
      
      <main className="pt-14">
        {activeTab === 'home' && <Home isEditMode={isEditMode} />}
        
        {activeTab === 'photos' && <Gallery isEditMode={isEditMode} />}
        
        {activeTab === 'albums' && (
          selectedAlbumId ? (
            <AlbumViewer 
              albumId={selectedAlbumId} 
              onBack={handleBackToAlbums} 
              isEditMode={isEditMode}
            />
          ) : (
            <Albums onAlbumClick={handleAlbumClick} />
          )
        )}
      </main>
    </div>
  );
}
