import React from 'react';
import { useStudio } from '../context/StudioContext';
import { Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function TrashZone() {
  const { draggedFileId, setDraggedFileId, deleteFile } = useStudio();

  if (!draggedFileId) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedFileId) {
      deleteFile(draggedFileId);
      setDraggedFileId(null);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 pointer-events-none"
      >
        <div className="absolute inset-x-0 inset-y-0 h-[80%] bg-black/60 pointer-events-none" />
        <div 
          className="absolute inset-x-0 bottom-0 h-[20%] bg-red-900/40 backdrop-blur-sm border-t border-red-500/50 flex flex-col items-center justify-center pointer-events-auto"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex flex-col items-center justify-center animate-pulse">
            <Trash2 className="w-8 h-8 text-red-500 mb-1" />
          </div>
          <span className="text-red-400 font-bold uppercase tracking-widest mt-4">Drop to Delete</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
