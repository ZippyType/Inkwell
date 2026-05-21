import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Helper at top
import { 
  Sparkles, 
  ChevronRight, 
  FolderPlus, 
  Search, 
  Image as ImageIcon,
  CheckCircle2,
  Type
} from 'lucide-react';
import { useStudio } from '../context/StudioContext';

export function OOBE() {
  const [step, setStep] = useState(0);
  const { showOobe, setShowOobe, defaultFont, setDefaultFont } = useStudio();

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
    },
    {
      title: "Choose Document Font",
      description: "Select a default typography for your document. You can change this later in the Font menu.",
      icon: <Type className="w-12 h-12 text-pink-500" />,
      options: [
        { name: 'Default Sans', value: 'ui-sans-serif, system-ui, sans-serif' },
        { name: 'Default Serif', value: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' },
        { name: 'Default Mono', value: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' },
      ]
    }
  ];

  const handleFinish = () => {
    setShowOobe(false);
  };

  if (!showOobe) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-zinc-950/80 backdrop-blur-md p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-100 dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-zinc-300 dark:border-zinc-800"
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
              className="space-y-4 w-full"
            >
              <h2 className="text-3xl font-bold tracking-tight text-white">{steps[step].title}</h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
                {steps[step].description}
              </p>
              
              {steps[step].options && (
                <div className="flex flex-col gap-3 mt-4 w-full text-left">
                  {steps[step].options.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setDefaultFont(opt.value)}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all text-left",
                        defaultFont === opt.value 
                          ? "border-blue-500 bg-blue-500/10 text-white" 
                          : "border-zinc-300 dark:border-zinc-800 hover:border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
                      )}
                      style={{ fontFamily: opt.value }}
                    >
                      {opt.name}
                    </button>
                  ))}
                </div>
              )}
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
                className="w-full py-4 bg-white text-zinc-900 rounded-2xl font-bold flex items-center justify-center gap-2 group hover:bg-zinc-100 transition-all"
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
