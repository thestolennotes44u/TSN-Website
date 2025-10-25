import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import type { Stream, Paper, ContentItem, CustomPage, CollectionName } from '../types';
import { DEFAULT_STREAMS, DEFAULT_PAPERS, DEFAULT_CONTENT_ITEMS, DEFAULT_PAGES } from '../constants';

type DocumentType = Stream | Paper | ContentItem | CustomPage;

interface DataContextType {
  streams: Stream[];
  papers: Paper[];
  contentItems: ContentItem[];
  pages: CustomPage[];
  loading: boolean;
  error: string | null;
  addOrUpdateDoc: (collectionName: CollectionName, data: DocumentType) => Promise<void>;
  deleteDocById: (collectionName: CollectionName, id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const seedDatabase = async () => {
  const batch = writeBatch(db);

  DEFAULT_STREAMS.forEach(item => batch.set(doc(db, 'streams', item.id), item));
  DEFAULT_PAPERS.forEach(item => batch.set(doc(db, 'papers', item.id), item));
  DEFAULT_CONTENT_ITEMS.forEach(item => batch.set(doc(db, 'contentItems', item.id), item));
  DEFAULT_PAGES.forEach(item => batch.set(doc(db, 'pages', item.id), item));

  await batch.commit();
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [pages, setPages] = useState<CustomPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const streamsSnap = await getDocs(collection(db, 'streams'));
  
        if (streamsSnap.empty) {
          await seedDatabase();
          setStreams(DEFAULT_STREAMS);
          setPapers(DEFAULT_PAPERS);
          setContentItems(DEFAULT_CONTENT_ITEMS);
          setPages(DEFAULT_PAGES);
          setLoading(false);
          return;
        }
  
        setStreams(streamsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Stream)));
  
        const papersSnap = await getDocs(collection(db, 'papers'));
        setPapers(papersSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Paper)));
        
        const contentItemsSnap = await getDocs(collection(db, 'contentItems'));
        setContentItems(contentItemsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as ContentItem)));
  
        const pagesSnap = await getDocs(collection(db, 'pages'));
        setPages(pagesSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as CustomPage)));
        
      } catch (err) {
        let errorMessage = 'An unknown error occurred while fetching data.';
        if (err instanceof Error) {
          errorMessage = err.message;
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const addOrUpdateDoc = async (collectionName: CollectionName, data: DocumentType) => {
    const stateSetters: Record<CollectionName, React.Dispatch<React.SetStateAction<any[]>>> = {
      streams: setStreams,
      papers: setPapers,
      contentItems: setContentItems,
      pages: setPages,
    };
    const setter = stateSetters[collectionName];

    setter((prevItems: DocumentType[]) => {
        const itemIndex = prevItems.findIndex(item => item.id === data.id);
        if (itemIndex > -1) {
            const newItems = [...prevItems];
            newItems[itemIndex] = data;
            return newItems;
        } else {
            return [...prevItems, data];
        }
    });

    try {
        await setDoc(doc(db, collectionName, data.id), data);
    } catch (error) {
       console.error("Firestore update failed.", error);
    }
  };
  
  const deleteDocById = async (collectionName: CollectionName, id: string) => {
    const stateSetters: Record<CollectionName, React.Dispatch<React.SetStateAction<any[]>>> = {
        streams: setStreams,
        papers: setPapers,
        contentItems: setContentItems,
        pages: setPages,
      };
    const setter = stateSetters[collectionName];
    
    let oldState: any[] = [];
    setter((prev: DocumentType[]) => {
        oldState = prev;
        return prev.filter(item => item.id !== id)
    });

    try {
        await deleteDoc(doc(db, collectionName, id));
    } catch (error) {
        console.error("Firestore delete failed.", error);
        setter(oldState);
    }
  };

  const value = {
    streams, papers, contentItems, pages,
    loading, error,
    addOrUpdateDoc, deleteDocById
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};