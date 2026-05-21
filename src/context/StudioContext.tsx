import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { FileSystemItem, GlossaryTerm, FileVersion } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { auth, db, storage, signInWithGoogle } from '../lib/firebase';
import { get, set, del } from 'idb-keyval';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import LZString from 'lz-string';
import { LanguageCode, translations, t } from '../lib/i18n';

interface StudioContextType {
  projectId: string;
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  user: User | null;
  authLoading: boolean;
  files: FileSystemItem[];
  assets: { id: string; url: string; name: string; caption?: string }[];
  customFonts: { id: string; name: string; url: string }[];
  snippets: { id: string; content: string; name: string }[];
  glossaryTerms: GlossaryTerm[];
  fileVersions: FileVersion[];
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
  showOobe: boolean;
  setShowOobe: (show: boolean) => void;
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
  addGlossaryTerm: (term: string, definition: string) => void;
  updateGlossaryTerm: (id: string, term: string, definition: string) => void;
  deleteGlossaryTerm: (id: string) => void;
  saveVersion: (fileId: string, content: string) => void;
  revertToVersion: (fileId: string, versionId: string) => void;
  deleteAll: () => void;
  saveToFirebase: () => Promise<void>;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  defaultFont: string;
  setDefaultFont: (f: string) => void;
}

const StudioContext = createContext<StudioContextType | undefined>(undefined);

const generateTOCInfo = (currentFiles: FileSystemItem[], lang: LanguageCode) => {
  const tocLabel = translations[lang]?.tableOfContents || "Table Of Contents";
  let toc = `# ${tocLabel}\n\n`;
  const partsList = currentFiles.filter(f => f.type === 'part').sort((a, b) => a.order - b.order);
  partsList.forEach(part => {
    toc += `## ${part.name}\n\n`;
    const chaptersList = currentFiles.filter(f => f.parentId === part.id && f.type === 'chapter' && f.name !== 'Table Of Contents' && f.name !== tocLabel).sort((a, b) => a.order - b.order);
    chaptersList.forEach(c => {
      toc += `- ${c.name}\n`;
    });
    toc += '\n';
  });
  const rootChaptersList = currentFiles.filter(f => !f.parentId && f.type === 'chapter' && f.name !== 'Table Of Contents' && f.name !== tocLabel).sort((a, b) => a.order - b.order);
  if (rootChaptersList.length > 0) {
    toc += `## Other Chapters\n\n`;
    rootChaptersList.forEach(c => {
      toc += `- ${c.name}\n`;
    });
  }
  return toc.trim();
};

