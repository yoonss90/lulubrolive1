import React from 'react';
import { LogOut, Tv } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();

  // Supabase client is not directly used here, but might be needed for future auth features.
  // For now, we'll just provide a placeholder for user info and a logout button that navigates home.

  const handleLogout = () => {
    // In a real app, you would call supabase.auth.signOut() here.
    // Since auth is removed, we just navigate to the home page.
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <header className="bg-gray-800 border-b border-gray-700 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
              <Tv className="h-8 w-8 text-red-500" />
              <h1 className="text-xl font-bold">Live Stream Collab</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Placeholder for user info if needed later */}
              {/* <span className="text-sm text-gray-300">Welcome, User!</span> */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>홈으로</span>
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {children}
      </main>
    </div>
  );
}
