import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStudio } from '../context/StudioContext';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

const STEPS = [
  {
    title: 'Welcome to Inkwell',
    content: 'The premier writing environment for your next masterpiece. Let us show you around!'
  },
  {
    title: 'Manuscript Sidebar',
    content: 'Manage your parts, chapters, character snipets, and assets here. Drag and drop items into the red Delete Zone at the bottom when you need to remove them.'
  },
  {
    title: 'Rich Editor',
    content: 'Write your content here using markdown. You can organize your thoughts and use our special formatting.'
  },
  {
    title: 'AI Assistant',
    content: 'Inkwell comes with a powerful AI to brainstorm, generate paragraphs, and critique your work. It runs right in this panel.'
  },
  {
    title: 'Publish',
    content: 'Once your book is ready, hit this button to compile and publish your work.'
  }
];

export function Tutorial() {
  const { showTutorial, setShowTutorial, tutorialStep, setTutorialStep } = useStudio();

  if (!showTutorial) return null;

  const currentStep = STEPS[tutorialStep - 1];

  const handleNext = () => {
    if (tutorialStep < STEPS.length) {
      setTutorialStep(tutorialStep + 1);
    } else {
      setShowTutorial(false);
    }
  };

  const handlePrev = () => {
    if (tutorialStep > 1) {
      setTutorialStep(tutorialStep - 1);
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed bottom-6 right-[400px] w-80 bg-zinc-100 dark:bg-zinc-900 border border-yellow-500/50 shadow-2xl shadow-yellow-500/10 rounded-lg overflow-hidden z-[100]"
      >
        <div className="bg-yellow-500/10 p-4 border-b border-yellow-500/20 flex justify-between items-center">
          <h3 className="font-bold text-yellow-500">{currentStep.title}</h3>
          <button onClick={() => setShowTutorial(false)} className="text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed min-h-[80px]">
          {currentStep.content}
        </div>
        <div className="p-3 bg-zinc-950 flex justify-between items-center border-t border-zinc-300 dark:border-zinc-800">
          <span className="text-xs text-zinc-500">{tutorialStep} of {STEPS.length}</span>
          <div className="flex gap-2">
            {tutorialStep > 1 && (
              <button 
                onClick={handlePrev}
                className="px-3 py-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors flex items-center"
              >
                <ChevronLeft className="w-3 h-3 mr-1" /> Back
              </button>
            )}
            <button 
              onClick={handleNext}
              className="px-4 py-1.5 text-xs font-semibold bg-yellow-500 hover:bg-yellow-400 text-yellow-950 rounded transition-colors flex items-center"
            >
              {tutorialStep === STEPS.length ? 'Finish' : 'Next'}
              {tutorialStep < STEPS.length && <ChevronRight className="w-3 h-3 ml-1" />}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
