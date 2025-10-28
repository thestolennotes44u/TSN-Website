import React, { useState, useMemo } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { DataProvider, useData } from './context/DataContext';
import { isFirebaseConfigured } from './firebaseConfig';
import Header from './components/Header';
import { Sidebar } from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import ContentBrowserPage from './pages/ContentBrowserPage';
import CustomPageRenderer from './pages/CustomPageRenderer';
import AdminPage from './pages/AdminPage';
import { MenuIcon } from './components/Icons';

const FirebaseConfigWarning = () => ( <div className="min-h-screen flex items-center justify-center bg-red-50 text-red-800 p-4"><div className="max-w-2xl text-center"><h1 className="text-3xl font-bold mb-4">Firebase Not Configured</h1><p className="font-semibold mb-4">Please open the <code className="bg-red-200 px-1 rounded">src/firebaseConfig.ts</code> file and paste your Firebase project configuration.</p></div></div> );

const AppRoutes: React.FC = () => {
    const { pages } = useData();
    const visiblePages = useMemo(() => [...pages].filter(p => p.isVisible), [pages]);
    return (
        <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/content" element={<ContentBrowserPage />} />
            <Route path="/admin" element={<AdminPage />} />
            {visiblePages.map(page => (
                <Route key={page.id} path={`/${page.slug}`} element={<CustomPageRenderer page={page} />} />
            ))}
            <Route path="*" element={<DashboardPage />} />
        </Routes>
    );
};

const AppLayout: React.FC = () => {
    const { loading: settingsLoading, error: settingsError } = useSettings();
    const { loading: authLoading } = useAuth();
    const { loading: dataLoading, error: dataError } = useData();
    const error = settingsError || dataError;
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);

    if (authLoading || settingsLoading || dataLoading) return <div className="min-h-screen flex items-center justify-center"><div className="text-2xl font-semibold">Loading...</div></div>;
    if (error) return <div className="min-h-screen flex items-center justify-center bg-red-50 p-4"><div className="text-center"><h2 className="text-2xl font-bold text-red-800 mb-2">Error</h2><p className="font-mono bg-red-100 p-2 rounded">{error}</p></div></div>;

    return (
        <div className="min-h-screen bg-background dark:bg-dark-background text-body-text dark:text-dark-body-text">
            <div className="relative flex min-h-screen">
                <Sidebar 
                    isOpen={isSidebarOpen} 
                    onClose={() => setIsSidebarOpen(false)} 
                />
                <button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                    className={`fixed top-0 h-20 w-16 flex items-center justify-center p-2 text-body-text dark:text-dark-body-text z-50 transition-all duration-300 ${isSidebarOpen ? 'left-52' : 'left-0'}`}
                    aria-label="Toggle sidebar"
                >
                    <MenuIcon isOpen={isSidebarOpen} />
                </button>
                <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'md:ml-56' : 'md:ml-0'}`}>
                    <Header isSidebarOpen={isSidebarOpen} />
                    <div className="h-20" />
                    <main className="flex-1 overflow-y-auto">
                        <AppRoutes />
                    </main>
                    <footer className="shadow-inner mt-8 bg-card-bg dark:bg-dark-card-bg">
                        <div className="container mx-auto py-4 px-5 text-center text-sm text-gray-500">
                            &copy; {new Date().getFullYear()} The Stolen Notes.
                        </div>
                    </footer>
                </div>
            </div>
        </div>
    );
};

const App: React.FC = () => {
  if (!isFirebaseConfigured()) return <FirebaseConfigWarning />;
  return ( <AuthProvider><SettingsProvider><DataProvider><HashRouter><AppLayout /></HashRouter></DataProvider></SettingsProvider></AuthProvider> );
};

export default App;