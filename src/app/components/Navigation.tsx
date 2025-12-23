import { useState } from 'react';
import { Plus, Edit, Eye, Menu, X } from 'lucide-react';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  user: User | null;
  isEditMode: boolean;
  onEditModeToggle: () => void;
  onUploadClick: () => void;
}

export function Navigation({ activeTab, onTabChange, user, isEditMode, onEditModeToggle, onUploadClick }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      setIsMobileMenuOpen(false);
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
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 border-b border-white/10 transition-colors duration-200 ${
        isMobileMenuOpen ? 'bg-zinc-900' : 'bg-black/80 backdrop-blur-md'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="text-white font-bold tracking-wider cursor-pointer z-50" onClick={() => handleTabClick('home')}>
            GALLERY
          </div>

          {/* Desktop Navigation Tabs */}
          <div className="hidden md:flex gap-8">
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

          {/* Desktop Auth & Admin Actions */}
          <div className="hidden md:flex items-center gap-4">
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
                  onClick={onUploadClick}
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

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-white p-2 z-50"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-14 bg-zinc-900 z-40 md:hidden flex flex-col p-6 animate-in slide-in-from-top-5 duration-200">
          <div className="flex flex-col gap-6">
            {/* Mobile Tabs */}
            <div className="flex flex-col gap-4 border-b border-white/10 pb-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`text-lg font-medium text-left transition-colors ${
                    activeTab === tab.id
                      ? 'text-white'
                      : 'text-white/60 hover:text-white/80'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Mobile Auth & Actions */}
            <div className="flex flex-col gap-4">
              {user ? (
                <>
                  <button
                    onClick={() => {
                      onEditModeToggle();
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-base font-medium transition-all border ${
                      isEditMode
                        ? 'bg-zinc-800 text-white border-white shadow-[0_0_10px_rgba(255,255,255,0.3)] animate-pulse'
                        : 'bg-white/10 text-white/80 border-transparent hover:bg-white/20'
                    }`}
                  >
                    {isEditMode ? <Edit className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    {isEditMode ? 'Editor' : 'Viewer'}
                  </button>
                  
                  <button
                    onClick={() => {
                      onUploadClick();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-center gap-2 bg-white text-black px-4 py-3 rounded-lg text-base font-medium hover:bg-white/90 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Upload Photos
                  </button>
                  
                  <button
                    onClick={handleLogout}
                    className="text-base text-white/60 hover:text-white py-2 text-left"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={handleLogin}
                  className="text-base text-white/60 hover:text-white py-2 text-left"
                >
                  Admin Login
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
