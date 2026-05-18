import React from 'react';
import { useStudio } from '../context/StudioContext';
import { motion, AnimatePresence } from 'framer-motion';

const SYSTEM_FONTS = [
  { name: 'Default Sans', value: 'ui-sans-serif, system-ui, sans-serif' },
  { name: 'Default Serif', value: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' },
  { name: 'Default Mono', value: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' },
  { name: 'System UI', value: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' },
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Verdana', value: 'Verdana, sans-serif' },
  { name: 'Tahoma', value: 'Tahoma, sans-serif' },
  { name: 'Trebuchet MS', value: '"Trebuchet MS", sans-serif' },
  { name: 'Times New Roman', value: '"Times New Roman", serif' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Garamond', value: 'Garamond, serif' },
  { name: 'Courier New', value: '"Courier New", monospace' },
  { name: 'Brush Script MT', value: '"Brush Script MT", cursive' },
  { name: 'Comic Sans MS', value: '"Comic Sans MS", cursive' },
  { name: 'Impact', value: 'Impact, fantasy' }
];

export function FontSelector({ onClose }: { onClose: () => void }) {
  const { setFontModeActive, setSelectedFontForMode } = useStudio();

  const handleSelectFont = (fontValue: string) => {
    setSelectedFontForMode(fontValue);
    setFontModeActive(true);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -5 }}
        className="absolute top-8 left-0 w-64 bg-[#18181b] border border-[#27272a] rounded-lg shadow-2xl z-[200] max-h-[400px] flex flex-col overflow-hidden"
      >
        <div className="p-2 border-b border-[#27272a] text-[10px] font-bold text-zinc-500 uppercase tracking-widest backdrop-blur bg-[#18181b]/95 z-10 sticky top-0">
          Select Font to Apply
        </div>
        <div className="overflow-y-auto flex-1 p-1">
          {SYSTEM_FONTS.map(font => (
            <button
              key={font.name}
              onClick={() => handleSelectFont(font.value)}
              className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white rounded transition-colors"
              style={{ fontFamily: font.value }}
            >
              {font.name}
            </button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
