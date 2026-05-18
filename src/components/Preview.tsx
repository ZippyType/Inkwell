import React, { useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useStudio } from '../context/StudioContext';
import { useMarkdownProcessor } from '../lib/markdown';
import { COLOR_MAP, ColorOption } from '../types';
import { ImageEditorModal } from './ImageEditorModal';

export function Preview() {
  const { files, activeFileId, updateFileContent } = useStudio();
  const [editingImage, setEditingImage] = useState<string | null>(null);
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

  return (
    <div 
      className="h-full flex flex-col relative bg-transparent"
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

      <div className="p-3 text-[11px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800 flex justify-between shrink-0">
        Live Preview
        <svg className="w-3 h-3 opacity-50" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/></svg>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto font-serif prose prose-invert prose-sm">
        {activeFile?.content ? (
          <Markdown 
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              img: (props) => (
                <img 
                  {...props} 
                  className="rounded-lg shadow-md max-w-full" 
                  referrerPolicy="no-referrer" 
                />
              )
            }}
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
