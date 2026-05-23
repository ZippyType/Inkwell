import React, { useRef, useCallback, useState, useEffect } from 'react';
import { useStudio } from '../context/StudioContext';
import { useDropzone } from 'react-dropzone';
import { History, Save, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { t } from '../lib/i18n';

export function Editor() {
  const { language, files, activeFileId, updateFileContent, showTutorial, tutorialStep, fileVersions, saveVersion, revertToVersion } = useStudio();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showHistory, setShowHistory] = useState(false);

  const activeFile = files.find(f => f.id === activeFileId);
  const partFile = activeFile?.parentId ? files.find(f => f.id === activeFile.parentId) : null;

  // Track content debounced to maybe auto-save, but manual is better for versions.
  // We'll rely on the manual "Save Version" button for simplicity and control.

  const activeVersions = fileVersions.filter(v => v.fileId === activeFileId).sort((a,b) => b.timestamp - a.timestamp);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    // Check for dropped files
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      droppedFiles.forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = () => {
            const url = reader.result as string;
            insertAtDropPoint(e, `![image](${url})`);
          };
          reader.readAsDataURL(file);
        }
      });
      return;
    }

    // Check for dragged text items (snippets or sidebar assets)
    const assetUrl = e.dataTransfer.getData('asset-url');
    const assetCaption = e.dataTransfer.getData('asset-caption');
    const textData = e.dataTransfer.getData('text/plain');

    if (assetUrl) {
      const altText = assetCaption || 'Image';
      insertAtDropPoint(e, `![${altText}](${assetUrl})`);
    } else if (textData) {
      insertAtDropPoint(e, textData);
    }
  }, [activeFileId, activeFile]);

  const insertAtDropPoint = (e: React.DragEvent, text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Focus immediately so we can work with selection if needed
    textarea.focus();

    // Most modern browsers support selectionStart/End being updated if we focus first
    // but for "drop" specifically, we might need to calculate based on coordinates
    // or just use the current selection if the user dragged it there.
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentContent = activeFile?.content || '';
    
    const newContent = 
      currentContent.substring(0, start) + 
      text + 
      currentContent.substring(start); // Treat as insert at selectionStart

    if (activeFileId) {
      updateFileContent(activeFileId, newContent);
      setTimeout(() => {
        textarea.setSelectionRange(start + text.length, start + text.length);
      }, 0);
    }
  };

  const [isPublishing, setIsPublishing] = React.useState(false);

  const handlePublish = () => {
    setIsPublishing(true);
    setTimeout(() => setIsPublishing(false), 2000);
  };

  if (!activeFile) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-500">
        <p>Select a file to start editing</p>
      </div>
    );
  }

  // Parts don't have content by default in this state model, 
  // but if we want them to, we can enable it.
  if (activeFile.type === 'part') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-500 p-8 text-center">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-900 dark:text-zinc-100 mb-2">{activeFile.name}</h2>
        <p>This is a book part. Chapters are nested inside it.</p>
        <p className="mt-4 text-sm opacity-70">Add a chapter to start writing.</p>
      </div>
    );
  }

  return (
    <div 
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      className="relative h-full flex flex-col"
    >
      <header className="h-12 border-b border-zinc-200 dark:border-[#27272a] flex items-center justify-between px-6 bg-white dark:bg-[#09090b]/80 backdrop-blur shrink-0">
        <div className="flex items-center gap-4 text-sm font-medium">
          {partFile && (
            <>
              <span className="text-zinc-500">{partFile.name}</span>
              <span className="text-zinc-700">/</span>
            </>
          )}
          <span className="text-zinc-900 dark:text-zinc-100">{activeFile.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => saveVersion(activeFile.id, activeFile.content || '')}
            className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors"
            title="Save Version"
          >
            <Save className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors"
            title="Version History"
          >
            <History className="w-4 h-4" />
          </button>
          <span className="text-[11px] text-emerald-500 font-mono">{t(language, 'savedToCloud')}</span>
          <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800"></div>
          <button 
            onClick={handlePublish}
            disabled={isPublishing}
            className={`px-3 py-1 text-xs font-semibold rounded text-white transition-all duration-300 ${isPublishing ? 'bg-emerald-600 scale-95' : 'bg-indigo-600 hover:bg-indigo-500'} ${showTutorial && tutorialStep === 5 ? 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-white dark:ring-offset-[#09090b] z-50 rounded shadow-2xl relative scale-[1.1]' : ''}`}
          >
            {isPublishing ? 'Published!' : t(language, 'publish')}
          </button>
        </div>
      </header>

      <section className="flex-1 overflow-hidden flex relative">
        <textarea
          ref={textareaRef}
          value={activeFile.content || ''}
          onChange={(e) => updateFileContent(activeFile.id, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Tab') {
              e.preventDefault();
              insertAtDropPoint(e as any, '  ');
            }
          }}
          className="flex-1 w-full max-w-3xl mx-auto p-8 bg-transparent outline-none resize-none font-mono text-[15px] leading-relaxed text-zinc-800 dark:text-zinc-200 opacity-90"
          placeholder={t(language, 'onceUponATime')}
          spellCheck="false"
        />

        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              className="absolute right-0 top-0 bottom-0 w-80 bg-white dark:bg-[#121214] border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col z-20"
            >
              <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <h3 className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">{t(language, 'versionHistory')}</h3>
                <button onClick={() => setShowHistory(false)} className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 text-lg">
                  &times;
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {activeVersions.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic text-center mt-4">{t(language, 'noVersions')}</p>
                ) : (
                  activeVersions.map((v, i) => (
                    <div key={v.id} className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                          {new Date(v.timestamp).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                        {i === 0 ? (
                          <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 px-1.5 py-0.5 rounded">{t(language, 'latest')}</span>
                        ) : (
                          <button
                            onClick={() => revertToVersion(activeFile.id, v.id)}
                            className="text-[10px] flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                          >
                            <RotateCcw className="w-3 h-3" />
                            {t(language, 'restore')}
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-500 line-clamp-3 font-mono">
                        {v.content.slice(0, 100)}...
                      </p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <footer className="h-10 border-t border-zinc-200 dark:border-[#27272a] flex items-center px-4 justify-between bg-zinc-50 dark:bg-[#121214] text-[11px] text-zinc-500 shrink-0">
        <div className="flex gap-4">
          <span>{t(language, 'words')}: {activeFile.content?.trim() ? activeFile.content.replace(/(?:^#+\s*)|(?:^\d+\.\s*)|(?:\*+.*?\*+)/gm, '').trim().split(/\s+/).filter(w => w.length > 0).length : 0}</span>
          <span>{t(language, 'characters')}: {activeFile.content?.length || 0}</span>
        </div>
        <div className="flex gap-4">
          <span>UTF-8</span>
          <span>Markdown Standard</span>
        </div>
      </footer>
    </div>
  );
}

