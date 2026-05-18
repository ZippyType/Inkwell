import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { motion } from 'framer-motion';
import { 
  RotateCw, 
  RotateCcw, 
  Check, 
  X,
  Maximize2
} from 'lucide-react';

interface ImageEditorModalProps {
  imageUrl: string;
  onConfirm: (data: { crop: any; rotation: number; zoom: number }) => void;
  onCancel: () => void;
}

export function ImageEditorModal({ imageUrl, onConfirm, onCancel }: ImageEditorModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="font-bold text-zinc-100 italic">Transform Asset</h3>
          <button onClick={onCancel} className="p-1 hover:bg-zinc-800 rounded">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <div className="relative flex-1 min-h-[400px] bg-black">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
          />
        </div>

        <div className="p-6 bg-zinc-900 space-y-6">
          <div className="flex items-center gap-6">
            <div className="flex-1 space-y-2">
              <label className="text-[10px] uppercase font-bold text-zinc-500">Zoom</label>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setRotation(r => r - 90)}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 transition-colors"
                title="Rotate Left"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setRotation(r => r + 90)}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 transition-colors"
                title="Rotate Right"
              >
                <RotateCw className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-6 py-2 rounded-xl border border-zinc-800 text-zinc-400 hover:bg-zinc-800 transition-colors text-sm font-medium"
            >
              Discard
            </button>
            <button
              onClick={() => onConfirm({ crop: croppedAreaPixels, rotation, zoom })}
              className="px-6 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-bold flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Insert to Manuscript
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
