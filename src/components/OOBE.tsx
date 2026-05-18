import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  ChevronRight, 
  FileText, 
  FolderPlus, 
  Search, 
  Image as ImageIcon,
  CheckCircle2
} from 'lucide-react';

export function OOBE() {
  const [step, setStep] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem('inkwell-oobe-seen');
    if (!hasSeen) {
      setShow(true);
    }
  }, []);

  const steps = [
    {
      title: "Welcome to Inkwell Studio",
      description: "A professional writing studio for building books in Markdown. We've optimized everything for your creative flow.",
      icon: <Sparkles className="w-12 h-12 text-purple-500" />
    },
    {
      title: "Organize with Layers",
      description: "Use the sidebar to create Parts and Chapters. Chapters nested in Parts keep your manuscript structured and scannable.",
      icon: <FolderPlus className="w-12 h-12 text-blue-500" />
    },
    {
      title: "AI Power at Your Fingertips",
      description: "Our integrated AI can help you research via web search, provide reasoning (thinking), and generate high-quality images for your book.",
      icon: <Search className="w-12 h-12 text-green-500" />
    },
    {
      title: "Visual Asset Pipeline",
      description: "Drag images from your local machine or generate them with AI. Drag assets from the sidebar to the preview to transform and insert them.",
      icon: <ImageIcon className="w-12 h-12 text-orange-500" />
    }
  ];

  const handleFinish = () => {
    localStorage.setItem('inkwell-oobe-seen', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/40 backdrop-blur-md p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-zinc-200 dark:border-zinc-800"
      >
        <div className="p-12 flex flex-col items-center text-center">
          <motion.div
            key={step}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-8"
          >
            {steps[step].icon}
          </motion.div>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="space-y-4"
            >
              <h2 className="text-3xl font-bold tracking-tight">{steps[step].title}</h2>
              <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {steps[step].description}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="mt-12 flex items-center gap-2">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === step ? "w-8 bg-blue-600" : "w-1.5 bg-zinc-200 dark:bg-zinc-800"
                )} 
              />
            ))}
          </div>

          <div className="mt-8 w-full">
            {step < steps.length - 1 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold flex items-center justify-center gap-2 group hover:bg-black dark:hover:bg-zinc-100 transition-all"
              >
                Continue
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all"
              >
                Get Started
                <CheckCircle2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Simple helper to avoid prop spreading if needed or just use import
function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
