import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import Modal from './Modal';
import { LogoIcon } from './Icons';

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
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Admin Email</label>
                <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-200"
                    required
                    autoComplete="email"
                />
            </div>
            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-200"
                    required
                    autoComplete="current-password"
                />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
                {isLoading ? 'Logging in...' : 'Login'}
            </button>
        </form>
    );
};


const Header: React.FC = () => {
  
  // FIXED: Changed themeClasses to themeStyles
  const { settings, themeStyles } = useSettings();
  const { pages } = useData();
  const { isAuthenticated } = useAuth();
  const [isLoginModalOpen, setLoginModalOpen] = React.useState(false);
  const navigate = useNavigate();

  const [clickCount, setClickCount] = React.useState(0);
  const clickTimeoutRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
        if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
        }
    };
  }, []);

  const visiblePages = pages.filter(p => p.isVisible);
  
  // FIXED: Replaced the old navLinkClasses with these two new functions
  const navLinkClasses = ({isActive}: {isActive: boolean}) => 
    `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`;

  const navLinkStyles = ({isActive}: {isActive: boolean}): React.CSSProperties => 
      isActive ? themeStyles.button : {};

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
        clickTimeoutRef.current = window.setTimeout(() => {
            setClickCount(0);
        }, 1500);
    }
  };

  return (
    <>
      {/* FIXED: Switched to the style prop for the background color */}
      <header className="shadow-md sticky top-0 z-40" style={themeStyles.card}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div onClick={handleAdminTriggerClick} className="flex items-center space-x-4 cursor-pointer" title="The Stolen Notes">
                {settings?.logoUrl ? (
                    <img src={settings.logoUrl} alt={`${settings.siteTitle} Logo`} className="h-14 w-auto pointer-events-none" />
                ) : (
                    // FIXED: Switched to the style prop for the accent color
                    <LogoIcon className="h-12 w-12 pointer-events-none" style={themeStyles.accentText} />
                )}
                {/* FIXED: Switched to the style prop for the heading color */}
                <span className="text-3xl font-bold pointer-events-none" style={themeStyles.primaryHeading}>
                    {settings?.siteTitle || 'Loading...'}
                </span>
            </div>
            <nav className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {/* FIXED: Added style prop to NavLink */}
                <NavLink to="/" className={navLinkClasses} style={navLinkStyles}>Home</NavLink>
                {visiblePages.map(page => (
                    // FIXED: Added style prop to NavLink
                    <NavLink key={page.id} to={`/${page.slug}`} className={navLinkClasses} style={navLinkStyles}>
                        {page.title}
                    </NavLink>
                ))}
              </div>
            </nav>
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