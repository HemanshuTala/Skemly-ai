import { useState, useRef, useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { NodeResizer } from '@reactflow/node-resizer';
import '@reactflow/node-resizer/dist/style.css';
import { cn } from '@/lib/utils';

interface ShapeData {
  label: string;
  shape?: 'rectangle' | 'circle' | 'rounded';
  style?: {
    fillColor?: string;
    strokeColor?: string;
    strokeWidth?: number;
    fontSize?: number;
    color?: string;
  };
}

export function ResizableShapeNode({ data, selected, id }: NodeProps<ShapeData>) {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const shape = data.shape || 'rectangle';
  const style = data.style || {};
  
  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, []);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    // Update node data through ReactFlow's API
    if (data.label !== label) {
      // This will be handled by the parent component
    }
  }, [data.label, label]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      setIsEditing(false);
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
      setLabel(data.label || '');
    }
  }, [data.label]);

  const getShapeStyles = () => {
    const baseStyles = {
      background: style.fillColor || '#ffffff',
      border: `${style.strokeWidth || 2}px solid ${style.strokeColor || '#000000'}`,
    };

    switch (shape) {
      case 'circle':
        return { ...baseStyles, borderRadius: '50%' };
      case 'rounded':
        return { ...baseStyles, borderRadius: '12px' };
      case 'rectangle':
      default:
        return { ...baseStyles, borderRadius: '4px' };
    }
  };

  return (
    <div 
      className={cn(
        "relative w-full h-full flex items-center justify-center",
        selected && "ring-2 ring-primary"
      )}
      style={getShapeStyles()}
      onDoubleClick={handleDoubleClick}
    >
      <NodeResizer 
        isVisible={selected} 
        minWidth={50} 
        minHeight={30}
        lineStyle={{ borderColor: '#3b82f6', borderWidth: 2 }}
        handleStyle={{ backgroundColor: '#3b82f6', width: 8, height: 8 }}
      />
      
      <Handle id="top" type="target" position={Position.Top} className="!w-2 !h-2 !bg-primary" />
      <Handle id="right" type="target" position={Position.Right} className="!w-2 !h-2 !bg-primary" />
      <Handle id="bottom" type="target" position={Position.Bottom} className="!w-2 !h-2 !bg-primary" />
      <Handle id="left" type="target" position={Position.Left} className="!w-2 !h-2 !bg-primary" />
      
      <Handle id="top-source" type="source" position={Position.Top} className="!w-2 !h-2 !bg-primary" />
      <Handle id="right-source" type="source" position={Position.Right} className="!w-2 !h-2 !bg-primary" />
      <Handle id="bottom-source" type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-primary" />
      <Handle id="left-source" type="source" position={Position.Left} className="!w-2 !h-2 !bg-primary" />

      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full h-full p-2 text-center resize-none outline-none bg-transparent"
          style={{ 
            fontSize: style.fontSize || 14, 
            color: style.color || '#000000',
            fontFamily: 'inherit'
          }}
          autoFocus
        />
      ) : (
        <div 
          className="w-full h-full p-2 flex items-center justify-center overflow-hidden"
          style={{ 
            fontSize: style.fontSize || 14, 
            color: style.color || '#000000',
            fontFamily: 'inherit'
          }}
        >
          <span className="text-center break-words line-clamp-3">{label}</span>
        </div>
      )}
    </div>
  );
}
