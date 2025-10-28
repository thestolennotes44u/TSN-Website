import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import Modal from './Modal';
import { LogoIcon, SunIcon, MoonIcon } from './Icons';

const LoginForm: React.FC<{onLoginSuccess: () => void}> = ({ onLoginSuccess }) => {
    const { login } = useAuth();
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await login(email, password);
            onLoginSuccess();
        } catch (error) {
            setError('Invalid credentials. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-body-text dark:text-dark-body-text">Admin Email</label>
                <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-background dark:bg-dark-background border border-gray-300 dark:border-gray-600 rounded-md shadow-sm" required />
            </div>
            <div>
                <label htmlFor="password" className="block text-sm font-medium text-body-text dark:text-dark-body-text">Password</label>
                <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-background dark:bg-dark-background border border-gray-300 dark:border-gray-600 rounded-md shadow-sm" required />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-accent dark:bg-dark-accent hover:opacity-90 disabled:opacity-50">
                {isLoading ? 'Logging in...' : 'Login'}
            </button>
        </form>
    );
};

interface HeaderProps {
    isSidebarOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ isSidebarOpen }) => {
    const { settings, theme, toggleTheme } = useSettings();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [isLoginModalOpen, setLoginModalOpen] = React.useState(false);
    const [clickCount, setClickCount] = React.useState(0);
    const clickTimeoutRef = React.useRef<number | null>(null);

    React.useEffect(() => {
        return () => { if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current); };
    }, []);

    const handleAdminTriggerClick = () => {
        if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
        const newClickCount = clickCount + 1;
        setClickCount(newClickCount);
        if (newClickCount >= 5) {
            if (isAuthenticated) navigate('/admin');
            else setLoginModalOpen(true);
            setClickCount(0);
        } else {
            clickTimeoutRef.current = window.setTimeout(() => setClickCount(0), 1500);
        }
    };

    return (
        <>
            <header className={`fixed top-0 right-0 shadow-md h-20 bg-card-bg dark:bg-dark-card-bg z-30 transition-all duration-300 ${isSidebarOpen ? 'left-0 md:left-56' : 'left-0'}`}>
                <div className={`container mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300 ${isSidebarOpen ? 'pl-4' : 'pl-20'}`}>
                    <div className="flex items-center justify-between h-20">
                        <div onClick={handleAdminTriggerClick} className="flex items-center space-x-4 cursor-pointer" title="The Stolen Notes">
                            {settings?.logoUrl ? (
                                <img src={settings.logoUrl} alt={`${settings.siteTitle} Logo`} className="h-14 w-auto pointer-events-none" />
                            ) : (
                                <LogoIcon className="h-12 w-12 pointer-events-none text-accent dark:text-dark-accent" />
                            )}
                            <span className="text-3xl font-bold pointer-events-none text-primary-heading dark:text-dark-primary-heading select-none">
                                {settings?.siteTitle || 'Loading...'}
                            </span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button onClick={toggleTheme} className="p-2 rounded-full text-body-text dark:text-dark-body-text hover:bg-gray-200 dark:hover:bg-dark-card-bg focus:outline-none" aria-label="Toggle theme">
                                {theme === 'light' ? <MoonIcon className="h-6 w-6" /> : <SunIcon className="h-6 w-6" />}
                            </button>
                            {isAuthenticated && (
                                <button onClick={() => navigate('/admin')} className="hidden md:block px-3 py-2 rounded-md text-sm font-medium text-body-text dark:text-dark-body-text hover:bg-gray-200 dark:hover:bg-dark-card-bg">
                                    Admin
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>
            <Modal isOpen={isLoginModalOpen && !isAuthenticated} onClose={() => setLoginModalOpen(false)} title="Admin Login">
                <LoginForm onLoginSuccess={() => { setLoginModalOpen(false); navigate('/admin'); }}/>
            </Modal>
        </>
    );
};

export default Header;