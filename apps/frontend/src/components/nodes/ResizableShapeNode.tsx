import { useState, useRef, useCallback, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { NodeResizer } from '@reactflow/node-resizer';
import '@reactflow/node-resizer/dist/style.css';
import { cn } from '@/lib/utils';

interface ShapeData {
  label?: string;
  shape?: 'rectangle' | 'circle' | 'rounded';
  borderRadius?: number;
  width?: number;
  height?: number;
  style?: {
    fillColor?: string;
    strokeColor?: string;
    strokeWidth?: number;
    fontSize?: number;
    color?: string;
    borderRadius?: number;
  };
  /** Callback when dimensions change from resize */
  onDimensionsChange?: (id: string, width: number, height: number) => void;
  /** Callback when label changes */
  onLabelChange?: (id: string, label: string) => void;
}

export function ResizableShapeNode({ data, selected, id, type }: NodeProps<ShapeData>) {
  console.log(`[ResizableShapeNode] Render: id=${id}, type=${type}, shape=${data.shape}`);
  const { setNodes } = useReactFlow();
  
  // Handle resize - only notify parent, don't call setNodes (ReactFlow handles visual resize)
  const handleResize = useCallback((_: any, params: { width: number; height: number }) => {
    console.log('[ResizableShapeNode] Resize triggered:', { id, width: params.width, height: params.height, onDimensionsChange: !!data.onDimensionsChange });
    // Notify parent component (DiagramCanvas) of dimension change
    // The visual resize is handled by ReactFlow's NodeResizer automatically
    data.onDimensionsChange?.(id, params.width, params.height);
  }, [id, data]);
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync local label state when data.label changes from parent
  useEffect(() => {
    if (!isEditing) {
      setLabel(data.label || '');
    }
  }, [data.label, isEditing]);

  const shape = data.shape || 'rectangle';
  const style = data.style || {};
  
  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, []);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    // Update node data through callback to parent
    if (data.label !== label) {
      data.onLabelChange?.(id, label);
    }
  }, [data.label, label, data, id]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      setIsEditing(false);
      // Save label on Enter
      if (data.label !== label) {
        data.onLabelChange?.(id, label);
      }
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
      setLabel(data.label || '');
    }
  }, [data.label, label, data, id]);

  const getShapeStyles = () => {
    const baseStyles = {
      background: style.fillColor || '#ffffff',
      border: `${style.strokeWidth || 2}px solid ${style.strokeColor || '#000000'}`,
      boxShadow: selected ? '0 4px 12px rgba(59, 130, 246, 0.25)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
      transition: 'box-shadow 0.2s ease',
    };

    // Get custom border radius from data or style
    const customRadius = data.borderRadius || style.borderRadius || 4;

    switch (shape) {
      case 'circle':
        return { ...baseStyles, borderRadius: '50%' };
      case 'rounded':
        return { ...baseStyles, borderRadius: `${Math.max(4, customRadius)}px` };
      case 'rectangle':
      default:
        return { ...baseStyles, borderRadius: `${customRadius}px` };
    }
  };


  const shapeStyles = getShapeStyles();

  return (
    <div 
      className={cn(
        "relative w-full h-full flex items-center justify-center",
        selected && "ring-2 ring-primary"
      )}
      style={shapeStyles}
      onDoubleClick={handleDoubleClick}
    >
      <NodeResizer 
        isVisible={selected} 
        minWidth={shape === 'circle' ? 80 : 60} 
        minHeight={shape === 'circle' ? 80 : 40}
        lineStyle={{ borderColor: '#3b82f6', borderWidth: 2, borderStyle: 'solid' }}
        handleStyle={{ 
          backgroundColor: '#ffffff', 
          border: '2px solid #3b82f6',
          width: 10, 
          height: 10,
          borderRadius: '50%',
        }}
        handleClassName="shadow-sm"
        onResize={handleResize}
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
          className="w-full h-full p-3 text-center resize-none outline-none bg-transparent relative z-10"
          style={{ 
            fontSize: style.fontSize || 14, 
            color: style.color || '#000000',
            fontFamily: 'inherit',
            lineHeight: '1.4',
          }}
          autoFocus
        />
      ) : (
        <div 
          className="w-full h-full p-3 flex items-center justify-center relative z-10"
          style={{ 
            fontSize: style.fontSize || 14, 
            color: style.color || '#000000',
            fontFamily: 'inherit',
            lineHeight: '1.4',
            overflow: shape === 'circle' ? 'visible' : 'auto',
          }}
        >
          <span 
            className="text-center break-words" 
            style={{ 
              color: style.color || '#000000',
              display: '-webkit-box',
              WebkitLineClamp: shape === 'circle' ? 2 : 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              maxWidth: shape === 'circle' ? '70%' : '100%',
            }}
          >
            {label}
          </span>
        </div>
      )}
    </div>
  );
}
