import React, { createContext, useContext, useState, useEffect } from 'react';
import { FileSystemItem } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { auth, db, storage, signInWithGoogle } from '../lib/firebase';
import { get, set, del } from 'idb-keyval';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import LZString from 'lz-string';

interface StudioContextType {
  user: User | null;
  authLoading: boolean;
  files: FileSystemItem[];
  assets: { id: string; url: string; name: string; caption?: string }[];
  customFonts: { id: string; name: string; url: string }[];
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
  addAsset: (url: string, name: string, caption?: string) => Promise<string>;
  addCustomFont: (dataUrl: string, name: string) => Promise<string>;
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
  
  const [assets, setAssets] = useState<{ id: string; url: string; name: string; caption?: string }[]>([]);
  
  const [customFonts, setCustomFonts] = useState<{ id: string; name: string; url: string }[]>([]);

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
    const loadLargeAssets = async () => {
      // Load Assets Metadata
      const savedAssets = localStorage.getItem('inkwell-assets');
      const assetsMeta = savedAssets ? JSON.parse(savedAssets) : [];
      
      const hydratedAssets = await Promise.all(assetsMeta.map(async (asset: any) => {
        if (asset.url.startsWith('https://')) return asset;
        // Try to load from IDB
        const data = await get(`asset-${asset.id}`);
        if (data) {
          const blob = await (await fetch(data)).blob();
          return { ...asset, url: URL.createObjectURL(blob) };
        }
        return asset;
      }));
      setAssets(hydratedAssets);

      // Load Fonts Metadata
      const savedFonts = localStorage.getItem('inkwell-custom-fonts');
      const fontsMeta = savedFonts ? JSON.parse(savedFonts) : [];
      
    const hydratedFonts = await Promise.all(fontsMeta.map(async (font: any) => {
        if (font.url.startsWith('https://')) return font;
        // Try to load from IDB
        try {
          const data = await get(`font-${font.id}`);
          if (data) {
            const blob = await (await fetch(data)).blob();
            return { ...font, url: URL.createObjectURL(blob) };
          }
        } catch (e) {
          console.error(`Failed to hydrate font ${font.name}:`, e);
        }
        return font;
      }));
      console.log("Hydrated custom fonts:", hydratedFonts.length);
      setCustomFonts(hydratedFonts);
    };

    loadLargeAssets();
  }, []);

  useEffect(() => {
    localStorage.setItem('inkwell-files', JSON.stringify(files));
    
    // Save only metadata for assets and fonts to localStorage
    const assetsMeta = assets.map(a => ({ 
      id: a.id, 
      name: a.name, 
      caption: a.caption, 
      url: a.url && a.url.startsWith('https://') ? a.url : 'local' 
    }));
    localStorage.setItem('inkwell-assets', JSON.stringify(assetsMeta));

    const fontsMeta = customFonts.map(f => ({ 
      id: f.id, 
      name: f.name, 
      url: f.url && f.url.startsWith('https://') ? f.url : 'local' 
    }));
    localStorage.setItem('inkwell-custom-fonts', JSON.stringify(fontsMeta));

    localStorage.setItem('inkwell-snippets', JSON.stringify(snippets));
    localStorage.setItem('inkwell-component-fonts', JSON.stringify(componentFonts));
  }, [files, assets, customFonts, snippets, componentFonts]);

  // Inject custom fonts into the document
  useEffect(() => {
    const styleId = 'custom-fonts-style';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    const css = customFonts.map(font => `
      @font-face {
        font-family: "${font.name}";
        src: url("${font.url}");
      }
    `).join('\n');

    styleEl.textContent = css;
  }, [customFonts]);

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
    const id = uuidv4();
    const sanitizedName = name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    let url = '';

    // Convert dataUrl to blob immediately to use as local preview
    const blob = await (await fetch(dataUrl)).blob();
    const localUrl = URL.createObjectURL(blob);
    
    if (user) {
      try {
        console.log("Uploading asset to Firebase Storage...");
        const fileRef = ref(storage, `assets/${user.uid}/${id}-${sanitizedName}`);
        
        const timeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Upload timeout')), 15000)
        );
        
        await Promise.race([
          uploadString(fileRef, dataUrl, 'data_url'),
          timeout
        ]);
        
        url = await getDownloadURL(fileRef);
        console.log("Firebase Storage upload success:", url);
      } catch (error) {
        console.error("Asset upload to Storage failed or timed out:", error);
        url = localUrl;
        await set(`asset-${id}`, dataUrl); // Save to IDB as fallback
      }
    } else {
      url = localUrl;
      await set(`asset-${id}`, dataUrl);
    }

    setAssets(prev => [...prev, { id, url, name: sanitizedName, caption }]);
    return url;
  };

  const addCustomFont = async (dataUrl: string, name: string) => {
    const id = uuidv4();
    const cleanName = name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9.\-_]/g, '_');
    let url = '';

    const blob = await (await fetch(dataUrl)).blob();
    const localUrl = URL.createObjectURL(blob);

    if (user) {
      try {
        console.log("Uploading font to Firebase Storage...");
        const fileRef = ref(storage, `fonts/${user.uid}/${id}-${cleanName}.ttf`);
        await uploadString(fileRef, dataUrl, 'data_url');
        url = await getDownloadURL(fileRef);
        console.log("Firebase font upload success:", url);
      } catch (error) {
        console.error("Font upload failed:", error);
        url = localUrl;
        await set(`font-${id}`, dataUrl);
      }
    } else {
      url = localUrl;
      await set(`font-${id}`, dataUrl);
    }

    setCustomFonts(prev => [...prev, { id, name: cleanName, url }]);
    return url;
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
      customFonts,
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
      addCustomFont,
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
