import { useState } from 'react';
import { UploadModal } from './UploadModal';
import { Plus, Edit, Eye } from 'lucide-react';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  user: User | null;
  isEditMode: boolean;
  onEditModeToggle: () => void;
}

export function Navigation({ activeTab, onTabChange, user, isEditMode, onEditModeToggle }: NavigationProps) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  
  const tabs = [
    { id: 'home', label: 'Home' },
    { id: 'photos', label: 'Photos' },
    { id: 'albums', label: 'Albums' },
  ];

  const handleLogin = async () => {
    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error('Login failed:', error);
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        // Ignore user-cancelled popups
      } else {
        alert(`Login failed: ${error.message}`);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(getAuth());
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div className="text-white font-bold tracking-wider cursor-pointer" onClick={() => onTabChange('home')}>
              GALLERY
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`text-sm transition-colors relative py-4 ${
                    activeTab === tab.id
                      ? 'text-white'
                      : 'text-white/60 hover:text-white/80'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
                  )}
                </button>
              ))}
            </div>

            {/* Auth & Admin Actions */}
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <button
                    onClick={onEditModeToggle}
                    className={`w-24 flex items-center justify-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      isEditMode
                        ? 'bg-zinc-800 text-white animate-rotating-border'
                        : 'bg-white/20 text-white/80 hover:bg-white/30'
                    }`}
                  >
                    <span className="w-4 h-4 inline-flex items-center justify-center">
                      {isEditMode ? <Edit className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </span>
                    {isEditMode ? 'Editor' : 'Viewer'}
                  </button>
                  <button
                    onClick={() => setIsUploadOpen(true)}
                    className="flex items-center gap-2 bg-white text-black px-3 py-1.5 rounded-full text-sm font-medium hover:bg-white/90 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Upload
                  </button>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-white/60 hover:text-white"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={handleLogin}
                  className="text-sm text-white/60 hover:text-white"
                >
                  Admin Login
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <UploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
    </>
  );
}
