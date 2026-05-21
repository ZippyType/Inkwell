import React from 'react';
import { motion } from 'framer-motion';
import { Info, X, Type, Hash, List, Image as ImageIcon, Palette } from 'lucide-react';

interface SyntaxGuideProps {
  onClose: () => void;
}

export function SyntaxGuide({ onClose }: SyntaxGuideProps) {
  const categories = [
    {
      title: "Inkwell Specialties",
      items: [
        { syntax: "[=]", desc: "Unchecked box (☐)" },
        { syntax: "[.]", desc: "In progress box (⊡)" },
        { syntax: "[/]", desc: "Checked box (☑︎)" },
        { syntax: "Heading *(color)*", desc: "Colored heading (e.g. # Chapter *(red)*)" }
      ],
      icon: <Palette className="w-5 h-5 text-purple-500" />
    },
    {
      title: "Standard Markdown",
      items: [
        { syntax: "# Heading 1", desc: "Large title" },
        { syntax: "## Heading 2", desc: "Subtitle" },
        { syntax: "**Bold**", desc: "Strong emphasis" },
        { syntax: "*Italic*", desc: "Emphasis" },
        { syntax: "> Blockquote", desc: "Quoted text" }
      ],
      icon: <Type className="w-5 h-5 text-blue-500" />
    },
    {
      title: "Lists & Images",
      items: [
        { syntax: "- Item", desc: "Unordered list" },
        { syntax: "1. Item", desc: "Ordered list" },
        { syntax: "![Alt](URL)", desc: "Image placeholder" },
        { syntax: "[Link](URL)", desc: "Hyperlink" }
      ],
      icon: <List className="w-5 h-5 text-green-500" />
    }
  ];

  return (
    <div className="flex flex-col h-full bg-transparent">
      <div className="flex items-center justify-between px-6 py-2 border-b border-zinc-300 dark:border-zinc-800 shrink-0">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-500" />
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Syntax Guide</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-zinc-200 dark:bg-zinc-800 rounded">
          <X className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {categories.map((cat, i) => (
          <div key={i} className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-300 dark:border-zinc-800/50">
              {cat.icon}
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-400">{cat.title}</h3>
            </div>
            
            <div className="space-y-3">
              {cat.items.map((item, j) => (
                <div key={j} className="flex flex-col gap-1">
                  <code className="text-xs font-mono bg-zinc-100 dark:bg-[#1a1a1c] border border-zinc-300 dark:border-zinc-800 px-1.5 py-0.5 rounded-md w-fit text-indigo-400">
                    {item.syntax}
                  </code>
                  <p className="text-[11px] text-zinc-500 ml-1">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 bg-zinc-50 dark:bg-[#121214] border-t border-zinc-300 dark:border-zinc-800 shrink-0">
        <p className="text-[10px] leading-relaxed text-zinc-500 font-medium italic">
          PRO TIP: You can drag snippets from the AI chat or assets from the sidebar directly into the editor to copy them instantly.
        </p>
      </div>
    </div>
  );
}
