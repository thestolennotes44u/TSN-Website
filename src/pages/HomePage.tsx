import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useSettings } from '../context/SettingsContext';
import type { ContentItem } from '../types';
import { MembershipTier } from '../types';
import { VideoIcon, TestIcon, FormIcon, ExternalLinkIcon, ChevronDownIcon } from '../components/Icons';

const ContentCard: React.FC<{ item: ContentItem }> = ({ item }) => {
    // FIXED: Changed themeClasses to themeStyles
    const { themeStyles } = useSettings();
    const Icon = item.type === 'video' ? VideoIcon : item.type === 'test' ? TestIcon : FormIcon;
    const tierColor = {
        [MembershipTier.PUBLIC]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        [MembershipTier.LEVEL_1]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        [MembershipTier.LEVEL_2]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
        [MembershipTier.LEVEL_3]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    };
    return (
        // FIXED: Switched to style prop for the card background
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="block rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 group" style={themeStyles.card}>
            <div className="p-5 flex items-start justify-between">
                <div className="flex items-center flex-1 min-w-0">
                    {/* FIXED: Switched to style prop for the icon color */}
                    <Icon className="h-8 w-8 mr-4 flex-shrink-0" style={themeStyles.accentText} />
                    <div className="min-w-0">
                       {/* FIXED: Switched to style prop for the heading color */}
                       <h3 className="text-lg font-semibold truncate group-hover:text-clip group-hover:whitespace-normal" style={themeStyles.secondaryHeading}>{item.title}</h3>
                       <span className={`text-xs font-medium mr-2 px-2.5 py-0.5 rounded ${tierColor[item.tier]}`}>{item.tier}</span>
                    </div>
                </div>
                <ExternalLinkIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 ml-2 flex-shrink-0" />
            </div>
        </a>
    );
};

