import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  FolderPlus, 
  FileText, 
  Settings, 
  User, 
  Sun, 
  Moon, 
  ChevronRight, 
  ChevronDown, 
  Trash2,
  Edit2,
  Search,
  Save,
  LogOut,
  LogIn
} from 'lucide-react';
import { useStudio } from '../context/StudioContext';
import { cn } from '../lib/utils';

export function Sidebar() {
  const { 
    files, 
    assets,
    snippets,
    activeFileId, 
    setActiveFileId, 
    theme, 
    setTheme, 
    addPart, 
    addChapter, 
    deleteFile, 
    renameFile,
    addAsset,
    updateFileContent,
    setDraggedFileId,
    user,
    authLoading,
    login,
    logout,
    saveToFirebase
  } = useStudio();
  
  const [expandedParts, setExpandedParts] = useState<Record<string, boolean>>({});
  const [snippetSearch, setSnippetSearch] = useState('');
  const [showSnippetSearch, setShowSnippetSearch] = useState(false);

  const togglePart = (id: string) => {
    setExpandedParts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const parts = files.filter(f => f.type === 'part').sort((a, b) => a.order - b.order);

  return (
    <>
      <div className="p-4 border-b border-[#27272a] flex items-center gap-2">
        <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center text-white font-bold text-xs">IW</div>
        <span className="font-semibold tracking-tight text-zinc-100">Inkwell</span>
      </div>
      {/* File Tree Area */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Manuscript</h2>
          {user && (
            <button 
              onClick={saveToFirebase}
              className="p-1 hover:bg-zinc-800 rounded transition-colors text-indigo-400"
              title="Save to Cloud"
            >
              <Save className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="space-y-1">
          {parts.map(part => (
            <div key={part.id} className="mb-4">
              <div 
                draggable
                onDragStart={(e) => {
                  setDraggedFileId(part.id);
                  e.dataTransfer.setData('text/plain', part.id); // Required for Firefox
                }}
                onDragEnd={() => setDraggedFileId(null)}
                className={cn(
                  "flex items-center gap-2 py-1 text-sm cursor-pointer group",
                  activeFileId === part.id ? "text-indigo-400 font-medium" : "text-zinc-300 hover:text-zinc-100"
                )}
                onClick={() => togglePart(part.id)}
              >
                <motion.div
                  animate={{ rotate: expandedParts[part.id] ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </motion.div>
                <span className="flex-1">{part.name}</span>
              </div>

              <AnimatePresence>
                {expandedParts[part.id] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="ml-1 pl-3 border-l border-zinc-800 space-y-0.5 overflow-hidden mt-1"
                  >
                    {files
                      .filter(f => f.parentId === part.id && f.type === 'chapter')
                      .sort((a, b) => a.order - b.order)
                      .map(chapter => (
                        <div
                          key={chapter.id}
                          draggable
                          onDragStart={(e) => {
                            setDraggedFileId(chapter.id);
                            e.dataTransfer.setData('text/plain', chapter.id);
                          }}
                          onDragEnd={() => setDraggedFileId(null)}
                          className={cn(
                            "flex items-center gap-2 pl-3 py-1 cursor-pointer group text-sm",
                            activeFileId === chapter.id 
                              ? "text-indigo-400 bg-indigo-500/10 border-r-2 border-indigo-500" 
                              : "text-zinc-500 hover:text-zinc-300"
                          )}
                          onClick={() => setActiveFileId(chapter.id)}
                        >
                          <span className="truncate flex-1">{chapter.name}</span>
                        </div>
                      ))}
                    <button
                      onClick={() => addChapter(part.id)}
                      className="flex items-center gap-2 pl-3 py-1 w-full text-left text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      Add Chapter
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          {/* Root Level Chapters */}
          {files
            .filter(f => !f.parentId && f.type === 'chapter')
            .map(chapter => (
              <div
                key={chapter.id}
                draggable
                onDragStart={(e) => {
                  setDraggedFileId(chapter.id);
                  e.dataTransfer.setData('text/plain', chapter.id);
                }}
                onDragEnd={() => setDraggedFileId(null)}
                className={cn(
                  "flex items-center gap-2 px-2 py-1 cursor-pointer group text-sm rounded",
                  activeFileId === chapter.id 
                    ? "text-indigo-400 bg-indigo-500/10 border-r-2 border-indigo-500" 
                    : "text-zinc-500 hover:text-zinc-300"
                )}
                onClick={() => setActiveFileId(chapter.id)}
              >
                <span className="flex-1 truncate pl-1">{chapter.name}</span>
              </div>
            ))}

          {/* Snippets Section */}
          <div className="mt-8 mb-4 px-2">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Snippet Library</h2>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setShowSnippetSearch(!showSnippetSearch)}
                  className="p-1 hover:bg-zinc-800 rounded transition-colors"
                >
                  <Search className="w-3.5 h-3.5 text-zinc-400" />
                </button>
              </div>
            </div>

            <AnimatePresence>
              {showSnippetSearch && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mb-2"
                >
                  <input 
                    type="text"
                    placeholder="Filter snippets..."
                    value={snippetSearch}
                    onChange={(e) => setSnippetSearch(e.target.value)}
                    className="w-full text-xs bg-zinc-800 border-none rounded px-2 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-200"
                    autoFocus
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1 mt-2">
              {snippets.length === 0 ? (
                <p className="text-[10px] text-zinc-500 italic pl-1">No snippets saved yet.</p>
              ) : (
                snippets
                  .filter(s => s.name.toLowerCase().includes(snippetSearch.toLowerCase()))
                  .map(snippet => (
                    <div 
                      key={snippet.id} 
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', snippet.content)}
                      className="flex items-center gap-2 px-2 py-1.5 rounded cursor-grab active:cursor-grabbing hover:bg-zinc-800 transition-colors group"
                    >
                      <span className="text-xs text-zinc-400 truncate flex-1">{snippet.name}</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (activeFileId) updateFileContent(activeFileId, (files.find(f => f.id === activeFileId)?.content || '') + "\n\n" + snippet.content);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-indigo-400 transition-opacity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 px-2">Assets</h2>
            <div className="grid grid-cols-2 gap-2 px-1">
              {assets.map(asset => (
                <div 
                  key={asset.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('asset-url', asset.url)}
                  className="aspect-square bg-zinc-800 rounded overflow-hidden border border-[#27272a] cursor-grab active:cursor-grabbing group relative"
                >
                  <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-[8px] text-white font-bold uppercase truncate px-1">{asset.name}</span>
                  </div>
                </div>
              ))}
              <label className="aspect-square rounded border border-dashed border-zinc-700 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-800 transition-colors">
                <Plus className="w-4 h-4 text-zinc-500" />
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => addAsset(reader.result as string, file.name);
                      reader.readAsDataURL(file);
                    }
                  }} 
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons & User Area */}
      <div className="h-[153px] p-3 border-t border-[#27272a] bg-[#1a1a1c] flex flex-col gap-2 shrink-0">
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => addChapter(null)}
            className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded transition-colors"
          >
            + New Chapter
          </button>
          <button
            onClick={addPart}
            className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded transition-colors"
          >
            + New Part
          </button>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-zinc-800/50 mt-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-900/50 border border-indigo-500/30 flex items-center justify-center text-indigo-200 overflow-hidden">
              {user?.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : <User className="w-4 h-4" />}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-zinc-200 truncate max-w-[80px]">{user ? user.displayName : 'Guest'}</span>
              <span className="text-[10px] text-zinc-500">{user ? 'PRO Plan' : 'Local'}</span>
            </div>
          </div>
          
          <div className="flex gap-1">
            <button className="p-1.5 hover:bg-zinc-700 rounded transition-colors text-zinc-400">
              <Settings className="w-4 h-4" />
            </button>
            {user ? (
              <button 
                onClick={logout}
                className="p-1.5 hover:bg-zinc-700 rounded transition-colors text-red-400"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <button 
                onClick={login}
                className="p-1.5 hover:bg-zinc-700 rounded transition-colors text-indigo-400"
                title="Login"
              >
                <LogIn className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
