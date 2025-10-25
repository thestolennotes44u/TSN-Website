import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '../firebaseConfig';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, updatePassword, type User } from 'firebase/auth';
import type { SimpleUser } from '../types';

interface AuthContextType {
  user: SimpleUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SimpleUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
      setUser(firebaseUser ? { uid: firebaseUser.uid, email: firebaseUser.email } : null);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<void> => { await signInWithEmailAndPassword(auth, email, password); };
  const logout = async (): Promise<void> => { await signOut(auth); };
  const changePassword = async (newPassword: string): Promise<void> => {
    if (auth.currentUser) { await updatePassword(auth.currentUser, newPassword); } 
    else { throw new Error("No authenticated user."); }
  };
  
  const value = { user, isAuthenticated: !!user, loading, login, logout, changePassword };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) { throw new Error('useAuth must be used within an AuthProvider'); }
  return context;
};
