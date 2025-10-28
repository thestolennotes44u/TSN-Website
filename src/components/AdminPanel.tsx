import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useData } from '../context/DataContext';
import { storage, db } from '../firebaseConfig';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { writeBatch, doc } from 'firebase/firestore';
import type { Stream, Paper, ContentItem, CustomPage, AppSettings, CollectionName, TierKey } from '../types';
import { MembershipTiers } from '../types';
import Modal from './Modal';
import { LogoIcon } from './Icons';
import { ReorderableList } from './ReorderableList';

const commonInputClass = "mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm sm:text-sm bg-background dark:bg-dark-background text-body-text dark:text-dark-body-text focus:ring-accent focus:border-accent";
const commonLabelClass = "block text-sm font-medium text-body-text dark:text-dark-body-text";
const primaryButtonClass = "px-4 py-2 rounded-md text-white bg-accent dark:bg-dark-accent hover:opacity-90 disabled:opacity-50";
const sortWithOrder = <T extends { order?: number, id: string, title?: string, name?: string, slug?: string }>(a: T, b: T) => (a.order ?? Infinity) - (b.order ?? Infinity) || (a.name || a.title || a.id).localeCompare(b.name || b.title || b.id);
const NON_DELETABLE_SLUGS = ['about', 'whats-new'];

