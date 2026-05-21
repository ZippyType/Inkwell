import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import { Book, Plus, Settings, Globe } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { t, LanguageCode } from '../lib/i18n';

export function LibraryScreen({ onSelectProject }: { onSelectProject: (id: string, language: LanguageCode) => void }) {
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('inkwell-projects');
    return saved ? JSON.parse(saved) : [];
  });
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newLang, setNewLang] = useState<LanguageCode>('en');

  const createProject = () => {
    if (!newTitle.trim()) return;
    const p: Project = {
      id: uuidv4(),
      name: newTitle.trim(),
      language: newLang,
      lastModified: Date.now()
    };
    const updated = [...projects, p];
    setProjects(updated);
    localStorage.setItem('inkwell-projects', JSON.stringify(updated));
    setShowNew(false);
    onSelectProject(p.id, p.language);
  };

  const deleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(confirm("Are you sure you want to delete this book?")) {
      const updated = projects.filter(p => p.id !== id);
      setProjects(updated);
      localStorage.setItem('inkwell-projects', JSON.stringify(updated));
      // Cleanup associated data
      localStorage.removeItem(`inkwell-files-${id}`);
      localStorage.removeItem(`inkwell-snippets-${id}`);
      localStorage.removeItem(`inkwell-glossary-${id}`);
      localStorage.removeItem(`inkwell-versions-${id}`);
    }
  };

  return (
    <div className="w-screen h-screen bg-white dark:bg-[#09090b] text-zinc-900 dark:text-[#e4e4e7] flex items-center justify-center p-8">
      <div className="w-full max-w-4xl flex flex-col h-full">
        <header className="flex items-center justify-between py-6 mb-8 border-b border-zinc-200 dark:border-[#27272a]">
          <div className="flex items-center gap-3">
            <Book className="w-8 h-8 text-indigo-500" />
            <h1 className="text-2xl font-bold font-serif">Inkwell Library</h1>
          </div>
          <button 
            onClick={() => setShowNew(true)}
            className="bg-indigo-600 hover:bg-indigo-500 transition-colors text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Book
          </button>
        </header>

        {showNew && (
          <div className="mb-8 p-6 bg-zinc-50 dark:bg-[#121214] border border-zinc-200 dark:border-[#27272a] rounded-xl flex items-end gap-4 shadow-xl">
            <div className="flex-1 space-y-2">
              <label className="text-xs font-semibold text-zinc-500 uppercase">Book Title</label>
              <input 
                type="text" 
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                autoFocus
                className="w-full bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded-lg px-4 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                placeholder="The Great Novel"
              />
            </div>
            <div className="w-48 space-y-2">
              <label className="text-xs font-semibold text-zinc-500 uppercase">Language</label>
              <select 
                value={newLang}
                onChange={e => setNewLang(e.target.value as LanguageCode)}
                className="w-full bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded-lg px-4 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 appearance-none"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="nl">Nederlands</option>
                <option value="ko">한국어</option>
                <option value="ja">日本語</option>
              </select>
            </div>
            <button 
              onClick={createProject}
              className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold px-6 py-2 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200"
            >
              Create
            </button>
            <button 
              onClick={() => setShowNew(false)}
              className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 font-medium px-4 py-2"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {projects.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <Book className="w-16 h-16 text-zinc-300 dark:text-zinc-800" />
              <h2 className="text-xl font-semibold text-zinc-400 dark:text-zinc-500">Your library is empty</h2>
              <p className="text-zinc-500 dark:text-zinc-600 max-w-sm">Create your first book to start writing, planning, and organizing your masterpiece.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.sort((a,b) => b.lastModified - a.lastModified).map(project => (
                <div 
                  key={project.id}
                  onClick={() => onSelectProject(project.id, project.language)}
                  className="bg-zinc-50 dark:bg-[#121214] border border-zinc-200 dark:border-[#27272a] rounded-xl p-6 cursor-pointer hover:border-indigo-500 transition-colors group relative flex flex-col h-48"
                >
                  <div className="flex justify-between items-start mb-4">
                    <Book className="w-8 h-8 text-zinc-400 dark:text-zinc-600 group-hover:text-indigo-400 transition-colors" />
                    <button 
                      onClick={(e) => deleteProject(project.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-zinc-400 hover:text-red-400 transition-all rounded hover:bg-zinc-200 dark:hover:bg-zinc-800"
                    >
                      Delete
                    </button>
                  </div>
                  <h3 className="text-lg font-bold font-serif mb-1 line-clamp-2 text-zinc-900 dark:text-zinc-100">{project.name}</h3>
                  <div className="mt-auto flex items-center justify-between text-xs text-zinc-500">
                    <div className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" />
                      <span className="uppercase font-semibold">{project.language}</span>
                    </div>
                    <span>{new Date(project.lastModified).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
