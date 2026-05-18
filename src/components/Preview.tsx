import React, { useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useStudio } from '../context/StudioContext';
import { useMarkdownProcessor } from '../lib/markdown';
import { ImageEditorModal } from './ImageEditorModal';
import { Type } from 'lucide-react';
import { FontSelector } from './FontSelector';
import { motion } from 'framer-motion';

const STYLED_TAGS = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'ul', 'ol', 'li', 'strong', 'em', 'span'] as const;

export function Preview() {
  const { files, activeFileId, updateFileContent, fontModeActive, selectedFontForMode, selectedElementsForMode, setSelectedElementsForMode, componentFonts } = useStudio();
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [showFontMenu, setShowFontMenu] = useState(false);

  const activeFile = files.find(f => f.id === activeFileId);
  const processedContent = useMarkdownProcessor(activeFile?.content || '');

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const assetUrl = e.dataTransfer.getData('asset-url');
    if (assetUrl) {
      setEditingImage(assetUrl);
    }
  };

  const handleImageConfirm = ({ rotation, zoom }: { rotation: number; zoom: number }) => {
    if (activeFileId && editingImage) {
      const activeFile = files.find(f => f.id === activeFileId);
      const imgMd = `\n\n![Image](${editingImage})\n*Transformed: rot:${rotation}, zoom:${zoom}*`;
      updateFileContent(activeFileId, (activeFile?.content || '') + imgMd);
      setEditingImage(null);
    }
  };

  const toggleElement = (tag: string) => {
    if (selectedElementsForMode.includes(tag)) {
      setSelectedElementsForMode(selectedElementsForMode.filter(t => t !== tag));
    } else {
      setSelectedElementsForMode([...selectedElementsForMode, tag]);
    }
  };

  const markdownComponents: any = {
    img: (props: any) => (
      <div className="my-6 relative group flex flex-col items-center">
        <img 
          {...props} 
          className="rounded-xl shadow-2xl max-w-full relative z-[150] bg-zinc-800" 
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        {props.alt && props.alt !== 'Image' && (
          <span className="mt-3 text-[10px] text-zinc-500 font-medium italic border-t border-zinc-800 pt-1 px-4">{props.alt}</span>
        )}
      </div>
    )
  };

  STYLED_TAGS.forEach(tag => {
    markdownComponents[tag] = ({node, ...props}: any) => {
      const isSelected = selectedElementsForMode.includes(tag);
      const customFont = componentFonts[tag];
      
      const inlineStyle: React.CSSProperties = { ...props.style };
      
      if (fontModeActive) {
        if (isSelected && selectedFontForMode) {
          inlineStyle.fontFamily = selectedFontForMode;
          inlineStyle.outline = '2px solid #3b82f6';
          inlineStyle.outlineOffset = '2px';
          inlineStyle.borderRadius = '2px';
        } else {
          inlineStyle.outline = '1px dashed #52525b';
          inlineStyle.outlineOffset = '2px';
        }
        inlineStyle.cursor = 'pointer';
        inlineStyle.position = 'relative';
        inlineStyle.zIndex = 150; // Above the dark overlay
        inlineStyle.transition = 'all 0.2s';
      } else if (customFont) {
        inlineStyle.fontFamily = customFont;
      }
      
      const Tag = tag as any;
      return <Tag 
        {...props} 
        style={inlineStyle}
        onClick={fontModeActive ? (e: any) => { e.preventDefault(); e.stopPropagation(); toggleElement(tag); } : undefined}
      />;
    };
  });

  return (
    <div 
      className={`h-full flex flex-col relative bg-transparent ${fontModeActive ? 'z-[100]' : ''}`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      {editingImage && (
        <ImageEditorModal 
          imageUrl={editingImage} 
          onConfirm={handleImageConfirm}
          onCancel={() => setEditingImage(null)}
        />
      )}

      {showFontMenu && (
        <FontSelector onClose={() => setShowFontMenu(false)} />
      )}

      {fontModeActive && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-[160] pointer-events-none">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg border border-white/20 uppercase tracking-widest flex items-center gap-2"
          >
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            Select components to change font
          </motion.div>
        </div>
      )}

      <div className="p-3 text-[11px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800 flex justify-between items-center shrink-0">
        <span className={fontModeActive ? 'z-[150] bg-zinc-900 px-2 py-1 rounded text-white' : ''}>
          Live Preview
        </span>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto font-serif prose prose-invert prose-sm relative">
        {activeFile?.content ? (
          <Markdown 
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={markdownComponents}
          >
            {processedContent}
          </Markdown>
        ) : (
          <div className="h-full flex items-center justify-center text-zinc-300 dark:text-zinc-700 select-none italic">
            Drop assets here to insert
          </div>
        )}
      </div>
    </div>
  );
}
