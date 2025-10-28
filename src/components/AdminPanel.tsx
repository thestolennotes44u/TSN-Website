import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useData } from '../context/DataContext';
import { storage, db } from '../firebaseConfig';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { writeBatch, doc } from 'firebase/firestore';
import type { Stream, Paper, ContentItem, CustomPage, AppSettings, CollectionName, TierKey, HomepageContent } from '../types';
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

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMessage({ text: '', type: '' });
        if (newPassword !== confirmNewPassword) { setPasswordMessage({ text: 'Passwords do not match.', type: 'error' }); return; }
        if (newPassword.length < 6) { setPasswordMessage({ text: 'Password must be >= 6 characters.', type: 'error' }); return; }
        try {
            await changePassword(newPassword);
            setPasswordMessage({ text: 'Password changed successfully!', type: 'success' });
            setNewPassword(''); setConfirmNewPassword('');
        } catch (error) { setPasswordMessage({ text: 'Failed to change password.', type: 'error' }); }
    };
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
    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !currentSettings) return;
        if (file.size > 1024 * 500) { alert('File is too large (< 500KB).'); return; }
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const base64Data = reader.result as string;
            const logoRef = ref(storage, 'config/logo');
            try {
                setIsSaving(true);
                await uploadString(logoRef, base64Data, 'data_url');
                const downloadURL = await getDownloadURL(logoRef);
                handleSettingsChange('logoUrl', downloadURL);
                if (currentSettings) {
                    const newSettings = { ...currentSettings, logoUrl: downloadURL };
                    await addOrUpdateDoc('config', { ...newSettings, id: 'settings' });
                    alert('Settings saved!');
                }
            } catch (error) { alert("Logo upload failed."); }
            finally { setIsSaving(false); }
        };
    };
    const handleRemoveLogo = async () => {
        if (!currentSettings || !window.confirm("Remove logo?")) return;
        const logoRef = ref(storage, 'config/logo');
        try { setIsSaving(true); await deleteObject(logoRef); }
        catch (error) { console.warn("Could not delete logo:", error); }
        const newSettings = { ...currentSettings, logoUrl: '' };
        await addOrUpdateDoc('config', { ...newSettings, id: 'settings' });
        alert('Settings saved!');
        setIsSaving(false);
    };
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
    const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = Array.from(e.target.selectedOptions, option => option.value);
        setFormData((prev: any) => ({ ...prev, [e.target.name]: value }));
    };
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
    const saveOrder = async (collectionName: CollectionName) => {
        let itemsToSave: any[] = [];
        switch (collectionName) {
            case 'streams': itemsToSave = streamsState; break;
            case 'papers': itemsToSave = papersState; break;
            case 'contentItems': itemsToSave = contentState; break;
            case 'pages': itemsToSave = pagesState; break;
        }
        const batch = writeBatch(db);
        itemsToSave.forEach((item, index) => {
            const docRef = doc(db, collectionName, item.id);
            batch.update(docRef, { order: index });
        });
        try {
            await batch.commit();
            setDirtyState(prev => ({ ...prev, [collectionName]: false }));
            alert('New order saved successfully!');
        } catch (error) {
            alert('Failed to save new order.');
        }
    };
    const handleReorder = (setter: React.Dispatch<any>, key: keyof typeof dirtyState) => (reorderedItems: any[]) => {
        setter(reorderedItems);
        setDirtyState(prev => ({ ...prev, [key]: true }));
    };
    const handleContentReorder = (reorderedFilteredItems: ContentItem[]) => {
        const newOrderMap = new Map(reorderedFilteredItems.map((item, index) => [item.id, index]));
        const newFullList = [...contentState];
        newFullList.sort((a, b) => {
            const aInFiltered = newOrderMap.has(a.id);
            const bInFiltered = newOrderMap.has(b.id);
            if (aInFiltered && bInFiltered) return newOrderMap.get(a.id)! - newOrderMap.get(b.id)!;
            if (aInFiltered) return -1;
            if (bInFiltered) return 1;
            return 0;
        });
        setContentState(newFullList);
        setDirtyState(prev => ({ ...prev, contentItems: true }));
    };
    
    const renderSettings = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-2xl font-bold text-primary-heading dark:text-dark-primary-heading">Site Settings</h3>
                <div className="space-y-4 mt-4">
                    <div><label className={commonLabelClass}>Site Title</label><input type="text" name="siteTitle" value={currentSettings?.siteTitle || ''} onChange={(e) => handleSettingsChange('siteTitle', e.target.value)} className={commonInputClass} /></div>
                    <div><label className={commonLabelClass}>Admin Email</label><input type="email" name="adminEmail" value={currentSettings?.adminEmail || ''} onChange={(e) => handleSettingsChange('adminEmail', e.target.value)} className={commonInputClass} /></div>
                    <div>
                        <label className={commonLabelClass}>Site Logo</label>
                        <div className="mt-1 flex items-center space-x-4">
                            {currentSettings?.logoUrl ? <img src={currentSettings.logoUrl} alt="Logo" className="h-16 w-16 rounded-full object-cover bg-gray-100" /> : <div className="h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"><LogoIcon className="h-8 w-8 text-gray-500" /></div>}
                            <div>
                                <input type="file" id="logo-upload" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                <label htmlFor="logo-upload" className="cursor-pointer rounded-md border border-gray-300 bg-white py-2 px-3 text-sm font-medium shadow-sm hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600">Change</label>
                                {currentSettings?.logoUrl && <button type="button" onClick={handleRemoveLogo} className="ml-3 text-sm text-red-500 hover:underline">Remove</button>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <button onClick={handleSettingsSave} disabled={isSaving} className={primaryButtonClass}>{isSaving ? 'Saving...' : 'Save Settings'}</button>
            <hr className="my-6 border-gray-300 dark:border-gray-600" />
            <div>
                <h3 className="text-2xl font-bold mb-4 text-primary-heading dark:text-dark-primary-heading">Change Password for {user?.email}</h3>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                    <input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className={commonInputClass} />
                    <input type="password" placeholder="Confirm New Password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} required className={commonInputClass} />
                    {passwordMessage.text && <p className={`text-sm ${passwordMessage.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>{passwordMessage.text}</p>}
                    <button type="submit" className={primaryButtonClass}>Change Password</button>
                </form>
            </div>
        </div>
    );

    const renderDisplaySettings = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-2xl font-bold text-primary-heading dark:text-dark-primary-heading">Content Page Tabs</h3>
                <p className="text-sm text-gray-500 mt-1">Control which tabs are visible on the main content page.</p>
                <div className="space-y-3 mt-4 p-4 bg-background dark:bg-dark-background rounded-md border border-gray-300 dark:border-gray-700">
                    <div className="flex items-center"><input type="checkbox" id="showByPaperTab" name="showByPaperTab" checked={currentSettings?.showByPaperTab ?? true} onChange={(e) => handleSettingsChange('showByPaperTab', e.target.checked)} className="h-4 w-4 rounded" /><label htmlFor="showByPaperTab" className="ml-2">Show "By Paper" Tab</label></div>
                    <div className="flex items-center"><input type="checkbox" id="showByTierTab" name="showByTierTab" checked={currentSettings?.showByTierTab ?? true} onChange={(e) => handleSettingsChange('showByTierTab', e.target.checked)} className="h-4 w-4 rounded" /><label htmlFor="showByTierTab" className="ml-2">Show "By Tier" Tab</label></div>
                    <div className="flex items-center"><input type="checkbox" id="showTestsTab" name="showTestsTab" checked={currentSettings?.showTestsTab ?? true} onChange={(e) => handleSettingsChange('showTestsTab', e.target.checked)} className="h-4 w-4 rounded" /><label htmlFor="showTestsTab" className="ml-2">Show "Tests" Tab</label></div>
                    <div className="flex items-center"><input type="checkbox" id="showFormsTab" name="showFormsTab" checked={currentSettings?.showFormsTab ?? true} onChange={(e) => handleSettingsChange('showFormsTab', e.target.checked)} className="h-4 w-4 rounded" /><label htmlFor="showFormsTab" className="ml-2">Show "Forms" Tab</label></div>
                </div>
            </div>
            <button onClick={handleSettingsSave} disabled={isSaving} className={primaryButtonClass}>{isSaving ? 'Saving...' : 'Save Display Settings'}</button>
        </div>
    );
    
    const renderCrudList = <T extends { id: string, name?: string, title?: string, slug?: string }>(
        title: string, items: T[], type: CollectionName | 'page', onReorder: (reorderedItems: T[]) => void, isDirty: boolean
    ) => (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-primary-heading dark:text-dark-primary-heading">{title}</h3>
                <div>
                    {isDirty && <button onClick={() => saveOrder(type as CollectionName)} className="px-4 py-2 rounded-md mr-4 text-sm bg-green-500 text-white hover:bg-green-600">Save Order</button>}
                    <button onClick={() => handleAdd(type)} className={primaryButtonClass}>Add New</button>
                </div>
            </div>
            {type === 'contentItems' && (
                <div className="mb-4">
                    <label className={commonLabelClass}>Filter by Paper to Reorder</label>
                    <select value={paperFilter} onChange={(e) => setPaperFilter(e.target.value)} className={commonInputClass}>
                        <option value="all">All Papers</option>
                        {papers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
            )}
            <ReorderableList
                items={items}
                onReorder={onReorder}
                renderItem={(item) => (
                    <div className="w-full p-2 border rounded border-gray-300 dark:border-gray-600 flex justify-between items-center bg-background dark:bg-dark-background">
                        <span className="truncate pr-4 text-body-text dark:text-dark-body-text">{item.name || item.title || 'Untitled'}</span>
                        <div className="flex-shrink-0">
                            <button onClick={() => handleEdit(item, type)} className="text-sm text-blue-500 hover:underline mr-2">Edit</button>
                            {!(type === 'pages' && item.slug && NON_DELETABLE_SLUGS.includes(item.slug)) && (
                                <button onClick={() => handleDelete(type as CollectionName, item.id)} className="text-sm text-red-500 hover:underline">Delete</button>
                            )}
                        </div>
                    </div>
                )}
            />
        </div>
    );

    const renderHomepageEditor = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-2xl font-bold text-primary-heading dark:text-dark-primary-heading">Welcome Section</h3>
                <div className="space-y-4 mt-4">
                    <div><label className={commonLabelClass}>Welcome Title</label><input type="text" value={currentHomepageContent?.welcomeTitle || ''} onChange={(e) => handleHomepageContentChange('welcomeTitle', e.target.value)} className={commonInputClass} /></div>
                    <div><label className={commonLabelClass}>Welcome Text</label><textarea value={currentHomepageContent?.welcomeText || ''} onChange={(e) => handleHomepageContentChange('welcomeText', e.target.value)} className={`${commonInputClass} h-24`} /></div>
                </div>
            </div>
            <hr className="my-6 border-gray-300 dark:border-gray-600" />
            <div>
                <h3 className="text-2xl font-bold text-primary-heading dark:text-dark-primary-heading">Additional Section</h3>
                <div className="space-y-4 mt-4">
                    <div className="flex items-center"><input type="checkbox" id="showHomeExtra" checked={currentHomepageContent?.showExtraSection ?? false} onChange={(e) => handleHomepageContentChange('showExtraSection', e.target.checked)} className="h-4 w-4 rounded" /><label htmlFor="showHomeExtra" className="ml-2">Show this section</label></div>
                    <div><label className={commonLabelClass}>Section Title</label><input type="text" value={currentHomepageContent?.extraSectionTitle || ''} onChange={(e) => handleHomepageContentChange('extraSectionTitle', e.target.value)} className={commonInputClass} /></div>
                    <div><label className={commonLabelClass}>Content (Markdown)</label><textarea value={currentHomepageContent?.extraSectionContent || ''} onChange={(e) => handleHomepageContentChange('extraSectionContent', e.target.value)} className={`${commonInputClass} h-40 font-mono`} /></div>
                </div>
            </div>
            <button onClick={handleHomepageSave} disabled={isSaving} className={primaryButtonClass}>{isSaving ? 'Saving...' : 'Save Homepage'}</button>
        </div>
    );
    
    const renderModalContent = () => {
        if (!modalType) return null;
        switch (modalType) {
            case 'streams': return (<div><label className={commonLabelClass}>Stream Name</label><input type="text" name="name" value={formData.name || ''} onChange={handleFormChange} className={commonInputClass} required /></div>);
            case 'papers': return (<div className="space-y-4"><div><label className={commonLabelClass}>Paper Name</label><input type="text" name="name" value={formData.name || ''} onChange={handleFormChange} className={commonInputClass} required /></div><div><label className={commonLabelClass}>Streams</label><select name="streamIds" multiple value={formData.streamIds || []} onChange={handleMultiSelectChange} className={`${commonInputClass} h-32`} required>{streams.map(stream => <option key={stream.id} value={stream.id}>{stream.name}</option>)}</select></div></div>);
            case 'contentItems': return (
                <div className="space-y-4">
                    <div><label className={commonLabelClass}>Type</label><select name="type" value={formData.type || 'video'} onChange={handleFormChange} className={commonInputClass} required><option value="video">Video</option><option value="test">Test</option><option value="form">Form</option></select></div>
                    <div><label className={commonLabelClass}>Title</label><input type="text" name="title" value={formData.title || ''} onChange={handleFormChange} className={commonInputClass} required /></div>
                    <div><label className={commonLabelClass}>URL</label><input type="url" name="url" value={formData.url || ''} onChange={handleFormChange} className={commonInputClass} required /></div>
                    {formData.type !== 'form' && (
                        <div><label className={commonLabelClass}>Papers</label><select name="paperIds" multiple value={formData.paperIds || []} onChange={handleMultiSelectChange} className={`${commonInputClass} h-32`} required>{papers.map(paper => <option key={paper.id} value={paper.id}>{paper.name}</option>)}</select></div>
                    )}
                    <div>
                        <label className={commonLabelClass}>Tier</label>
                        <select name="tier" value={formData.tier || 'PUBLIC'} onChange={handleFormChange} className={commonInputClass} required>
                            {(Object.keys(MembershipTiers) as TierKey[]).map(tierKey => (
                                <option key={tierKey} value={tierKey}>{MembershipTiers[tierKey].name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            );
            case 'pages': return (<div className="space-y-4"><div><label className={commonLabelClass}>Page Title</label><input type="text" name="title" value={formData.title || ''} onChange={handleFormChange} className={commonInputClass} required /></div><div><label className={commonLabelClass}>Content (Markdown)</label><textarea name="content" value={formData.content || ''} onChange={handleFormChange} className={`${commonInputClass} h-40 font-mono`} rows={10}></textarea></div><div className="flex items-center"><input type="checkbox" id="isVisible" name="isVisible" checked={formData.isVisible ?? true} onChange={handleFormChange} className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 bg-background dark:bg-dark-background text-accent focus:ring-accent" /><label htmlFor="isVisible" className="ml-2 block text-sm text-body-text dark:text-dark-body-text">Visible</label></div></div>);
        }
    };

    const tabs = [{ id: 'homepage', label: 'Homepage' }, { id: 'settings', label: 'Settings' }, { id: 'display', label: 'Display' }, { id: 'pages', label: 'Pages' }, { id: 'streams', label: 'Streams' }, { id: 'papers', label: 'Papers' }, { id: 'contentItems', label: 'Content' }];
    return (
        <>
            <div className="p-4 md:p-8 rounded-lg shadow-lg bg-card-bg dark:bg-dark-card-bg text-body-text dark:text-dark-body-text">
                <div className="flex justify-between items-start mb-6">
                    <h2 className="text-3xl font-bold text-primary-heading dark:text-dark-primary-heading">Admin Dashboard</h2>
                    <button onClick={handleLogout} className="text-sm hover:underline text-body-text dark:text-dark-body-text">Logout</button>
                </div>
                <div className="border-b border-gray-300 dark:border-gray-700">
                    <nav className="-mb-px flex space-x-8 overflow-x-auto">{tabs.map(tab => {
                        const isActive = activeTab === tab.id;
                        return (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`${isActive ? `border-accent dark:border-dark-accent text-accent dark:text-dark-accent` : 'border-transparent text-gray-500 hover:border-gray-400'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>{tab.label}</button>);
                    })}</nav>
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
                    <div className="mt-6 flex justify-end space-x-3">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-body-text dark:text-dark-body-text">Cancel</button>
                        <button type="submit" className={`${primaryButtonClass} text-sm font-medium`}>Save</button>
                    </div>
                </form>
            </Modal>
        </>
    );
};
export default AdminPanel;