import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useSettings } from '../context/SettingsContext';
import type { ContentItem, TierKey } from '../types';
import { MembershipTiers } from '../types';
import { VideoIcon, TestIcon, FormIcon, ExternalLinkIcon, ChevronDownIcon, GridIcon, ListIcon } from '../components/Icons';

const ITEMS_PER_PAGE = 12;
const sortWithOrder = <T extends { order?: number, id: string, title?: string, name?: string }>(a: T, b: T) => (a.order ?? Infinity) - (b.order ?? Infinity) || a.id.localeCompare(b.id);
const typeOrder: Record<ContentItem['type'], number> = { video: 1, test: 2, form: 3 };

const ContentListItem: React.FC<{ item: ContentItem }> = ({ item }) => {
    const Icon = item.type === 'video' ? VideoIcon : item.type === 'test' ? TestIcon : FormIcon;
    return (
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="block w-full">
            <li className="flex items-center p-3 rounded-lg bg-card-bg dark:bg-dark-card-bg shadow-sm hover:shadow-md transition-shadow">
                <Icon className="h-6 w-6 mr-4 flex-shrink-0 text-accent dark:text-dark-accent" />
                <span className="flex-grow text-body-text dark:text-dark-body-text truncate">{item.title}</span>
                <ExternalLinkIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 ml-4 flex-shrink-0" />
            </li>
        </a>
    );
};

const ContentCard: React.FC<{ item: ContentItem }> = ({ item }) => {
    const Icon = item.type === 'video' ? VideoIcon : item.type === 'test' ? TestIcon : FormIcon;
    const tierName = MembershipTiers[item.tier]?.name || 'Public';
    const tierColors: Record<TierKey, string> = {
        PUBLIC: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        LEVEL_1: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        LEVEL_2: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
        LEVEL_3: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    };
    return (
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="block rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 group bg-card-bg dark:bg-dark-card-bg">
            <div className="p-5 flex items-start justify-between">
                <div className="flex items-center flex-1 min-w-0">
                    <Icon className="h-8 w-8 mr-4 flex-shrink-0 text-accent dark:text-dark-accent" />
                    <div className="min-w-0">
                       <h3 className="text-lg font-semibold truncate group-hover:text-clip group-hover:whitespace-normal text-secondary-heading dark:text-dark-secondary-heading">{item.title}</h3>
                       <span className={`text-xs font-medium mr-2 px-2.5 py-0.5 rounded ${tierColors[item.tier] || tierColors.PUBLIC}`}>{tierName}</span>
                    </div>
                </div>
                <ExternalLinkIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 ml-2 flex-shrink-0" />
            </div>
        </a>
    );
};