const AdminPanel: React.FC = () => {
    const { user, logout, changePassword } = useAuth();
    const { settings, setSettings } = useSettings();
    const { streams, papers, contentItems, pages, homepageContent, updateHomepageContent, addOrUpdateDoc, deleteDocById } = useData();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('homepage');
    const [currentSettings, setCurrentSettings] = useState<AppSettings | null>(settings);
    const [currentHomepageContent, setCurrentHomepageContent] = useState<HomepageContent | null>(homepageContent);
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState({ text: '', type: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [currentItem, setCurrentItem] = useState<Stream | Paper | ContentItem | CustomPage | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<CollectionName | 'page' | null>(null);
    const [formData, setFormData] = useState<any>({});
    const [streamsState, setStreamsState] = useState([...streams].sort(sortWithOrder));
    const [papersState, setPapersState] = useState([...papers].sort(sortWithOrder));
    const [contentState, setContentState] = useState([...contentItems].sort(sortWithOrder));
    const [pagesState, setPagesState] = useState([...pages].sort(sortWithOrder));
    const [dirtyState, setDirtyState] = useState({ streams: false, papers: false, contentItems: false, pages: false });
    const [paperFilter, setPaperFilter] = useState('all');

    useEffect(() => { setCurrentSettings(settings); }, [settings]);
    useEffect(() => { setCurrentHomepageContent(homepageContent); }, [homepageContent]);
    useEffect(() => { setStreamsState([...streams].sort(sortWithOrder)); }, [streams]);
    useEffect(() => { setPapersState([...papers].sort(sortWithOrder)); }, [papers]);
    useEffect(() => { setContentState([...contentItems].sort(sortWithOrder)); }, [contentItems]);
    useEffect(() => { setPagesState([...pages].sort(sortWithOrder)); }, [pages]);

    const filteredAdminContent = useMemo(() => {
        if (paperFilter === 'all') return contentState;
        return contentState.filter(item => Array.isArray(item.paperIds) && item.paperIds.includes(paperFilter));
    }, [paperFilter, contentState]);

    useEffect(() => {
        if (isModalOpen) {
            if (currentItem) { setFormData(currentItem); }
            else {
                const newOrder = Math.max(...[...streams, ...papers, ...contentItems, ...pages].map(i => i.order ?? 0), 0) + 1;
                switch (modalType) {
                    case 'streams': setFormData({ name: '', order: newOrder }); break;
                    case 'papers': setFormData({ name: '', streamIds: [], order: newOrder }); break;
                    case 'contentItems': setFormData({ title: '', url: '', paperIds: [], tier: 'PUBLIC', type: 'video', order: newOrder }); break;
                    case 'pages': setFormData({ title: '', content: '', isVisible: true, order: newOrder }); break;
                }
            }
        }
    }, [isModalOpen, currentItem, modalType]);

    const handlePasswordChange = async (e: React.FormEvent) => { /* ... */ };
    const handleSettingsSave = async () => {
        if (!currentSettings) return;
        setIsSaving(true);
        try { await addOrUpdateDoc('config', { ...currentSettings, id: 'settings' }); alert('Settings saved!'); }
        catch (error) { alert('Error saving settings.'); }
        finally { setIsSaving(false); }
    };
    const handleHomepageSave = async () => {
        if (!currentHomepageContent) return;
        setIsSaving(true);
        try { await addOrUpdateDoc('config', { ...currentHomepageContent, id: 'homepage' }); alert('Homepage content saved!'); }
        catch (error) { alert('Error saving homepage content.'); }
        finally { setIsSaving(false); }
    };
    const handleSettingsChange = (field: keyof AppSettings, value: any) => { setCurrentSettings(prev => prev ? { ...prev, [field]: value } : null); };
    const handleHomepageContentChange = (field: keyof HomepageContent, value: any) => { setCurrentHomepageContent(prev => prev ? { ...prev, [field]: value } : null); };
    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { /* ... */ };
    const handleRemoveLogo = async () => { /* ... */ };
    const handleLogout = async () => { await logout(); navigate('/'); };
    const handleAdd = (type: CollectionName | 'page') => { setCurrentItem(null); setModalType(type); setIsModalOpen(true); };
    const handleEdit = (item: any, type: CollectionName | 'page') => { setCurrentItem(item); setModalType(type); setIsModalOpen(true); };
    const handleDelete = async (type: CollectionName, id: string) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            try { await deleteDocById(type, id); }
            catch (error) { alert("Error deleting data."); }
        }
    };
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData((prev: any) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };
    const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => { /* ... */ };
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!modalType) return;
        const collectionName: CollectionName = modalType === 'page' ? 'pages' : modalType;
        const isNew = !formData.id;
        let dataToSave = { ...formData, id: isNew ? `${collectionName}-${Date.now()}` : formData.id };
        if (collectionName === 'pages') dataToSave.slug = dataToSave.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
        if (dataToSave.type === 'form') dataToSave.paperIds = [];
        try { await addOrUpdateDoc(collectionName, dataToSave); }
        catch (error) { alert("Error saving data."); }
        setIsModalOpen(false); setCurrentItem(null); setFormData({});
    };
    const saveOrder = async (collectionName: CollectionName) => { /* ... */ };
    const handleReorder = (setter: React.Dispatch<any>, key: keyof typeof dirtyState) => (reorderedItems: any[]) => { /* ... */ };
    const handleContentReorder = (reorderedFilteredItems: ContentItem[]) => { /* ... */ };
    
    const renderSettings = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-2xl font-bold">Site Settings</h3>
                {/* ... */}
            </div>
            <button onClick={handleSettingsSave}>Save Settings</button>
            <hr />
            <div>
                <h3>Change Password</h3>
                <form onSubmit={handlePasswordChange}>{/* ... */}</form>
            </div>
        </div>
    );

    const renderDisplaySettings = () => (
        <div className="space-y-6">
            <div>
                <h3>Display Options</h3>
                <div className="space-y-3 mt-4">
                    <div className="flex items-center"><input type="checkbox" id="showByPaperTab" name="showByPaperTab" checked={currentSettings?.showByPaperTab ?? true} onChange={(e) => handleSettingsChange('showByPaperTab', e.target.checked)} /><label htmlFor="showByPaperTab">Show "By Paper" Tab</label></div>
                    <div className="flex items-center"><input type="checkbox" id="showByTierTab" name="showByTierTab" checked={currentSettings?.showByTierTab ?? true} onChange={(e) => handleSettingsChange('showByTierTab', e.target.checked)} /><label htmlFor="showByTierTab">Show "By Tier" Tab</label></div>
                    {/* ... other checkboxes */}
                </div>
            </div>
            <button onClick={handleSettingsSave}>Save Display Settings</button>
        </div>
    );
    
    const renderCrudList = <T extends { id: string, name?: string, title?: string, slug?: string }>(/*...*/) => (/* ... */);
    const renderHomepageEditor = () => (/* ... */);
    const renderModalContent = () => { /*... Unchanged ...*/ };
    
    const tabs = [{ id: 'homepage', label: 'Homepage' }, { id: 'settings', label: 'Settings' }, { id: 'display', label: 'Display' }, { id: 'pages', label: 'Pages' }, { id: 'streams', label: 'Streams' }, { id: 'papers', label: 'Papers' }, { id: 'contentItems', label: 'Content' }];

    return (
        <>
            <div className="p-4 md:p-8 rounded-lg shadow-lg bg-card-bg dark:bg-dark-card-bg text-body-text dark:text-dark-body-text">
                <div className="flex justify-between items-start mb-6">{/* ... */}</div>
                <div className="border-b border-gray-300 dark:border-gray-700">
                    <nav className="-mb-px flex space-x-8 overflow-x-auto">{/* ... */}</nav>
                </div>
                <div className="mt-6">
                    {activeTab === 'homepage' && renderHomepageEditor()}
                    {activeTab === 'settings' && renderSettings()}
                    {activeTab === 'display' && renderDisplaySettings()}
                    {activeTab === 'pages' && renderCrudList<CustomPage>('Manage Pages', pagesState, 'pages', handleReorder(setPagesState, 'pages'), dirtyState.pages)}
                    {activeTab === 'streams' && renderCrudList<Stream>('Manage Streams', streamsState, 'streams', handleReorder(setStreamsState, 'streams'), dirtyState.streams)}
                    {activeTab === 'papers' && renderCrudList<Paper>('Manage Papers', papersState, 'papers', handleReorder(setPapersState, 'papers'), dirtyState.papers)}
                    {activeTab === 'contentItems' && renderCrudList<ContentItem>('Manage Content', filteredAdminContent, 'contentItems', handleContentReorder, dirtyState.contentItems)}
                </div>
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`${currentItem ? 'Edit' : 'Add'} ${modalType}`}>
                <form onSubmit={handleSave}>
                    {renderModalContent()}
                    <div className="mt-6 flex justify-end space-x-3">{/* ... */}</div>
                </form>
            </Modal>
        </>
    );
};
export default AdminPanel;