const AccordionItem: React.FC<{ title: React.ReactNode; children: React.ReactNode; count: number }> = ({ title, children, count }) => {
  const [isOpen, setIsOpen] = useState(false);
  // FIXED: Changed themeClasses to themeStyles
  const { themeStyles } = useSettings();
  if (count === 0) return null;
  return (
    // FIXED: Switched to style prop for the card background
    <div className="rounded-lg shadow-md overflow-hidden mb-4" style={themeStyles.card}>
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-left p-5 focus:outline-none" aria-expanded={isOpen}>
        <div className="flex items-center">
            {/* FIXED: Switched to style prop for the heading color */}
            <h3 className="text-xl font-semibold" style={themeStyles.primaryHeading}>{title}</h3>
            {/* FIXED: Switched to style prop for the accent background */}
            <span className="ml-3 text-sm font-medium px-2.5 py-0.5 rounded-full text-white" style={themeStyles.button}>{count}</span>
        </div>
        <ChevronDownIcon className={`h-6 w-6 transform transition-transform text-gray-500 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && <div className="p-5 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{children}</div>}
    </div>
  );
};

const NoResults = ({ message = "No content found." }: { message?: string }) => <div className="text-center py-16"><p className="text-gray-500 dark:text-gray-400 text-lg">{message}</p></div>;

const HomePage: React.FC = () => {
    const { streams, papers, contentItems } = useData();
    // FIXED: Changed themeClasses to themeStyles
    const { themeStyles } = useSettings();
    const [selectedStream, setSelectedStream] = useState<string>('all');
    const [selectedPaper, setSelectedPaper] = useState<string>('all');
    const [selectedTier, setSelectedTier] = useState<string>('all');
    const [viewMode, setViewMode] = useState<'all' | 'byPaper' | 'byTier' | 'tests'>('all');

    const filteredPapers = useMemo(() => selectedStream === 'all' ? papers : papers.filter(p => p.streamIds.includes(selectedStream)), [selectedStream, papers]);
    const baseFilteredContent = useMemo(() => contentItems.filter(item => {
        const paper = papers.find(p => p.id === item.paperId);
        return paper && (selectedStream === 'all' || paper.streamIds.includes(selectedStream)) && (selectedPaper === 'all' || item.paperId === selectedPaper) && (selectedTier === 'all' || item.tier === selectedTier);
    }), [selectedStream, selectedPaper, selectedTier, contentItems, papers]);

    const contentByPaper = useMemo(() => {
        const grouped = baseFilteredContent.reduce<Record<string, ContentItem[]>>((acc, item) => { (acc[item.paperId] = acc[item.paperId] || []).push(item); return acc; }, {});
        return Object.entries(grouped).sort(([a], [b]) => (papers.find(p=>p.id===a)?.name||'').localeCompare(papers.find(p=>p.id===b)?.name||''));
    }, [baseFilteredContent, papers]);

    const contentByTier = useMemo(() => {
        const tierOrder = Object.values(MembershipTier);
        const grouped = baseFilteredContent.reduce<Record<string, ContentItem[]>>((acc, item) => { (acc[item.tier] = acc[item.tier] || []).push(item); return acc; }, {});
        return Object.entries(grouped).sort(([a], [b]) => tierOrder.indexOf(a as MembershipTier) - tierOrder.indexOf(b as MembershipTier));
    }, [baseFilteredContent]);
    
    const testsByPaper = useMemo(() => {
        const grouped = baseFilteredContent.filter(item => item.type === 'test').reduce<Record<string, ContentItem[]>>((acc, item) => { (acc[item.paperId] = acc[item.paperId] || []).push(item); return acc; }, {});
        return Object.entries(grouped).sort(([a], [b]) => (papers.find(p=>p.id===a)?.name||'').localeCompare(papers.find(p=>p.id===b)?.name||''));
    }, [baseFilteredContent, papers]);

    const renderSelect = (label: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, options: {value: string, label: string}[]) => (
        <div className="w-full md:w-1/3 px-2 mb-4 md:mb-0">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
            <select value={value} onChange={onChange} className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"><option value="all">All</option>{options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select>
        </div>
    );
    
    const renderTabs = () => {
        const tabs = [{ id: 'all', label: 'All Content' }, { id: 'byPaper', label: 'By Paper' }, { id: 'byTier', label: 'By Tier' }, { id: 'tests', label: 'Tests' }];
        return (
            <div className="mb-6 border-b border-gray-200 dark:border-gray-700"><nav className="-mb-px flex space-x-8">{tabs.map(tab => {
                const isActive = viewMode === tab.id;
                return (
                    // FIXED: Switched to style prop for the accent color
                    <button key={tab.id} onClick={() => setViewMode(tab.id as any)} style={isActive ? themeStyles.accentText : {}} className={`${ isActive ? `border-indigo-500` : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600' } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none`}>
                        {tab.label}
                    </button>
                )
            })}</nav></div>
        );
    };
    
    const renderContent = () => {
        switch (viewMode) {
            case 'byPaper': return contentByPaper.length > 0 ? <div>{contentByPaper.map(([paperId, items]) => (<AccordionItem key={paperId} title={papers.find(p => p.id === paperId)?.name || '...'} count={items.length}>{items.map(item => <ContentCard key={item.id} item={item} />)}</AccordionItem>))}</div> : <NoResults />;
            case 'byTier': return contentByTier.length > 0 ? <div>{contentByTier.map(([tier, items]) => (<AccordionItem key={tier} title={tier} count={items.length}>{items.map(item => <ContentCard key={item.id} item={item} />)}</AccordionItem>))}</div> : <NoResults />;
            case 'tests': return testsByPaper.length > 0 ? <div>{testsByPaper.map(([paperId, items]) => (<AccordionItem key={paperId} title={`Tests for: ${papers.find(p => p.id === paperId)?.name || '...'}`} count={items.length}>{items.map(item => <ContentCard key={item.id} item={item} />)}</AccordionItem>))}</div> : <NoResults message="No tests found." />;
            default: return baseFilteredContent.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{baseFilteredContent.map(item => <ContentCard key={item.id} item={item} />)}</div> : <NoResults />;
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            {/* FIXED: Switched to style prop for card background */}
            <div className="p-6 rounded-lg shadow-md mb-8" style={themeStyles.card}>
                {/* FIXED: Switched to style prop for heading color */}
                <h2 className="text-2xl font-bold mb-4" style={themeStyles.primaryHeading}>Find Content</h2>
                <div className="flex flex-col md:flex-row -mx-2">
                    {renderSelect('Stream', selectedStream, (e) => setSelectedStream(e.target.value), streams.map(s => ({ value: s.id, label: s.name })))}
                    {renderSelect('Paper', selectedPaper, (e) => setSelectedPaper(e.target.value), filteredPapers.map(p => ({ value: p.id, label: p.name })))}
                    {renderSelect('Tier', selectedTier, (e) => setSelectedTier(e.target.value), Object.values(MembershipTier).map(t => ({ value: t, label: t })))}
                </div>
            </div>
            {renderTabs()}
            {renderContent()}
        </div>
    );
};

export default HomePage;