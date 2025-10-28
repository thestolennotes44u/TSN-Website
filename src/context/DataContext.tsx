import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import type { Stream, Paper, ContentItem, CustomPage, CollectionName, HomepageContent } from '../types';

const sortWithOrder = <T extends { order?: number }>(a: T, b: T) => (a.order ?? Infinity) - (b.order ?? Infinity);

const DEFAULT_HOMEPAGE_CONTENT: HomepageContent = {
    id: 'main',
    welcomeTitle: 'Welcome to The Stolen Notes',
    welcomeText: 'Your central hub for departmental exam preparation.',
    showExtraSection: false,
    extraSectionTitle: 'Additional Information',
    extraSectionContent: 'No additional information available.',
};

interface DataContextType {
  streams: Stream[];
  papers: Paper[];
  contentItems: ContentItem[];
  pages: CustomPage[];
  homepageContent: HomepageContent;
  loading: boolean;
  error: string | null;
  addOrUpdateDoc: (collectionName: CollectionName | 'config', data: any) => Promise<void>;
  deleteDocById: (collectionName: CollectionName, id: string) => Promise<void>;
  updateHomepageContent: (data: HomepageContent) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [pages, setPages] = useState<CustomPage[]>([]);
  const [homepageContent, setHomepageContent] = useState<HomepageContent>(DEFAULT_HOMEPAGE_CONTENT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const collections: CollectionName[] = ['streams', 'papers', 'contentItems', 'pages'];
    const setters: any = { streams: setStreams, papers: setPapers, contentItems: setContentItems, pages: setPages };

    const unsubscribes = collections.map(collectionName => 
      onSnapshot(collection(db, collectionName), 
        (snapshot) => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          data.sort(sortWithOrder as any);
          setters[collectionName](data);
        },
        (err) => { setError(`Failed to load ${collectionName}: ${err.message}`); }
      )
    );

    const homepageDocRef = doc(db, 'config', 'homepage');
    const unsubHomepage = onSnapshot(homepageDocRef, (docSnap) => {
        if (docSnap.exists()) {
            setHomepageContent({ ...DEFAULT_HOMEPAGE_CONTENT, ...docSnap.data() });
        } else {
            setDoc(homepageDocRef, DEFAULT_HOMEPAGE_CONTENT);
        }
    });

    setLoading(false);
    return () => {
        unsubscribes.forEach(unsub => unsub());
        unsubHomepage();
    };
  }, []);

  const addOrUpdateDoc = async (collectionName: CollectionName | 'config', data: any) => {
    const docRef = doc(db, collectionName, data.id);
    await setDoc(docRef, data, { merge: true });
  };

  const deleteDocById = async (collectionName: CollectionName, id: string) => {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  };
  
  const updateHomepageContent = async (data: HomepageContent) => {
    const docRef = doc(db, 'config', 'homepage');
    await setDoc(docRef, data, { merge: true });
  };

  const value = { streams, papers, contentItems, pages, homepageContent, loading, error, addOrUpdateDoc, deleteDocById, updateHomepageContent };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) { throw new Error('useData must be used within a DataProvider'); }
  return context;
};