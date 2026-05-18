import React from 'react';
import { useStudio } from '../context/StudioContext';
import { Check, Columns } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STYLED_TAGS = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'ul', 'ol', 'li', 'strong', 'em', 'span'];

export function FontModeOverlay() {
  const { 
    fontModeActive, 
    setFontModeActive, 
    selectedFontForMode, 
    setSelectedFontForMode,
    selectedElementsForMode,
    setSelectedElementsForMode,
    componentFonts,
    setComponentFonts
  } = useStudio();

  if (!fontModeActive) return null;

  const handleSelectAll = () => {
    if (selectedElementsForMode.length === STYLED_TAGS.length) {
      setSelectedElementsForMode([]);
    } else {
      setSelectedElementsForMode(STYLED_TAGS);
    }
  };

  const handleApply = () => {
    if (!selectedFontForMode) return;
    
    // Merge new font mappings
    const newMappings = { ...componentFonts };
    selectedElementsForMode.forEach(tag => {
      newMappings[tag] = selectedFontForMode;
    });
    
    setComponentFonts(newMappings);
    
    // Exit mode
    setFontModeActive(false);
    setSelectedFontForMode(null);
    setSelectedElementsForMode([]);
  };

  const handleCancel = () => {
    setFontModeActive(false);
    setSelectedFontForMode(null);
    setSelectedElementsForMode([]);
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] pointer-events-none"
      >
        <div className="absolute inset-x-0 inset-y-0 h-[70%] bg-black/80 pointer-events-auto" onClick={handleCancel} />
        
        <div className="absolute inset-x-0 bottom-0 h-[30%] bg-zinc-950/95 border-t border-zinc-800 backdrop-blur-xl pointer-events-auto flex flex-col items-center justify-center p-8 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          <div className="text-center mb-6 max-w-lg">
            <h2 className="text-xl font-bold text-white mb-2">Apply Font</h2>
            <p className="text-sm text-zinc-400">
              Select components in the Live Preview area to change their font to <span className="text-blue-400" style={{ fontFamily: selectedFontForMode || 'inherit' }}>the selected font</span>. You can select multiple blocks.
            </p>
          </div>
          
          <div className="flex gap-4 items-center">
            <button 
              onClick={handleSelectAll}
              className="px-6 py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-semibold flex items-center gap-2 transition-all hover:scale-105"
            >
              <Columns className="w-5 h-5" />
              {selectedElementsForMode.length === STYLED_TAGS.length ? 'Deselect All' : 'Select All'}
            </button>
            
            {selectedElementsForMode.length > 0 && (
              <motion.button 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={handleApply}
                className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all hover:scale-105"
              >
                <Check className="w-5 h-5" />
                Apply
              </motion.button>
            )}
            
            <button 
              onClick={handleCancel}
              className="px-6 py-4 bg-transparent hover:bg-zinc-900 border-2 border-zinc-700 text-zinc-300 rounded-xl font-semibold transition-all hover:scale-105"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
