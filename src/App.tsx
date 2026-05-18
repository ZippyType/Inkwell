import React, { useState } from 'react';
import { StudioProvider } from './context/StudioContext';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { Preview } from './components/Preview';
import { ChatBot } from './components/ChatBot';
import { OOBE } from './components/OOBE';
import { SyntaxGuide } from './components/SyntaxGuide';
import { TrashZone } from './components/TrashZone';
import { Tutorial } from './components/Tutorial';
import { useStudio } from './context/StudioContext';
import { Info } from 'lucide-react';

function AppContent() {
  const { showTutorial, tutorialStep } = useStudio();
  const [showGuide, setShowGuide] = useState(false);

  return (
    <div className="flex h-screen w-screen bg-[#09090b] text-[#e4e4e7] overflow-hidden font-sans relative">
      <OOBE />
      <TrashZone />
      <Tutorial />
      
      {/* Sidebar */}
      <div className={`w-56 h-full shrink-0 border-r border-[#27272a] bg-[#121214] flex flex-col transition-all duration-500 ${showTutorial && tutorialStep === 2 ? 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-[#09090b] z-50 rounded-lg shadow-2xl relative scale-[1.02]' : ''}`}>
        <Sidebar />
      </div>

      {/* Editor */}
      <div className={`flex-1 h-full flex flex-col bg-[#09090b] transition-all duration-500 ${showTutorial && tutorialStep === 3 ? 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-[#09090b] z-50 rounded-lg shadow-2xl relative scale-[0.98]' : ''}`}>
        <Editor />
      </div>

      {/* Right Rail */}
      <div className="w-80 h-full flex flex-col relative border-l border-[#27272a] bg-[#121214]">
        {/* Toggle Syntax Guide Button */}
        <button 
          onClick={() => setShowGuide(!showGuide)}
          className="absolute top-2 right-2 z-10 p-1.5 bg-[#09090b]/80 backdrop-blur rounded-md border border-[#27272a] hover:bg-zinc-800 transition-colors shadow-sm"
        >
          <Info className="w-4 h-4 text-zinc-500" />
        </button>

        {/* Preview - 50% vertical */}
        <div className="h-1/2 border-b border-[#27272a] flex flex-col">
          <Preview />
        </div>
        
        {/* Bottom Area - 50% vertical */}
        <div className={`h-1/2 overflow-hidden flex flex-col bg-[#0f0f11] transition-all duration-500 ${showTutorial && tutorialStep === 4 ? 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-[#09090b] z-50 rounded-lg shadow-2xl relative scale-[1.02]' : ''}`}>
          {showGuide ? (
            <SyntaxGuide onClose={() => setShowGuide(false)} />
          ) : (
            <ChatBot />
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <StudioProvider>
      <AppContent />
    </StudioProvider>
  );
}

