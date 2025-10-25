import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useData } from '../context/DataContext';
import { storage } from '../firebaseConfig';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { COLOR_OPTIONS } from '../types'; // This is no longer used but can be left for now
import type { Stream, Paper, ContentItem, CustomPage, AppSettings, CollectionName } from '../types';
import { MembershipTier } from '../types';
import Modal from './Modal';
import { LogoIcon } from './Icons';

const AdminPanel: React.FC = () => {
    const { user, logout, changePassword } = useAuth();
    // FIXED: Switched to themeStyles
    const { settings, setSettings, themeStyles } = useSettings();
    const { streams, papers, contentItems, pages, addOrUpdateDoc, deleteDocById } = useData();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('settings');
    const [currentSettings, setCurrentSettings] = useState<AppSettings | null>(settings);
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState({ text: '', type: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [currentItem, setCurrentItem] = useState<Stream | Paper | ContentItem | CustomPage | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<CollectionName | 'page' | null>(null);
    const [formData, setFormData] = useState<any>({});

    useEffect(() => { setCurrentSettings(settings); }, [settings]);
    useEffect(() => {
        if (isModalOpen) {
            if (currentItem) { setFormData(currentItem); } 
            else {
                switch (modalType) {
                    case 'streams': setFormData({ name: '' }); break;
                    case 'papers': setFormData({ name: '', streamIds: [] }); break;
                    case 'contentItems': setFormData({ title: '', url: '', paperId: '', tier: MembershipTier.PUBLIC, type: 'video' }); break;
                    case 'pages': setFormData({ title: '', content: '', isVisible: true }); break;
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
        } catch(error) { setPasswordMessage({ text: 'Failed to change password.', type: 'error' }); }
    };
    
    const handleSettingsSave = async () => {
        if (!currentSettings) return;
        setIsSaving(true);
        try { await setSettings(currentSettings); alert('Settings saved!'); } 
        catch (error) { alert('Error saving settings.'); } 
        finally { setIsSaving(false); }
    };
    
    const handleSettingsChange = (field: keyof AppSettings, value: any) => { setCurrentSettings(prev => prev ? { ...prev, [field]: value } : null); }
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
                // Saving automatically after upload
                if (currentSettings) {
                    const newSettings = { ...currentSettings, logoUrl: downloadURL };
                    await setSettings(newSettings);
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
        await setSettings(newSettings);
        alert('Settings saved!');
        setIsSaving(false);
    };

    const handleLogout = async () => { await logout(); navigate('/'); };
    const handleAdd = (type: CollectionName | 'page') => { setCurrentItem(null); setModalType(type); setIsModalOpen(true); };
    const handleEdit = (item: any, type: CollectionName | 'page') => { setCurrentItem(item); setModalType(type); setIsModalOpen(true); };
    
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!modalType) return;
        const collectionName: CollectionName = modalType === 'page' ? 'pages' : modalType;
        const isNew = !formData.id;
        let dataToSave = { ...formData, id: isNew ? `${collectionName}-${Date.now()}` : formData.id };
        if (collectionName === 'pages') dataToSave.slug = dataToSave.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
        try { await addOrUpdateDoc(collectionName, dataToSave); } 
        catch (error) { alert("Error saving data."); }
        setIsModalOpen(false); setCurrentItem(null); setFormData({});
    };

    const handleDelete = async (type: CollectionName, id: string) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            try { await deleteDocById(type, id); } 
            catch (error) { alert("Error deleting data."); }
        }
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }));
    };
    const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = Array.from(e.target.selectedOptions, option => option.value);
        setFormData((prev: any) => ({ ...prev, [e.target.name]: value }));
    };
    
    /*
    // REMOVED: This function is no longer needed as we've removed the color settings UI.
    const renderSelect = (label: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, options: readonly string[]) => (
        <div>
            <label className="block text-sm font-medium">{label}</label>
            <select value={value} onChange={onChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 capitalize">
                {options.map(color => <option key={color} value={color}>{color}</option>)}
            </select>
        </div>
    );
    */
    
    if (!settings || !currentSettings) { return <div>Loading...</div> }
    
    const renderSettings = () => (
        <div className="space-y-4">
            <h3 className="text-2xl font-bold">Settings</h3>
            <div><label className="block text-sm font-medium">Admin Email</label><input type="email" value={currentSettings.adminEmail} onChange={e => handleSettingsChange('adminEmail', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600" /></div>
            <div><label className="block text-sm font-medium">Site Title</label><input type="text" value={currentSettings.siteTitle} onChange={e => handleSettingsChange('siteTitle', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600" /></div>
            <div>
                <label className="block text-sm font-medium">Site Logo</label>
                <div className="mt-1 flex items-center space-x-4">
                    {currentSettings.logoUrl ? <img src={currentSettings.logoUrl} alt="Logo" className="h-16 w-16 rounded-full object-cover bg-gray-100" /> : <div className="h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"><LogoIcon className="h-8 w-8 text-gray-500" /></div>}
                    <div>
                        <input type="file" id="logo-upload" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                        <label htmlFor="logo-upload" className="cursor-pointer rounded-md border border-gray-300 bg-white py-2 px-3 text-sm font-medium shadow-sm hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600">Change</label>
                        {currentSettings.logoUrl && <button type="button" onClick={handleRemoveLogo} className="ml-3 text-sm text-red-500 hover:underline">Remove</button>}
                    </div>
                </div>
            </div>
            
            {/* REMOVED: The entire grid of color selectors has been removed */}

            <button onClick={handleSettingsSave} disabled={isSaving} style={themeStyles.button} className="px-4 py-2 rounded-md disabled:opacity-50">{isSaving ? 'Saving...' : 'Save Settings'}</button>
            <hr className="my-6 dark:border-gray-600"/>
            <h3 className="text-2xl font-bold mb-4">Change Password for {user?.email}</h3>
            <form onSubmit={handlePasswordChange} className="space-y-4">
                <input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600"/>
                <input type="password" placeholder="Confirm New Password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600"/>
                {passwordMessage.text && <p className={`text-sm ${passwordMessage.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>{passwordMessage.text}</p>}
                <button type="submit" style={themeStyles.button} className="px-4 py-2 rounded-md">Change Password</button>
            </form>
        </div>
    );
    const renderCrudList = <T extends {id: string, name?: string, title?: string}>(title: string, items: T[], type: CollectionName) => (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold">{title}</h3>
                <button onClick={() => handleAdd(type)} style={themeStyles.button} className="px-4 py-2 rounded-md">Add New</button>
            </div>
            <ul className="space-y-2">{items.map(item => (<li key={item.id} className="p-2 border rounded dark:border-gray-600 flex justify-between items-center"><span className="truncate pr-4">{item.name || item.title}</span><div className="flex-shrink-0"><button onClick={() => handleEdit(item, type)} className="text-sm text-blue-500 hover:underline mr-2">Edit</button><button onClick={() => handleDelete(type, item.id)} className="text-sm text-red-500 hover:underline">Delete</button></div></li>))}</ul>
        </div>
    );
    const renderModalContent = () => {
        if (!modalType) return null;
        const commonInputClass = "mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600";
        const commonLabelClass = "block text-sm font-medium";
        switch (modalType) {
            case 'streams': return (<div><label className={commonLabelClass}>Stream Name</label><input type="text" name="name" value={formData.name || ''} onChange={handleFormChange} className={commonInputClass} required /></div>);
            case 'papers': return (<div className="space-y-4"><div><label className={commonLabelClass}>Paper Name</label><input type="text" name="name" value={formData.name || ''} onChange={handleFormChange} className={commonInputClass} required /></div><div><label className={commonLabelClass}>Streams</label><select name="streamIds" multiple value={formData.streamIds || []} onChange={handleMultiSelectChange} className={`${commonInputClass} h-32`} required>{streams.map(stream => <option key={stream.id} value={stream.id}>{stream.name}</option>)}</select></div></div>);
            case 'contentItems': return (<div className="space-y-4"><div><label className={commonLabelClass}>Title</label><input type="text" name="title" value={formData.title || ''} onChange={handleFormChange} className={commonInputClass} required /></div><div><label className={commonLabelClass}>URL</label><input type="url" name="url" value={formData.url || ''} onChange={handleFormChange} className={commonInputClass} required /></div><div><label className={commonLabelClass}>Paper</label><select name="paperId" value={formData.paperId || ''} onChange={handleFormChange} className={commonInputClass} required><option value="" disabled>Select a paper</option>{papers.map(paper => <option key={paper.id} value={paper.id}>{paper.name}</option>)}</select></div><div><label className={commonLabelClass}>Tier</label><select name="tier" value={formData.tier || ''} onChange={handleFormChange} className={commonInputClass} required>{Object.values(MembershipTier).map(tier => <option key={tier} value={tier}>{tier}</option>)}</select></div><div><label className={commonLabelClass}>Type</label><select name="type" value={formData.type || ''} onChange={handleFormChange} className={commonInputClass} required><option value="video">Video</option><option value="test">Test</option><option value="form">Form</option></select></div></div>);
            case 'pages': return (<div className="space-y-4"><div><label className={commonLabelClass}>Page Title</label><input type="text" name="title" value={formData.title || ''} onChange={handleFormChange} className={commonInputClass} required /></div><div><label className={commonLabelClass}>Content (Markdown)</label><textarea name="content" value={formData.content || ''} onChange={handleFormChange} className={`${commonInputClass} h-40`} rows={10}></textarea></div><div className="flex items-center"><input type="checkbox" id="isVisible" name="isVisible" checked={formData.isVisible === true} onChange={handleFormChange} className="h-4 w-4 rounded border-gray-300" /><label htmlFor="isVisible" className="ml-2 block text-sm">Visible</label></div></div>);
        }
    };
    
    const tabs = [{ id: 'settings', label: 'Settings' }, { id: 'pages', label: 'Pages' }, { id: 'streams', label: 'Streams' }, { id: 'papers', label: 'Papers' }, { id: 'contentItems', label: 'Content' }];
    return (
        <><div className="p-4 md:p-8 rounded-lg shadow-lg" style={themeStyles.card}>
            <div className="flex justify-between items-start mb-6"><h2 className="text-3xl font-bold">Admin Dashboard</h2><button onClick={handleLogout} className="text-sm hover:underline">Logout</button></div>
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8 overflow-x-auto">{tabs.map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={isActive ? themeStyles.accentText : {}} className={`${ isActive ? `border-indigo-500` : 'border-transparent text-gray-500 hover:border-gray-300' } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                            {tab.label}
                        </button>
                    );
                })}</nav>
            </div>
            <div className="mt-6">
                {activeTab === 'settings' && renderSettings()}
                {activeTab === 'pages' && renderCrudList<CustomPage>('Manage Pages', pages, 'pages')}
                {activeTab === 'streams' && renderCrudList<Stream>('Manage Streams', streams, 'streams')}
                {activeTab === 'papers' && renderCrudList<Paper>('Manage Papers', papers, 'papers')}
                {activeTab === 'contentItems' && renderCrudList<ContentItem>('Manage Content', contentItems, 'contentItems')}
            </div>
        </div>
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`${currentItem ? 'Edit' : 'Add'} ${modalType}`}>
            <form onSubmit={handleSave}>
                {renderModalContent()}
                <div className="mt-6 flex justify-end space-x-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium border rounded-md hover:bg-gray-50 dark:bg-gray-600 dark:hover:bg-gray-500">Cancel</button>
                    <button type="submit" style={themeStyles.button} className="px-4 py-2 rounded-md text-sm font-medium">Save</button>
                </div>
            </form>
        </Modal></>
    );
};
export default AdminPanel;