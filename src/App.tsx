import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { DataProvider, useData } from './context/DataContext';
import { isFirebaseConfigured } from './firebaseConfig';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import CustomPageRenderer from './pages/CustomPageRenderer';
import AdminPage from './pages/AdminPage';

const FirebaseConfigWarning = () => ( <div className="min-h-screen flex items-center justify-center bg-red-50 text-red-800 p-4"><div className="max-w-2xl text-center"><h1 className="text-3xl font-bold mb-4">Firebase Not Configured</h1><p className="font-semibold mb-4">Please open the <code className="bg-red-200 px-1 rounded">src/firebaseConfig.ts</code> file and paste your Firebase project configuration.</p></div></div> );

const AppRoutes: React.FC = () => {
    const { pages } = useData();
    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/admin" element={<AdminPage />} />
            {pages.filter(p => p.isVisible).map(page => (
                <Route key={page.id} path={`/${page.slug}`} element={<CustomPageRenderer page={page} />} />
            ))}
            <Route path="*" element={<HomePage />} />
        </Routes>
    );
};

const AppLayout: React.FC = () => {
    const { themeStyles, loading: settingsLoading, error: settingsError } = useSettings();
    const { loading: authLoading } = useAuth();
    const { loading: dataLoading, error: dataError } = useData();
    const error = settingsError || dataError;

    if (authLoading || settingsLoading || dataLoading) return <div className="min-h-screen flex items-center justify-center"><div className="text-2xl font-semibold">Loading...</div></div>;
    if (error) return <div className="min-h-screen flex items-center justify-center bg-red-50 p-4"><div className="text-center"><h2 className="text-2xl font-bold text-red-800 mb-2">Error</h2><p className="font-mono bg-red-100 p-2 rounded">{error}</p></div></div>;

    return (
        <div className="min-h-screen grid grid-rows-[auto_1fr_auto]" style={{ ...themeStyles.background, ...themeStyles.bodyText }}>
          <Header />
          <main className="overflow-y-auto"><AppRoutes /></main>
          <footer className="shadow-inner mt-8" style={themeStyles.card}><div className="container mx-auto py-4 px-5 text-center text-sm text-gray-500">&copy; {new Date().getFullYear()} The Stolen Notes.</div></footer>
        </div>
    );
};

const App: React.FC = () => {
  if (!isFirebaseConfigured()) return <FirebaseConfigWarning />;
  return ( <AuthProvider><SettingsProvider><DataProvider><HashRouter><AppLayout /></HashRouter></DataProvider></SettingsProvider></AuthProvider> );
};
export default App;
