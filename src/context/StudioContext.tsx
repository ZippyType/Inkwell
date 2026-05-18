import React, { createContext, useContext, useState, useEffect } from 'react';
import { FileSystemItem } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { auth, db, storage, signInWithGoogle } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import LZString from 'lz-string';

interface StudioContextType {
  user: User | null;
  authLoading: boolean;
  files: FileSystemItem[];
  assets: { id: string; url: string; name: string; caption?: string }[];
  snippets: { id: string; content: string; name: string }[];
  activeFileId: string | null;
  setActiveFileId: (id: string | null) => void;
  draggedFileId: string | null;
  setDraggedFileId: (id: string | null) => void;
  fontModeActive: boolean;
  setFontModeActive: (active: boolean) => void;
  selectedFontForMode: string | null;
  setSelectedFontForMode: (font: string | null) => void;
  selectedElementsForMode: string[];
  setSelectedElementsForMode: (elements: string[]) => void;
  componentFonts: Record<string, string>;
  setComponentFonts: (fonts: Record<string, string>) => void;
  showTutorial: boolean;
  setShowTutorial: (show: boolean) => void;
  tutorialStep: number;
  setTutorialStep: (step: number) => void;
  showGuide: boolean;
  setShowGuide: (show: boolean) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  addPart: () => void;
  addChapter: (parentId: string | null, initialContent?: string, initialName?: string) => void;
  updateFileContent: (id: string, content: string) => void;
  deleteFile: (id: string) => void;
  renameFile: (id: string, name: string) => void;
  addAsset: (url: string, name: string, caption?: string) => Promise<void>;
  addSnippet: (content: string, name: string) => void;
  deleteAll: () => void;
  saveToFirebase: () => Promise<void>;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const StudioContext = createContext<StudioContextType | undefined>(undefined);

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [files, setFiles] = useState<FileSystemItem[]>(() => {
    const saved = localStorage.getItem('inkwell-files');
    return saved ? JSON.parse(saved) : [
      { id: 'p1', parentId: null, name: 'Part 1', type: 'part', order: 1 },
      { id: 'c1', parentId: 'p1', name: 'Chapter 1', type: 'chapter', content: '# Welcome to your book\n\nWrite something amazing...', order: 1 }
    ];
  });
  
  const [assets, setAssets] = useState<{ id: string; url: string; name: string; caption?: string }[]>(() => {
    const saved = localStorage.getItem('inkwell-assets');
    return saved ? JSON.parse(saved) : [];
  });

