import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import Modal from './Modal';
import { LogoIcon, SunIcon, MoonIcon, MenuIcon } from './Icons';

// ... LoginForm component remains unchanged ...

interface HeaderProps {
    onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
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
        if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
        }

        const newClickCount = clickCount + 1;
        setClickCount(newClickCount);

        if (newClickCount >= 5) {
            if (isAuthenticated) {
                navigate('/admin');
            } else {
                setLoginModalOpen(true);
            }
            setClickCount(0);
        } else {
            // If it's a single click, wait to see if more follow
            clickTimeoutRef.current = window.setTimeout(() => {
                if (newClickCount === 1) {
                    navigate('/'); // Navigate to home on single click
                }
                setClickCount(0);
            }, 300); // 300ms window for multi-clicking
        }
    };

    return (
        <>
            <header className="fixed top-0 right-0 left-0 shadow-md h-20 bg-card-bg dark:bg-dark-card-bg z-30">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <div className="flex items-center">
                            <button onClick={onMenuClick} className="p-2 rounded-md mr-2 text-body-text dark:text-dark-body-text">
                                <MenuIcon className="h-6 w-6" />
                            </button>
                            <div onClick={handleAdminTriggerClick} className="flex items-center space-x-2 md:space-x-4 cursor-pointer" title="The Stolen Notes">
                                {settings?.logoUrl ? (
                                    <img src={settings.logoUrl} alt={`${settings.siteTitle} Logo`} className="h-14 w-auto pointer-events-none" />
                                ) : (
                                    <LogoIcon className="h-12 w-12 pointer-events-none text-accent dark:text-dark-accent" />
                                )}
                                <span className="text-2xl md:text-3xl font-bold pointer-events-none text-primary-heading dark:text-dark-primary-heading select-none">
                                    {settings?.siteTitle || 'Loading...'}
                                </span>
                            </div>
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