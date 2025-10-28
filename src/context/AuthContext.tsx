import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updatePassword } from 'firebase/auth';
import type { User } from 'firebase/auth';
import type { SimpleUser } from '../types';

interface AuthContextType {
    user: SimpleUser | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (email: string, pass: string) => Promise<any>;
    logout: () => Promise<any>;
    changePassword: (newPass: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<SimpleUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                setUser({ uid: firebaseUser.uid, email: firebaseUser.email });
            } else {
                setUser(null);
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);
    
    const login = (email: string, pass: string) => {
        const auth = getAuth();
        return signInWithEmailAndPassword(auth, email, pass);
    };

    const logout = () => {
        const auth = getAuth();
        return signOut(auth);
    };

    const changePassword = (newPass: string) => {
        const auth = getAuth();
        if (auth.currentUser) {
            return updatePassword(auth.currentUser, newPass);
        }
        return Promise.reject(new Error("No user is currently signed in."));
    };

    const value = {
        user,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
        changePassword,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};