  const [snippets, setSnippets] = useState<{ id: string; content: string; name: string }[]>(() => {
    const saved = localStorage.getItem('inkwell-snippets');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeFileId, setActiveFileId] = useState<string | null>('c1');
  const [draggedFileId, setDraggedFileId] = useState<string | null>(null);
  const [fontModeActive, setFontModeActive] = useState(false);
  const [selectedFontForMode, setSelectedFontForMode] = useState<string | null>(null);
  const [selectedElementsForMode, setSelectedElementsForMode] = useState<string[]>([]);
  const [componentFonts, setComponentFonts] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('inkwell-component-fonts');
    return saved ? JSON.parse(saved) : {};
  });
  const [showTutorial, setShowTutorial] = useState(() => {
    return localStorage.getItem('inkwell-tutorial-seen') !== 'true';
  });
  const [tutorialStep, setTutorialStep] = useState(1);
  const [showGuide, setShowGuide] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('inkwell-theme') as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    localStorage.setItem('inkwell-files', JSON.stringify(files));
    localStorage.setItem('inkwell-assets', JSON.stringify(assets));
    localStorage.setItem('inkwell-snippets', JSON.stringify(snippets));
    localStorage.setItem('inkwell-component-fonts', JSON.stringify(componentFonts));
  }, [files, assets, snippets, componentFonts]);

  useEffect(() => {
    const handleGlobalDragEnd = () => {
      setDraggedFileId(null);
    };
    window.addEventListener('dragend', handleGlobalDragEnd);
    window.addEventListener('mouseup', handleGlobalDragEnd);
    return () => {
      window.removeEventListener('dragend', handleGlobalDragEnd);
      window.removeEventListener('mouseup', handleGlobalDragEnd);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('inkwell-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const addPart = () => {
    const partsCount = files.filter(f => f.type === 'part').length;
    const newPart: FileSystemItem = {
      id: uuidv4(),
      parentId: null,
      name: `Part ${partsCount + 1}`,
      type: 'part',
      order: partsCount + 1
    };
    setFiles([...files, newPart]);
  };

  const addChapter = (parentId: string | null, initialContent: string = '', initialName?: string) => {
    const nextNum = files.filter(f => f.type === 'chapter').length + 1;
    const newChapter: FileSystemItem = {
      id: uuidv4(),
      parentId,
      name: initialName || `Chapter ${nextNum}`,
      type: 'chapter',
      content: initialContent,
      order: nextNum
    };
    setFiles([...files, newChapter]);
    setActiveFileId(newChapter.id);
  };

  const updateFileContent = (id: string, content: string) => {
    setFiles(files.map(f => f.id === id ? { ...f, content } : f));
  };

  const deleteFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id && f.parentId !== id));
    if (activeFileId === id) setActiveFileId(null);
  };

  const renameFile = (id: string, name: string) => {
    setFiles(files.map(f => f.id === id ? { ...f, name } : f));
  };
    
  const addAsset = async (dataUrl: string, name: string, caption?: string) => {
    let url = dataUrl;
    const id = uuidv4();

    if (user) {
      try {
        // Upload to Firebase Storage
        const fileRef = ref(storage, `assets/${user.uid}/${id}-${name}`);
        await uploadString(fileRef, dataUrl, 'data_url');
        url = await getDownloadURL(fileRef);
      } catch (error) {
        console.error("Asset upload to Storage failed, falling back to local dataUrl:", error);
      }
    }

    setAssets([...assets, { id, url, name, caption }]);
  };

  const addSnippet = (content: string, name: string) => {
    setSnippets([...snippets, { id: uuidv4(), content, name }]);
  };

  const deleteAll = () => {
    const partId = uuidv4();
    const chapterId = uuidv4();
    setFiles([
      { id: partId, parentId: null, name: 'Part 1', type: 'part', order: 1 },
      { id: chapterId, parentId: partId, name: 'Chapter 1', type: 'chapter', content: '# Welcome to your book\n\nWrite something amazing...', order: 1 }
    ]);
    setAssets([]);
    setSnippets([]);
    setComponentFonts({});
    setActiveFileId(chapterId);
  };

  const saveToFirebase = async () => {
    if (!user) return;
    
    try {
      const exportData = {
        files,
        assets,
        snippets,
        version: '1.0',
        timestamp: new Date().toISOString()
      };
      
      const jsonString = JSON.stringify(exportData);
      const compressed = LZString.compressToBase64(jsonString);
      
      // Prompt says: copy everything to FireBase storage, into this directory: “infomation/{UUID}/SaveFile/“
      const fileRef = ref(storage, `infomation/${user.uid}/SaveFile/backup.lz`);
      await uploadString(fileRef, compressed, 'base64');
      
      // Also save metadata to Firestore
      await setDoc(doc(db, `users/${user.uid}/settings/info`), {
        lastSave: new Date().toISOString(),
        fileCount: files.length,
        assetCount: assets.length
      }, { merge: true });
      
      alert("Project saved securely to Firebase Cloud Storage.");
    } catch (error) {
      console.error("Save failed:", error);
      alert("Save failed. Check console for details.");
    }
  };

  const login = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const logout = () => auth.signOut();

  return (
    <StudioContext.Provider value={{
      user,
      authLoading,
      files,
      assets,
      snippets,
      activeFileId,
      setActiveFileId,
      draggedFileId,
      setDraggedFileId,
      fontModeActive,
      setFontModeActive,
      selectedFontForMode,
      setSelectedFontForMode,
      selectedElementsForMode,
      setSelectedElementsForMode,
      componentFonts,
      setComponentFonts,
      showTutorial,
      setShowTutorial: (v: boolean) => {
        setShowTutorial(v);
        if (!v) localStorage.setItem('inkwell-tutorial-seen', 'true');
      },
      tutorialStep,
      setTutorialStep,
      showGuide,
      setShowGuide,
      theme,
      setTheme,
      addPart,
      addChapter,
      updateFileContent,
      deleteFile,
      renameFile,
      addAsset,
      addSnippet,
      deleteAll,
      saveToFirebase,
      login,
      logout
    }}>
      {children}
    </StudioContext.Provider>
  );
}

export function useStudio() {
  const context = useContext(StudioContext);
  if (context === undefined) {
    throw new Error('useStudio must be used within a StudioProvider');
  }
  return context;
}
