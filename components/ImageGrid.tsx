import React from 'react';
import { ImageFile, ImageStatus } from '../types';
import { Trash2, Eye, CheckCircle, AlertCircle, Loader2, Check } from 'lucide-react';

interface ImageGridProps {
  images: ImageFile[];
  onRemove: (id: string) => void;
  onSelect: (image: ImageFile) => void;
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
}

export const ImageGrid: React.FC<ImageGridProps> = ({ images, onRemove, onSelect, selectedIds, onToggleSelection }) => {
  return (
    <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-6 p-6 pb-32 space-y-6">
      {images.map((img) => {
        const isSelected = selectedIds.has(img.id);
        return (
            <div 
                key={img.id}
                onClick={() => onSelect(img)} // Clicking card opens preview
                className={`
                    group relative break-inside-avoid bg-white rounded-sm transition-all duration-200 ease-out p-2 pb-0 cursor-pointer
                    ${isSelected 
                        ? 'ring-2 ring-accent-gold shadow-lg translate-y-[-4px]' 
                        : 'shadow-card hover:shadow-float hover:translate-y-[-2px]'}
                `}
            >
                <div className="relative overflow-hidden rounded-sm bg-paper-dark/20">
                    <img 
                        src={img.previewUrl} 
                        alt="thumbnail" 
                        loading="lazy"
                        className={`w-full h-auto object-cover transition-opacity duration-300 min-h-[100px] ${img.status === ImageStatus.PROCESSING ? 'opacity-50 grayscale' : 'opacity-100'}`}
                    />
                    
                    {/* Selection Toggle Button */}
                    <div 
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleSelection(img.id);
                        }}
                        className={`
                        absolute top-2 left-2 z-20 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer shadow-sm
                        ${isSelected ? 'bg-accent-gold border-accent-gold' : 'bg-white/80 border-gray-300 hover:bg-white hover:border-accent-gold'}
                    `}>
                        {isSelected && <Check size={14} className="text-white" strokeWidth={3} />}
                    </div>

                    {/* Status Overlays */}
                    <div className="absolute top-2 right-2 z-10 pointer-events-none">
                        {img.status === ImageStatus.COMPLETED && <div className="bg-white/90 rounded-full p-1 shadow-sm"><CheckCircle className="text-green-600/80" size={16} /></div>}
                        {img.status === ImageStatus.ERROR && <div className="bg-white/90 rounded-full p-1 shadow-sm"><AlertCircle className="text-red-500/80" size={16} /></div>}
                        {img.status === ImageStatus.PROCESSING && <div className="bg-white/90 rounded-full p-1 shadow-sm"><Loader2 className="text-accent-gold animate-spin" size={16} /></div>}
                    </div>

                    {/* Hover Actions - Reduced to just 'Preview' text since card is clickable */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[1px] flex flex-col items-center justify-center gap-3 pointer-events-none">
                       <span className="text-white font-bold tracking-widest text-xs uppercase flex items-center gap-2">
                           <Eye size={16} /> Preview
                       </span>
                    </div>
                </div>

                <div className="py-3 px-1">
                    <p className={`text-xs truncate font-bold ${isSelected ? 'text-accent-gold' : 'text-ink-main'}`}>{img.file.name}</p>
                    <div className="flex justify-between items-center mt-1">
                        <p className="text-[10px] text-ink-muted font-mono">
                            {(img.file.size / 1024).toFixed(0)} KB
                        </p>
                        {img.status === ImageStatus.COMPLETED && (
                            <span className="text-[10px] text-accent-gold font-bold tracking-wider">DONE</span>
                        )}
                    </div>
                </div>
            </div>
        );
      })}
    </div>
  );
};