const AccordionItem: React.FC<{ title: React.ReactNode; children: React.ReactNode; count: number }> = ({ title, children, count }) => {
  const [isOpen, setIsOpen] = useState(true);
  if (count === 0) return null;
  return (
    <div className="rounded-lg shadow-md overflow-hidden mb-4 bg-card-bg dark:bg-dark-card-bg">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-left p-5 focus:outline-none" aria-expanded={isOpen}>
        <div className="flex items-center">
            <h3 className="text-xl font-semibold text-primary-heading dark:text-dark-primary-heading">{title}</h3>
            <span className="ml-3 text-sm font-medium px-2.5 py-0.5 rounded-full text-white bg-accent dark:bg-dark-accent">{count}</span>
        </div>
        <ChevronDownIcon className={`h-6 w-6 transform transition-transform text-gray-500 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && <div className="p-5 border-t border-gray-200 dark:border-gray-700">{children}</div>}
    </div>
  );
};

const Pagination: React.FC<{ currentPage: number; totalPages: number; onPageChange: (page: number) => void; }> = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    return (
        <div className="flex justify-center items-center space-x-4 mt-8">
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2 bg-accent dark:bg-dark-accent text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
            <span className="font-medium text-body-text dark:text-dark-body-text">Page {currentPage} of {totalPages}</span>
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-4 py-2 bg-accent dark:bg-dark-accent text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
        </div>
    );
};

const NoResults = ({ message = "No content found." }: { message?: string }) => <div className="text-center py-16"><p className="text-gray-500 dark:text-gray-400 text-lg">{message}</p></div>;

const ContentBrowserPage: React.FC = () => {
    const { streams, papers, contentItems } = useData();
    const { settings } = useSettings();
    const location = useLocation();

    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [viewMode, setViewMode] = useState<'all' | 'byPaper' | 'byTier' | 'tests' | 'forms'>('all');
    const [selectedStream, setSelectedStream] = useState<string>('all');
    const [selectedPaper, setSelectedPaper] = useState<string>('all');
    const [selectedType, setSelectedType] = useState<'all' | 'video' | 'test'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isFilterVisible, setIsFilterVisible] = useState(true);
    
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const paperId = queryParams.get('paper');
        const streamId = queryParams.get('stream');

        if (paperId) {
            setViewMode('all');
            setSelectedPaper(paperId);
            setSelectedStream('all'); 
        } else if (streamId) {
            setViewMode('all');
            setSelectedStream(streamId);
            setSelectedPaper('all');
        }
    }, [location.search]);
    
    const sortedStreams = useMemo(() => [...streams].sort(sortWithOrder), [streams]);
    const sortedPapers = useMemo(() => [...papers].sort(sortWithOrder), [papers]);
    const filteredPapers = useMemo(() => selectedStream === 'all' ? sortedPapers : sortedPapers.filter(p => p.streamIds.includes(selectedStream)), [selectedStream, sortedPapers]);
    const formContent = useMemo(() => contentItems.filter(item => item.type === 'form').sort(sortWithOrder), [contentItems]);

    const baseFilteredContent = useMemo(() => {
        const subjectContent = contentItems.filter(item => item.type !== 'form');
        
        const filtered = subjectContent.filter(item => {
            const paperIds = Array.isArray(item.paperIds) ? item.paperIds : [];
            const searchMatch = !searchQuery || item.title.toLowerCase().includes(searchQuery.toLowerCase());
            const paperMatch = selectedPaper === 'all' || paperIds.includes(selectedPaper);
            const streamMatch = selectedStream === 'all' || paperIds.some(pid => {
                const paper = papers.find(p => p.id === pid);
                return paper && paper.streamIds.includes(selectedStream);
            });
            const typeMatch = selectedType === 'all' || item.type === selectedType;
            return searchMatch && paperMatch && streamMatch && typeMatch;
        });
        return filtered.sort((a, b) => {
            const typeComparison = (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99);
            if (typeComparison !== 0) return typeComparison;
            return sortWithOrder(a, b);
        });
    }, [searchQuery, selectedStream, selectedPaper, selectedType, contentItems, papers]);

    const totalPages = Math.ceil(baseFilteredContent.length / ITEMS_PER_PAGE);
    const paginatedContent = useMemo(() => baseFilteredContent.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE), [currentPage, baseFilteredContent]);
    const handleFilterChange = (setter: React.Dispatch<any>, value: string) => { setter(value); setCurrentPage(1); };
    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => { setSearchQuery(event.target.value); setCurrentPage(1); };

    const contentByPaper = useMemo(() => {
        const grouped = baseFilteredContent.reduce<Record<string, ContentItem[]>>((acc, item) => {
            const paperIds = Array.isArray(item.paperIds) ? item.paperIds : [];
            paperIds.forEach(paperId => { (acc[paperId] = acc[paperId] || []).push(item); });
            return acc;
        }, {});
        return Object.entries(grouped).sort(([a], [b]) => (papers.find(p=>p.id===a)?.name||'').localeCompare(papers.find(p=>p.id===b)?.name||''));
    }, [baseFilteredContent, papers]);

    const contentByTier = useMemo(() => {
        const tierOrder = Object.keys(MembershipTiers) as TierKey[];
        const grouped = baseFilteredContent.reduce<Record<string, ContentItem[]>>((acc, item) => { (acc[item.tier] = acc[item.tier] || []).push(item); return acc; }, {});
        return Object.entries(grouped).sort(([a], [b]) => tierOrder.indexOf(a as TierKey) - tierOrder.indexOf(b as TierKey));
    }, [baseFilteredContent]);
    
    const testsOnlyContent = useMemo(() => baseFilteredContent.filter(item => item.type === 'test'), [baseFilteredContent]);

    const renderSelect = (label: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, options: {value: string, label: string}[]) => (
        <div className="w-full md:w-1/3 px-2 mb-4 md:mb-0">
            <label className="block text-sm font-medium text-body-text dark:text-dark-body-text mb-1">{label}</label>
            <select value={value} onChange={onChange} className="w-full p-2 border rounded-md bg-background dark:bg-dark-background text-body-text dark:text-dark-body-text dark:border-gray-600 focus:ring-accent focus:border-accent">
                {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
        </div>
    );
    
    const renderContent = () => {
        const renderListOrGrid = (items: ContentItem[]) => {
            if (items.length === 0) return <NoResults />;
            if (view === 'list') return <ul className="space-y-2">{items.map(item => <ContentListItem key={item.id} item={item} />)}</ul>;
            return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{items.map(item => <ContentCard key={item.id} item={item} />)}</div>;
        };

        switch (viewMode) {
            case 'all': return renderListOrGrid(paginatedContent);
            case 'byPaper': return contentByPaper.length > 0 ? <div>{contentByPaper.map(([paperId, items]) => (<AccordionItem key={paperId} title={papers.find(p => p.id === paperId)?.name || '...'} count={items.length}>{renderListOrGrid(items)}</AccordionItem>))}</div> : <NoResults />;
            case 'byTier': return contentByTier.length > 0 ? <div>{contentByTier.map(([tier, items]) => (<AccordionItem key={tier} title={MembershipTiers[tier as TierKey]?.name || tier} count={items.length}>{renderListOrGrid(items)}</AccordionItem>))}</div> : <NoResults />;
            case 'tests': return renderListOrGrid(testsOnlyContent);
            case 'forms': return renderListOrGrid(formContent);
            default: return <NoResults />;
        }
    };

    const availableTabs = useMemo(() => {
        const allTabs = [
            { id: 'all', label: 'All Content', visible: true },
            { id: 'byPaper', label: 'By Paper', visible: settings.showByPaperTab },
            { id: 'byTier', label: 'By Tier', visible: settings.showByTierTab },
            { id: 'tests', label: 'Tests', visible: settings.showTestsTab },
            { id: 'forms', label: 'Forms', visible: settings.showFormsTab },
        ];
        return allTabs.filter(tab => tab.visible);
    }, [settings]);
    
    return (
        <div className="container mx-auto p-4 md:p-8 font-body">
            <div className="rounded-lg shadow-md mb-8 bg-card-bg dark:bg-dark-card-bg">
                <button 
                    onClick={() => setIsFilterVisible(!isFilterVisible)} 
                    className="w-full flex justify-between items-center p-6 text-left"
                >
                    <h2 className="text-2xl font-bold text-primary-heading dark:text-dark-primary-heading font-heading">Find Content</h2>
                    <ChevronDownIcon className={`h-6 w-6 transform transition-transform text-gray-500 ${isFilterVisible ? 'rotate-180' : ''}`} />
                </button>
                {isFilterVisible && (
                    <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                        {viewMode !== 'forms' ? (
                            <>
                                <div className="flex flex-col md:flex-row -mx-2 mb-6">
                                    {renderSelect('Stream', selectedStream, (e) => handleFilterChange(setSelectedStream, e.target.value), [{value: 'all', label: 'All Streams'}, ...sortedStreams.map(s => ({ value: s.id, label: s.name }))])}
                                    {renderSelect('Paper', selectedPaper, (e) => handleFilterChange(setSelectedPaper, e.target.value), [{value: 'all', label: 'All Papers'}, ...filteredPapers.map(p => ({ value: p.id, label: p.name }))])}
                                    {renderSelect('Content Type', selectedType, (e) => handleFilterChange(setSelectedType, e.target.value), [{value: 'all', label: 'All Types'}, {value: 'video', label: 'Videos'}, {value: 'test', label: 'Tests'}])}
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search by title..."
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    className="w-full p-3 border rounded-md bg-background dark:bg-dark-background text-body-text dark:text-dark-body-text dark:border-gray-600 focus:ring-2 focus:ring-accent dark:focus:ring-dark-accent focus:outline-none"
                                />
                            </>
                        ) : <p className="text-body-text dark:text-dark-body-text">Browse general forms and resources.</p>}
                    </div>
                )}
            </div>
            <div className="flex justify-between items-center mb-6">
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="-mb-px flex space-x-8 overflow-x-auto">
                        {availableTabs.map(tab => {
                            const isActive = viewMode === tab.id;
                            return (
                                <button key={tab.id} onClick={() => setViewMode(tab.id as any)} className={`${ isActive ? 'border-accent dark:border-dark-accent text-accent dark:text-dark-accent' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600' } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none`}>
                                    {tab.label}
                                </button>
                            )
                        })}
                    </nav>
                </div>
                {viewMode !== 'forms' && (
                    <div className="flex space-x-1 p-1 bg-gray-200 dark:bg-gray-700 rounded-md">
                        <button onClick={() => setView('grid')} className={`p-2 rounded ${view === 'grid' ? 'bg-white dark:bg-gray-500' : ''}`}>
                            <GridIcon className="h-5 w-5 text-gray-600 dark:text-gray-300"/>
                        </button>
                        <button onClick={() => setView('list')} className={`p-2 rounded ${view === 'list' ? 'bg-white dark:bg-gray-500' : ''}`}>
                            <ListIcon className="h-5 w-5 text-gray-600 dark:text-gray-300"/>
                        </button>
                    </div>
                )}
            </div>
            
            {renderContent()}

            {viewMode === 'all' && baseFilteredContent.length > ITEMS_PER_PAGE && (
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            )}
        </div>
    );
};

export default ContentBrowserPage;