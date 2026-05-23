import React, { useState, useRef } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useStudio } from '../context/StudioContext';
import { t } from '../lib/i18n';
import { useMarkdownProcessor } from '../lib/markdown';
import { ImageEditorModal } from './ImageEditorModal';
import { Type, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { FontSelector } from './FontSelector';
import { motion } from 'framer-motion';

const STYLED_TAGS = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'ul', 'ol', 'li', 'strong', 'em', 'span'] as const;

export function Preview() {
  const { language, files, activeFileId, updateFileContent, fontModeActive, selectedFontForMode, selectedElementsForMode, setSelectedElementsForMode, componentFonts, defaultFont } = useStudio();
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeFile = files.find(f => f.id === activeFileId);
  const processedContent = useMarkdownProcessor(activeFile?.content || '');

  const resetView = () => {
    setPreviewZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const isExplicitPan = e.button === 1 || e.altKey || e.target === containerRef.current;
    const isZoomPan = e.button === 0 && previewZoom > 1 && !fontModeActive;

    if (isExplicitPan || isZoomPan) {
      e.preventDefault();
      setIsPanning(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPanning) {
      setPan(prev => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY
      }));
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPanning) {
      setIsPanning(false);
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      // Zoom
      const zoomFactor = -e.deltaY * 0.005;
      setPreviewZoom(z => Math.max(0.1, Math.min(5, z + zoomFactor)));
    } else {
      // Pan
      setPan(p => ({
        x: p.x - e.deltaX,
        y: p.y - e.deltaY
      }));
    }
  };

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
    img: (props: any) => {
      if (!props.src) return null;
      return (
        <span className="my-6 relative group flex flex-col items-center block text-center">
          <img 
            {...props} 
            className="rounded-xl shadow-2xl max-w-full relative z-[150] bg-zinc-200 dark:bg-zinc-800 inline-block" 
            referrerPolicy="no-referrer"
            loading="lazy"
          />
          {props.alt && props.alt !== 'Image' && (
            <span className="mt-3 text-[10px] text-zinc-500 font-medium italic border-t border-zinc-300 dark:border-zinc-800 pt-1 px-4 block">{props.alt}</span>
          )}
        </span>
      );
    }
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
      
      // Special handling for paragraphs containing images to avoid hydration/hierarchy errors
      if (tag === 'p' && node?.children?.some((child: any) => child.tagName === 'img')) {
        return <div 
          {...props} 
          style={inlineStyle}
          onClick={fontModeActive ? (e: any) => { e.preventDefault(); e.stopPropagation(); toggleElement(tag); } : undefined}
        />;
      }

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

      <div className="p-3 text-[11px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-300 dark:border-zinc-800 flex justify-between items-center shrink-0">
        <span className={fontModeActive ? 'z-[150] bg-zinc-100 dark:bg-zinc-900 px-2 py-1 rounded text-white' : ''}>
          Live Preview
        </span>
        <div className="flex items-center gap-1">
          <button 
            onClick={resetView}
            className="p-1 mr-2 hover:bg-zinc-200 dark:bg-zinc-800 rounded text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
            title="Reset View"
          >
            <Maximize className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => setPreviewZoom(z => Math.max(0.25, z - 0.25))}
            className="p-1 hover:bg-zinc-200 dark:bg-zinc-800 rounded text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="w-10 text-center text-[10px] text-zinc-600 dark:text-zinc-400 font-mono">
            {Math.round(previewZoom * 100)}%
          </span>
          <button 
            onClick={() => setPreviewZoom(z => Math.min(3, z + 0.25))}
            className="p-1 hover:bg-zinc-200 dark:bg-zinc-800 rounded text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      
      <div 
        ref={containerRef}
        className={`flex-1 p-4 overflow-hidden relative ${isPanning ? 'cursor-grabbing' : (!fontModeActive && previewZoom > 1 ? 'cursor-grab' : 'cursor-default')}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
      >
        <div
          className="font-serif prose dark:prose-invert prose-sm mx-auto"
          style={{ 
            fontFamily: defaultFont,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${previewZoom})`,
            transformOrigin: 'top center',
            transition: isPanning ? 'none' : 'transform 0.1s ease-out'
          }}
        >
          {activeFile?.content ? (
            <Markdown 
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={markdownComponents}
            >
              {processedContent}
            </Markdown>
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-700 dark:text-zinc-300 dark:text-zinc-750 select-none italic text-center p-4">
              {t(language, 'dropAssets')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
