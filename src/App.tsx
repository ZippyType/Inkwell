import React, { useState, useEffect } from 'react';
import { StudioProvider } from './context/StudioContext';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { Preview } from './components/Preview';
import { ChatBot } from './components/ChatBot';
import { OOBE } from './components/OOBE';
import { SyntaxGuide } from './components/SyntaxGuide';
import { TrashZone } from './components/TrashZone';
import { Tutorial } from './components/Tutorial';
import { FontModeOverlay } from './components/FontModeOverlay';
import { TopBar } from './components/TopBar';
import { useStudio } from './context/StudioContext';
import { Info } from 'lucide-react';
import { LibraryScreen } from './components/LibraryScreen';
import { LanguageCode } from './lib/i18n';

function AppContent({ projectId }: { projectId: string }) {
  const { showTutorial, tutorialStep, fontModeActive, showGuide, setShowGuide, theme } = useStudio();

  // Ensure dark mode on document class
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Keep project modified date updated occasionally
  useEffect(() => {
    const i = setInterval(() => {
      const saved = localStorage.getItem('inkwell-projects');
      if (saved) {
        const projects = JSON.parse(saved);
        const p = projects.find((x: any) => x.id === projectId);
        if (p) {
          p.lastModified = Date.now();
          localStorage.setItem('inkwell-projects', JSON.stringify(projects));
        }
      }
    }, 30000);
    return () => clearInterval(i);
  }, [projectId]);

  return (
    <div className={`flex flex-col h-screen w-screen bg-white dark:bg-[#09090b] text-zinc-900 dark:text-[#e4e4e7] overflow-hidden font-sans relative ${theme}`}>
      <TopBar />
      <OOBE />
      <TrashZone />
      <Tutorial />
      <FontModeOverlay />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        <div className={`w-56 h-full shrink-0 border-r border-zinc-200 dark:border-[#27272a] bg-zinc-50 dark:bg-[#121214] flex flex-col transition-all duration-500 ${showTutorial && tutorialStep === 2 ? 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-white dark:ring-offset-[#09090b] z-50 rounded-lg shadow-2xl relative scale-[1.02]' : ''} ${fontModeActive ? 'z-0' : ''}`}>
          <Sidebar />
        </div>

        {/* Editor */}
        <div className={`flex-1 h-full flex flex-col bg-white dark:bg-[#09090b] transition-all duration-500 ${showTutorial && tutorialStep === 3 ? 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-white dark:ring-offset-[#09090b] z-50 rounded-lg shadow-2xl relative scale-[0.98]' : ''} ${fontModeActive ? 'z-0' : ''}`}>
          <Editor />
        </div>

        {/* Right Rail */}
        <div className="w-80 h-full flex flex-col relative border-l border-zinc-200 dark:border-[#27272a] bg-zinc-50 dark:bg-[#121214]">
          {/* Preview - 50% vertical */}
          <div className={`h-1/2 border-b border-zinc-200 dark:border-[#27272a] flex flex-col relative ${fontModeActive ? 'z-[100] bg-zinc-50 dark:bg-[#121214]' : ''}`}>
            <Preview />
          </div>
          
          {/* Bottom Area - 50% vertical */}
          <div className={`h-1/2 overflow-hidden flex flex-col bg-zinc-50 dark:bg-[#0f0f11] transition-all duration-500 ${showTutorial && tutorialStep === 4 ? 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-white dark:ring-offset-[#09090b] z-50 rounded-lg shadow-2xl relative scale-[1.02]' : ''}`}>
            {showGuide ? (
              <SyntaxGuide onClose={() => setShowGuide(false)} />
            ) : (
              <ChatBot />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [projectId, setProjectId] = useState<string | null>(() => {
    return new URLSearchParams(window.location.search).get('project');
  });
  const [projectLang, setProjectLang] = useState<LanguageCode>('en');

  useEffect(() => {
    if (projectId) {
      const saved = localStorage.getItem('inkwell-projects');
      if (saved) {
        const projects = JSON.parse(saved);
        const p = projects.find((x: any) => x.id === projectId);
        if (p) {
          setProjectLang(p.language || 'en');
        }
      }
    }
  }, [projectId]);

  const handleProjectSelect = (id: string, lang: LanguageCode) => {
    // We open in same tab to avoid iframe popup issues (as per standard constraints)
    // Actually user requested "opens the app in a new tab"
    // Wait, let's strictly do `window.open('?project=' + id, '_blank')` if they already are in library context?
    // User requested "opens the app in a new tab with the specified language"
    // So we can do window.open:
    window.open(`?project=${id}`, '_blank');
    // But since it's a sandbox/iframe, it might be blocked. Let's provide an inline alternative:
    // We just set it. If it works great, but we also set state just in case it doesn't navigate.
    setProjectLang(lang);
    setProjectId(id);
    window.history.pushState({}, '', `?project=${id}`);
  };

  if (!projectId) {
    return <LibraryScreen onSelectProject={handleProjectSelect} />;
  }

  return (
    <StudioProvider projectId={projectId} initialLanguage={projectLang}>
      <AppContent projectId={projectId} />
    </StudioProvider>
  );
}

