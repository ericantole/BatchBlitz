import React from 'react';
import { ImageFile, ImageStatus } from '../types';
import { Trash2, Eye, CheckCircle, AlertCircle, Loader2, Check } from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    rectSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ImageGridProps {
    images: ImageFile[];
    onRemove: (id: string) => void;
    onSelect: (image: ImageFile) => void;
    selectedIds: Set<string>;
    onToggleSelection: (id: string) => void;
    onReorder: (oldIndex: number, newIndex: number) => void;
}

interface SortableItemProps {
    img: ImageFile;
    index: number;
    isSelected: boolean;
    onSelect: (image: ImageFile) => void;
    onToggleSelection: (id: string) => void;
}

// SortableImageCard changes: removed h-full, removed min-h-[160px], removed bg-gray-50
const SortableImageCard: React.FC<SortableItemProps> = ({ img, index, isSelected, onSelect, onToggleSelection }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: img.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 999 : 1, // Ensure dragged item is on top
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={() => onSelect(img)} // Clicking card opens preview
            className={`
              group relative bg-white rounded-xl transition-all duration-200 ease-out p-2 pb-0 cursor-pointer flex flex-col
              ${isSelected ? 'ring-2 ring-accent-gold shadow-lg' : 'shadow-card hover:shadow-float'}
          `}
        >
            <div className="relative overflow-hidden rounded-lg flex items-center justify-center">
                <img
                    src={img.previewUrl}
                    alt="thumbnail"
                    loading="lazy"
                    className={`w-full h-auto max-h-[400px] object-contain transition-opacity duration-300 ${img.status === ImageStatus.PROCESSING ? 'opacity-50 grayscale' : 'opacity-100'}`}
                />

                {/* Selection Toggle Button (Top Left) */}
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

                {/* Index Badge (Top Right) */}
                <div className="absolute top-2 right-2 z-20 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md min-w-[20px] text-center shadow-sm border border-white/10 pointer-events-none">
                    {index + 1}
                </div>

                {/* Status Overlays (Bottom Right) */}
                <div className="absolute bottom-2 right-2 z-10 pointer-events-none">
                    {img.status === ImageStatus.COMPLETED && <div className="bg-white/90 rounded-full p-1 shadow-sm"><CheckCircle className="text-green-600/80" size={16} /></div>}
                    {img.status === ImageStatus.ERROR && <div className="bg-white/90 rounded-full p-1 shadow-sm"><AlertCircle className="text-red-500/80" size={16} /></div>}
                    {img.status === ImageStatus.PROCESSING && <div className="bg-white/90 rounded-full p-1 shadow-sm"><Loader2 className="text-accent-gold animate-spin" size={16} /></div>}
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[1px] flex flex-col items-center justify-center gap-3 pointer-events-none">
                    <span className="text-white font-bold tracking-widest text-xs uppercase flex items-center gap-2">
                        <Eye size={16} /> Preview
                    </span>
                </div>
            </div>

            <div className="py-3 px-1 mt-auto">
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
};

export const ImageGrid: React.FC<ImageGridProps> = ({ images, onRemove, onSelect, selectedIds, onToggleSelection, onReorder }) => {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), // 5px drag to activate (prevents accidental clicks)
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id && over) {
            const oldIndex = images.findIndex((img) => img.id === active.id);
            const newIndex = images.findIndex((img) => img.id === over.id);
            onReorder(oldIndex, newIndex);
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 p-6 pb-32 items-start">
                <SortableContext
                    items={images.map(img => img.id)}
                    strategy={rectSortingStrategy}
                >
                    {images.map((img, index) => (
                        <SortableImageCard
                            key={img.id}
                            img={img}
                            index={index}
                            isSelected={selectedIds.has(img.id)}
                            onSelect={onSelect}
                            onToggleSelection={onToggleSelection}
                        />
                    ))}
                </SortableContext>
            </div>
        </DndContext>
    );
};