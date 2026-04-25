import { useState, useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { NodeResizer } from '@reactflow/node-resizer';
import { X, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageData {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  aspectRatio?: 'original' | 'square' | 'video' | 'wide';
}

export function ImageNode({ data, selected, id }: NodeProps<ImageData>) {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleDelete = useCallback(() => {
    // This will be handled by the parent component
    const event = new CustomEvent('deleteNode', { detail: { nodeId: id } });
    window.dispatchEvent(event);
  }, [id]);

  const aspectRatioClass = {
    'original': '',
    'square': 'aspect-square',
    'video': 'aspect-video',
    'wide': 'aspect-[21/9]',
  }[data.aspectRatio || 'original'];

  if (!data.src || imageError) {
    return (
      <div 
        className={cn(
          "w-full h-full flex flex-col items-center justify-center bg-[#27272a] border-2 border-dashed border-[#52525b] rounded-lg p-4",
          selected && "border-[#c99367]"
        )}
      >
        <ImageIcon className="w-8 h-8 text-[#71717a] mb-2" />
        <span className="text-xs text-[#71717a]">Image not available</span>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full h-full group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <NodeResizer 
        isVisible={selected} 
        minWidth={50} 
        minHeight={50}
        lineStyle={{ borderColor: '#c99367', borderWidth: 2 }}
        handleStyle={{ backgroundColor: '#c99367', width: 8, height: 8 }}
      />
      
      {/* Delete button - visible on hover when selected */}
      {(selected || isHovered) && (
        <button
          onClick={handleDelete}
          className="absolute -top-3 -right-3 z-10 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}

      <div className={cn(
        "w-full h-full overflow-hidden rounded-lg border-2",
        selected ? "border-[#c99367]" : "border-transparent"
      )}>
        <img
          src={data.src}
          alt={data.alt || 'Diagram image'}
          className={cn(
            "w-full h-full object-contain bg-[#18181b]",
            aspectRatioClass
          )}
          onError={() => setImageError(true)}
          draggable={false}
        />
      </div>

      {/* Connection handles */}
      <Handle id="top" type="target" position={Position.Top} className="!w-2 !h-2 !bg-[#c99367] !border-2 !border-[#18181b]" />
      <Handle id="right" type="target" position={Position.Right} className="!w-2 !h-2 !bg-[#c99367] !border-2 !border-[#18181b]" />
      <Handle id="bottom" type="target" position={Position.Bottom} className="!w-2 !h-2 !bg-[#c99367] !border-2 !border-[#18181b]" />
      <Handle id="left" type="target" position={Position.Left} className="!w-2 !h-2 !bg-[#c99367] !border-2 !border-[#18181b]" />
      
      <Handle id="top-source" type="source" position={Position.Top} className="!w-2 !h-2 !bg-[#c99367] !border-2 !border-[#18181b]" />
      <Handle id="right-source" type="source" position={Position.Right} className="!w-2 !h-2 !bg-[#c99367] !border-2 !border-[#18181b]" />
      <Handle id="bottom-source" type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-[#c99367] !border-2 !border-[#18181b]" />
      <Handle id="left-source" type="source" position={Position.Left} className="!w-2 !h-2 !bg-[#c99367] !border-2 !border-[#18181b]" />
    </div>
  );
}
