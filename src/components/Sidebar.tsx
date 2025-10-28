import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { ChevronDownIcon } from './Icons';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const sortWithOrder = <T extends { order?: number, name?: string, title?: string }>(a: T, b: T) => (a.order ?? Infinity) - (b.order ?? Infinity) || (a.name || a.title || '').localeCompare(b.name || b.title || '');

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const { streams, papers, pages } = useData();
    const [openSections, setOpenSections] = useState({ streams: false, papers: false });

    const sortedStreams = React.useMemo(() => [...streams].sort(sortWithOrder), [streams]);
    const sortedPapers = React.useMemo(() => [...papers].sort(sortWithOrder), [papers]);
    const visiblePages = React.useMemo(() => [...pages].filter(p => p.isVisible).sort(sortWithOrder), [pages]);

    const toggleSection = (section: keyof typeof openSections) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handleLinkClick = () => {
        if (window.innerWidth < 768) {
            onClose();
        }
    };

    const linkClasses = "flex items-center px-4 py-2 text-body-text dark:text-dark-body-text rounded-lg hover:bg-background dark:hover:bg-dark-background";
    const activeLinkClasses = "bg-background dark:bg-dark-background font-semibold";

    const sidebarContent = (
        <div className="h-full flex flex-col "> {/* This pt-20 pushes content down below the header */}
            <nav className="flex-1 space-y-2 p-4 overflow-y-auto">
                <NavLink to="/" className={({isActive}) => `${linkClasses} ${isActive ? activeLinkClasses : ''}`} onClick={handleLinkClick}>Home</NavLink>
                {visiblePages.map(page => (
                    <NavLink key={page.id} to={`/${page.slug}`} className={({isActive}) => `${linkClasses} ${isActive ? activeLinkClasses : ''}`} onClick={handleLinkClick}>{page.title}</NavLink>
                ))}
                <hr className="border-gray-300 dark:border-gray-600"/>
                <h3 className="px-4 pt-2 pb-1 text-sm font-semibold text-gray-500 uppercase tracking-wider">Browse Content</h3>
                <div>
                    <button onClick={() => toggleSection('streams')} className="w-full flex justify-between items-center px-4 py-2 text-body-text dark:text-dark-body-text rounded-lg hover:bg-background dark:hover:bg-dark-background">
                        <span className="font-medium">By Stream</span>
                        <ChevronDownIcon className={`h-5 w-5 transition-transform ${openSections.streams ? 'rotate-180' : ''}`} />
                    </button>
                    {openSections.streams && (
                        <div className="pl-4 mt-1 space-y-1">
                            <NavLink to="/content" className={linkClasses} onClick={handleLinkClick}>All Streams</NavLink>
                            {sortedStreams.map(stream => (
                                <NavLink key={stream.id} to={`/content?stream=${stream.id}`} className={linkClasses} onClick={handleLinkClick}>{stream.name}</NavLink>
                            ))}
                        </div>
                    )}
                </div>
                <div>
                    <button onClick={() => toggleSection('papers')} className="w-full flex justify-between items-center px-4 py-2 text-body-text dark:text-dark-body-text rounded-lg hover:bg-background dark:hover:bg-dark-background">
                        <span className="font-medium">By Paper</span>
                        <ChevronDownIcon className={`h-5 w-5 transition-transform ${openSections.papers ? 'rotate-180' : ''}`} />
                    </button>
                    {openSections.papers && (
                        <div className="pl-4 mt-1 space-y-1">
                            <NavLink to="/content" className={linkClasses} onClick={handleLinkClick}>All Papers</NavLink>
                            {sortedPapers.map(paper => (
                                <NavLink key={paper.id} to={`/content?paper=${paper.id}`} className={linkClasses} onClick={handleLinkClick}>{paper.name}</NavLink>
                            ))}
                        </div>
                    )}
                </div>
            </nav>
        </div>
    );

    return (
        <>
            <div className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose}></div>
            <aside className={`fixed top-0 left-0 h-full bg-card-bg dark:bg-dark-card-bg z-40 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} w-64 md:w-56 border-r border-gray-200 dark:border-gray-700`}>
                {sidebarContent}
            </aside>
        </>
    );
};