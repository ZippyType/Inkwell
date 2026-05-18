import React, { useRef, useCallback } from 'react';
import { useStudio } from '../context/StudioContext';
import { useDropzone } from 'react-dropzone';

export function Editor() {
  const { files, activeFileId, updateFileContent, showTutorial, tutorialStep } = useStudio();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeFile = files.find(f => f.id === activeFileId);
  const partFile = activeFile?.parentId ? files.find(f => f.id === activeFile.parentId) : null;

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
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">{activeFile.name}</h2>
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
      <header className="h-12 border-b border-[#27272a] flex items-center justify-between px-6 bg-[#09090b]/80 backdrop-blur shrink-0">
        <div className="flex items-center gap-4 text-sm font-medium">
          {partFile && (
            <>
              <span className="text-zinc-500">{partFile.name}</span>
              <span className="text-zinc-700">/</span>
            </>
          )}
          <span className="text-zinc-100">{activeFile.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-emerald-500 font-mono">SAVED TO CLOUD</span>
          <div className="h-4 w-px bg-zinc-800"></div>
          <button 
            onClick={handlePublish}
            disabled={isPublishing}
            className={`px-3 py-1 text-xs font-semibold rounded text-white transition-all duration-300 ${isPublishing ? 'bg-emerald-600 scale-95' : 'bg-indigo-600 hover:bg-indigo-500'} ${showTutorial && tutorialStep === 5 ? 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-[#09090b] z-50 rounded shadow-2xl relative scale-[1.1]' : ''}`}
          >
            {isPublishing ? 'Published!' : 'Publish'}
          </button>
        </div>
      </header>

      <section className="flex-1 overflow-hidden flex flex-col">
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
          className="flex-1 w-full max-w-3xl mx-auto p-8 bg-transparent outline-none resize-none font-mono text-[15px] leading-relaxed text-zinc-200 opacity-90"
          placeholder="Once upon a time..."
          spellCheck="false"
        />
      </section>

      <footer className="h-10 border-t border-[#27272a] flex items-center px-4 justify-between bg-[#121214] text-[11px] text-zinc-500 shrink-0">
        <div className="flex gap-4">
          <span>Words: {activeFile.content?.trim() ? activeFile.content.trim().split(/\s+/).length : 0}</span>
          <span>Characters: {activeFile.content?.length || 0}</span>
        </div>
        <div className="flex gap-4">
          <span>UTF-8</span>
          <span>Markdown Standard</span>
        </div>
      </footer>
    </div>
  );
}

