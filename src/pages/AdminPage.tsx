import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminPanel from '../components/AdminPanel';

const AdminPage: React.FC = () => {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) { return <Navigate to="/" replace />; }
    return <div className="container mx-auto p-4 md:p-8"><AdminPanel /></div>;
};

export default AdminPage;