export function StudioProvider({ children, projectId, initialLanguage }: { children: React.ReactNode, projectId: string, initialLanguage: LanguageCode }) {
  const [user, setUser] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [language, setLanguage] = useState<LanguageCode>(initialLanguage);
  
  const [files, setFiles] = useState<FileSystemItem[]>(() => {
    const saved = localStorage.getItem(`inkwell-files-${projectId}`);
    if (saved) {
      return JSON.parse(saved).map((f: any) => f.name === 'table_of_continents.md' ? { ...f, name: 'Table Of Contents' } : f);
    }
    const partLabel = translations[initialLanguage]?.part || "Part";
    const chapterLabel = translations[initialLanguage]?.chapter || "Chapter";
    return [
      { id: 'p1', parentId: null, name: `${partLabel} 1`, type: 'part', order: 1 },
      { id: 'c1', parentId: 'p1', name: `${chapterLabel} 1`, type: 'chapter', content: '# Welcome to your book\n\nWrite something amazing...', order: 1 }
    ];
  });
  
  const [assets, setAssets] = useState<{ id: string; url: string; name: string; caption?: string }[]>([]);
  
  const [customFonts, setCustomFonts] = useState<{ id: string; name: string; url: string }[]>([]);

  const [snippets, setSnippets] = useState<{ id: string; content: string; name: string }[]>(() => {
    const saved = localStorage.getItem(`inkwell-snippets-${projectId}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [glossaryTerms, setGlossaryTerms] = useState<GlossaryTerm[]>(() => {
    const saved = localStorage.getItem(`inkwell-glossary-${projectId}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [fileVersions, setFileVersions] = useState<FileVersion[]>(() => {
    const saved = localStorage.getItem(`inkwell-versions-${projectId}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [activeFileId, setActiveFileId] = useState<string | null>('c1');
  const [draggedFileId, setDraggedFileId] = useState<string | null>(null);
  const [fontModeActive, setFontModeActive] = useState(false);
  const [selectedFontForMode, setSelectedFontForMode] = useState<string | null>(null);
  const [selectedElementsForMode, setSelectedElementsForMode] = useState<string[]>([]);
  const [componentFonts, setComponentFonts] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem(`inkwell-component-fonts-${projectId}`);
    return saved ? JSON.parse(saved) : {};
  });
  const [defaultFont, setDefaultFont] = useState<string>(() => {
    return localStorage.getItem('inkwell-default-font') || 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  });
  const [showOobe, setShowOobe] = useState(() => {
    return localStorage.getItem('inkwell-oobe-seen') !== 'true';
  });
  const [showTutorial, setShowTutorial] = useState(() => {
    return localStorage.getItem('inkwell-tutorial-seen') !== 'true' && localStorage.getItem('inkwell-oobe-seen') === 'true';
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
      const savedAssets = localStorage.getItem(`inkwell-assets-${projectId}`);
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
      const savedFonts = localStorage.getItem(`inkwell-custom-fonts-${projectId}`);
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
  }, [projectId]);

  useEffect(() => {
    localStorage.setItem(`inkwell-files-${projectId}`, JSON.stringify(files));
    
    // Save only metadata for assets and fonts to localStorage
    const assetsMeta = assets.map(a => ({ 
      id: a.id, 
      name: a.name, 
      caption: a.caption, 
      url: a.url && a.url.startsWith('https://') ? a.url : 'local' 
    }));
    localStorage.setItem(`inkwell-assets-${projectId}`, JSON.stringify(assetsMeta));

    const fontsMeta = customFonts.map(f => ({ 
      id: f.id, 
      name: f.name, 
      url: f.url && f.url.startsWith('https://') ? f.url : 'local' 
    }));
    localStorage.setItem(`inkwell-custom-fonts-${projectId}`, JSON.stringify(fontsMeta));

    localStorage.setItem(`inkwell-snippets-${projectId}`, JSON.stringify(snippets));
    localStorage.setItem(`inkwell-glossary-${projectId}`, JSON.stringify(glossaryTerms));
    localStorage.setItem(`inkwell-versions-${projectId}`, JSON.stringify(fileVersions));
    localStorage.setItem(`inkwell-component-fonts-${projectId}`, JSON.stringify(componentFonts));
    localStorage.setItem(`inkwell-default-font-${projectId}`, defaultFont);
  }, [files, assets, customFonts, snippets, glossaryTerms, fileVersions, componentFonts, defaultFont, projectId]);

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

  const tocContentRef = useRef<string>('');

  useEffect(() => {
    const toc = generateTOCInfo(files, language);
    if (tocContentRef.current === toc) return;
    tocContentRef.current = toc;
    
    // Check if Table Of Contents exists
    const existing = files.find(f => f.name === 'Table Of Contents');
    if (!existing) {
      setFiles(prev => [...prev, {
        id: 'toc-file',
        parentId: null,
        name: 'Table Of Contents',
        type: 'chapter',
        content: toc,
        order: 0
      }]);
    } else if (existing.content !== toc) {
      setFiles(prev => prev.map(f => f.id === existing.id ? { ...f, content: toc } : f));
    }
  }, [files]);

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
    
    // Save to IDB as fallback for persistence
    await set(`asset-${id}`, dataUrl);
    url = localUrl;

    setAssets(prev => [...prev, { id, url, name: sanitizedName, caption }]);
    return url;
  };

  const addCustomFont = async (dataUrl: string, name: string) => {
    const id = uuidv4();
    const cleanName = name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9.\-_]/g, '_');
    let url = '';

    const blob = await (await fetch(dataUrl)).blob();
    const localUrl = URL.createObjectURL(blob);

    await set(`font-${id}`, dataUrl);
    url = localUrl;

    setCustomFonts(prev => [...prev, { id, name: cleanName, url }]);
    return url;
  };

  const addSnippet = (content: string, name: string) => {
    setSnippets([...snippets, { id: uuidv4(), content, name }]);
  };

  const addGlossaryTerm = (term: string, definition: string) => {
    setGlossaryTerms(prev => [...prev, { id: uuidv4(), term, definition, relatedFileIds: [] }]);
  };

  const updateGlossaryTerm = (id: string, term: string, definition: string) => {
    setGlossaryTerms(prev => prev.map(t => t.id === id ? { ...t, term, definition } : t));
  };

  const deleteGlossaryTerm = (id: string) => {
    setGlossaryTerms(prev => prev.filter(t => t.id !== id));
  };

  const saveVersion = (fileId: string, content: string) => {
    setFileVersions(prev => [...prev, { id: uuidv4(), fileId, content, timestamp: Date.now() }]);
  };

  const revertToVersion = (fileId: string, versionId: string) => {
    const version = fileVersions.find(v => v.id === versionId);
    if (version) {
      updateFileContent(fileId, version.content);
    }
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
      projectId,
      language,
      setLanguage,
      user,
      authLoading,
      files,
      assets,
      customFonts,
      snippets,
      glossaryTerms,
      fileVersions,
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
      showOobe,
      setShowOobe: (v: boolean) => {
        setShowOobe(v);
        if (!v) {
          localStorage.setItem('inkwell-oobe-seen', 'true');
          // Trigger tutorial after OOBE
          if (localStorage.getItem('inkwell-tutorial-seen') !== 'true') {
            setShowTutorial(true);
          }
        }
      },
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
      addGlossaryTerm,
      updateGlossaryTerm,
      deleteGlossaryTerm,
      saveVersion,
      revertToVersion,
      deleteAll,
      saveToFirebase,
      login,
      logout,
      defaultFont,
      setDefaultFont
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
