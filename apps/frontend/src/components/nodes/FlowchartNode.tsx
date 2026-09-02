import React, { memo } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { cn } from '@/lib/utils';
import {
  Box, Search, LayoutDashboard, Maximize2, Menu, Grid, User, Tag, ToggleRight,
  Cloud, Container, Layers, Diamond, Circle, FileText, Clock, Database, Hand,
  Server, Users, Wifi, Bluetooth, Battery, CreditCard,
  Plus
} from 'lucide-react';

export type CanvasNodeStyle = {
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  fontSize?: number;
  fontWeight?: number | string;
  fontStyle?: 'normal' | 'italic';
  textDecoration?: string;
  textAlign?: 'left' | 'center' | 'right';
  width?: number;
  height?: number;
  fontFamily?: string;
  color?: string;
  borderRadius?: number;
  iconColor?: string;
};

// Map node kinds to Lucide icons for canvas rendering
export const NODE_ICONS: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  // UI Components
  'ui': Box,
  'button': Box,
  'input': Search,
  'card': LayoutDashboard,
  'modal': Maximize2,
  'navbar': Menu,
  'sidebar-nav': Grid,
  'avatar': User,
  'badge': Tag,
  'toggle': ToggleRight,
  // Cloud & DevOps
  'cloud': Cloud,
  'docker': Container,
  'kubernetes': Layers,
  'aws': Cloud,
  'azure': Cloud,
  'gcp': Cloud,
  'github': GithubIcon, // Map to custom or fallback
  'git': Box, // Fallback
  'ci-cd': Box,
  'terraform': Box,
  'monitoring': Box,
  'log': FileText,
  // Security
  'security': Box,
  'lock': Box,
  'shield': Box,
  'key': Box,
  'oauth': Box,
  'jwt': Box,
  'vault': Database,
  // Mobile
  'mobile': Box,
  'smartphone': Box,
  'tablet': Box,
  'touch': Hand,
  'notification-mobile': Box,
  'biometric': Box,
  // Analytics
  'analytics': Box,
  'chart-bar': Box,
  'chart-line': Box,
  'chart-pie': Box,
  'dashboard': LayoutDashboard,
  'metric': Box,
  // Communication
  'communication': Box,
  'chat': Box,
  'email': Box,
  'video-call': Box,
  'sms': Box,
  // Media
  'media': Box,
  'image': Box,
  'video': Box,
  'audio': Box,
  'camera': Box,
  // Location
  'location': Box,
  'map': Box,
  'gps': Box,
  'directions': Box,
  // ERD / Data shapes
  'entity': Box,
  'database': Database,
  'db': Database,
  'queue': Layers,
  'cache': Database,
  'service': Box,
  'function': Box,
  'cdn': Box,
  'actor': User,
  'system': Box,
  // Flowchart shapes
  'start': Circle,
  'proc': Box,
  'decision': Diamond,
  'data': FileText,
  'note': FileText,
  'document': FileText,
  'delay': Clock,
  'storage': Database,
  'manual': Hand,
  // Legacy kinds (only unique ones)
  'server': Server,
  'user': User,
  'users': Users,
  'file': FileText,
  'folder': Grid,
  'wifi': Wifi,
  'bluetooth': Bluetooth,
  'battery': Battery,
  'credit': CreditCard,
};

// Simple Fallback function to prevent broken icon components
function GithubIcon({ className }: { className?: string }) {
  return <div className={cn("w-6 h-6 border-2 border-current rounded-full flex items-center justify-center text-[10px] font-bold", className)}>GH</div>;
}
import { getShapeDefinition } from '@/domain/shapeRegistry';

// Helper function to extract node styles with fallbacks to canonical shape registry
export function getNodeStyle(kind: string, data?: any): Required<CanvasNodeStyle> {
  const shapeDef = getShapeDefinition(kind);
  const base = { width: shapeDef.defaultWidth, height: shapeDef.defaultHeight };
  
  // Get style from data or use defaults from canonical registry
  const style = data?.style || {};
  
  return {
    fillColor: String(style.fillColor || shapeDef.fillColor),
    strokeColor: String(style.strokeColor || shapeDef.borderColor),
    strokeWidth: Number(style.strokeWidth || 1.5),
    fontSize: Number(style.fontSize || 12),
    fontWeight: style.fontWeight || 600,
    fontStyle: (style.fontStyle as 'normal' | 'italic') || 'normal',
    textDecoration: String(style.textDecoration || 'none'),
    textAlign: (style.textAlign as 'left' | 'center' | 'right') || 'center',
    width: Number(style.width || base.width),
    height: Number(style.height || base.height),
    fontFamily: String(style.fontFamily || 'inherit'),
    color: String(style.color || shapeDef.textColor),
    iconColor: String(style.iconColor || style.strokeColor || '#a1a1aa'),
    borderRadius: Number(style.borderRadius) >= 0 ? Number(style.borderRadius) : shapeDef.borderRadius,
  };
}

export const FlowchartNode = memo(function FlowchartNode(props: NodeProps) {
  const { setNodes } = useReactFlow();
  const label = String(props.data?.label ?? '');
  const kind = String(props.data?.kind ?? 'node');
  const style = getNodeStyle(kind, props.data);
  const isSelected = props.selected;

  // Connection handles - sleek, dark-mode neutral dots that light up on hover
  const handleClass = "!w-2.5 !h-2.5 !rounded-full !border !border-black !bg-zinc-400 !opacity-30 group-hover/node:!opacity-100 hover:!opacity-100 hover:!scale-125 !transition-all !cursor-crosshair";

  if (kind === 'decision') {
    return (
      <div
        className={cn("group/node relative flex items-center justify-center select-none", isSelected && "ring-2 ring-primary/60 ring-offset-2 ring-offset-transparent rounded-sm")}
        style={{ width: style.width, height: style.height }}
      >
        <Handle id="top" type="target" position={Position.Top} className={handleClass} style={{ top: '10%' }} />
        <Handle id="left" type="target" position={Position.Left} className={handleClass} />
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" aria-hidden style={{ filter: isSelected ? 'drop-shadow(0 0 12px rgba(var(--color-primary),0.4))' : 'drop-shadow(0 2px 6px rgba(0,0,0,0.25))' }}>
          <polygon
            points="50,6 94,50 50,94 6,50"
            fill={style.fillColor}
            stroke={style.strokeColor}
            strokeWidth={style.strokeWidth + (isSelected ? 1 : 0)}
          />
        </svg>
        <div
          className="relative z-10 px-2 text-center leading-tight select-none"
          style={{
            fontSize: style.fontSize,
            fontFamily: style.fontFamily === 'inherit' ? undefined : style.fontFamily,
            fontWeight: style.fontWeight as any,
            fontStyle: style.fontStyle,
            textDecoration: style.textDecoration as any,
            textAlign: style.textAlign,
            color: style.color || 'var(--color-foreground)',
            maxWidth: '90px',
          }}
        >
          {label}
        </div>
        <Handle id="right" type="source" position={Position.Right} className={handleClass} />
        <Handle id="bottom" type="source" position={Position.Bottom} className={handleClass} style={{ bottom: '10%' }} />
      </div>
    );
  }

  if (kind === 'startend') {
    return (
      <div
        className="group/node relative select-none"
        style={{
          minWidth: style.width,
          minHeight: style.height,
          borderRadius: style.borderRadius,
          border: `${style.strokeWidth + (isSelected ? 1 : 0)}px solid ${style.strokeColor}`,
          background: style.fillColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '10px 20px',
          boxShadow: isSelected
            ? `0 0 0 3px color-mix(in oklab, var(--color-primary) 30%, transparent), 0 4px 16px rgba(0,0,0,0.25)`
            : '0 2px 10px rgba(0,0,0,0.2)',
        }}
      >
        <Handle id="top" type="target" position={Position.Top} className={handleClass} />
        <Handle id="left" type="target" position={Position.Left} className={handleClass} />
        <div
          className="text-center leading-snug select-none"
          style={{
            fontSize: style.fontSize,
            fontFamily: style.fontFamily === 'inherit' ? undefined : style.fontFamily,
            fontWeight: style.fontWeight as any,
            fontStyle: style.fontStyle,
            textDecoration: style.textDecoration as any,
            textAlign: style.textAlign,
            color: style.color || 'var(--color-foreground)',
          }}
        >
          {label}
        </div>
        <Handle id="right" type="source" position={Position.Right} className={handleClass} />
        <Handle id="bottom" type="source" position={Position.Bottom} className={handleClass} />
      </div>
    );
  }

  if (kind === 'database') {
    const w = style.width;
    const h = style.height;
    return (
      <div className="group/node relative flex flex-col items-center justify-center select-none" style={{ width: w, height: h }}>
        <Handle id="top" type="target" position={Position.Top} className={cn(handleClass, "!z-20")} />
        <Handle id="left" type="target" position={Position.Left} className={cn(handleClass, "!z-20")} />
        <Handle id="right" type="source" position={Position.Right} className={cn(handleClass, "!z-20")} />
        <Handle id="bottom" type="source" position={Position.Bottom} className={cn(handleClass, "!z-20")} />
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="absolute inset-0 z-0" aria-hidden
          style={{ filter: isSelected ? 'drop-shadow(0 0 10px rgba(var(--color-primary),0.4))' : 'drop-shadow(0 2px 6px rgba(0,0,0,0.25))' }}
        >
          <path 
            d={`M0,12 L0,${h-12} C0,${h+2} ${w},${h+2} ${w},${h-12} L${w},12 Z`} 
            fill={style.fillColor} stroke={style.strokeColor} strokeWidth={style.strokeWidth} 
          />
          <ellipse cx={w/2} cy="12" rx={w/2} ry="12" fill={style.fillColor} stroke={style.strokeColor} strokeWidth={style.strokeWidth} />
          <ellipse cx={w/2} cy="22" rx={w/2} ry="8" fill="transparent" stroke={style.strokeColor} strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
        </svg>
        <div
          className="relative z-10 max-w-[85%] px-1 text-center font-semibold leading-tight select-none"
          style={{
            fontSize: Math.min(style.fontSize, 12),
            fontFamily: style.fontFamily === 'inherit' ? undefined : style.fontFamily,
            color: style.color || 'var(--color-foreground)',
          }}
        >
          {label}
        </div>
      </div>
    );
  }

  if (kind === 'entity') {
    const lines = label.split('\n');
    const header = lines[0] || 'Entity';
    const fields = lines.slice(1);
    
    const dynamicHeight = Math.max(style.height, 42 + fields.length * 26 + 8);
    
    return (
      <div
        className="group/node relative flex flex-col overflow-hidden select-none"
        style={{
          width: Math.max(style.width, 180),
          minHeight: dynamicHeight,
          borderRadius: style.borderRadius,
          border: `${style.strokeWidth + (isSelected ? 1 : 0)}px solid ${style.strokeColor}`,
          background: style.fillColor,
          boxShadow: isSelected
            ? `0 0 0 3px color-mix(in oklab, var(--color-primary) 25%, transparent), 0 8px 30px rgba(0,0,0,0.4)`
            : '0 4px 14px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        <Handle id="top" type="target" position={Position.Top} className={cn(handleClass, "!z-20")} />
        <Handle id="left" type="target" position={Position.Left} className={cn(handleClass, "!top-1/2 !z-20")} />
        <Handle id="right" type="source" position={Position.Right} className={cn(handleClass, "!top-1/2 !z-20")} />
        <Handle id="bottom" type="source" position={Position.Bottom} className={cn(handleClass, "!z-20")} />
        
        <div
          className="shrink-0 border-b border-black/30 px-3 py-2 flex items-center justify-between"
          style={{ background: style.strokeColor }}
        >
          <span className="text-[11px] font-black uppercase tracking-wider text-white shadow-sm">
            {header}
          </span>
          <span className="text-[8px] tracking-widest font-bold text-white/50 bg-black/20 px-1.5 py-0.5 rounded flex items-center">
            TABLE
          </span>
        </div>
        
        <div
          className="flex flex-col flex-1 px-1.5 py-1.5 text-left select-none relative"
          style={{
            color: style.color || 'var(--color-foreground)',
            fontFamily: style.fontFamily === 'inherit' ? 'var(--font-mono, monospace)' : style.fontFamily,
          }}
        >
          {fields.map((f, i) => {
            const parts = f.split(':');
            const colName = parts[0];
            const colType = parts.slice(1).join(':');

            return (
              <div 
                key={i} 
                className="flex items-center group/field gap-2 px-1.5 py-1.5 font-medium text-[10.5px] leading-none border-b border-white/5 last:border-0 hover:bg-white/5 rounded-sm transition-colors"
                title={f || ''}
              >
                <div className="w-1.5 h-1.5 rounded-sm rotate-45 shrink-0 bg-primary/40 group-hover/field:bg-primary transition-colors" />
                <span className="truncate flex-1">{colName || '\u00A0'}</span>
                {colType && (
                  <span className="text-[9px] text-muted-foreground/60 tracking-tight shrink-0">{colType}</span>
                )}
              </div>
            );
          })}
          {fields.length === 0 && (
            <div className="text-[10px] italic text-muted-foreground/30 text-center py-4">
              Add fields...
            </div>
          )}
        </div>
        
        {isSelected && (
          <button
            autoFocus={false}
            className="absolute bottom-1 right-1 w-[22px] h-[22px] bg-primary/10 hover:bg-primary hover:text-primary-foreground text-primary rounded-md flex items-center justify-center opacity-0 group-hover/node:opacity-100 transition-all shadow-sm z-30"
            title="Add field"
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setNodes((nds) => nds.map((n) => {
                if (n.id === props.id) {
                  const newLines = [...lines, `col_${lines.length}: string`];
                  return {
                    ...n,
                    data: { ...n.data, label: newLines.join('\n') }
                  };
                }
                return n;
              }));
            }}
          >
            <Plus className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }

  if (kind === 'actor') {
    return (
      <div
        className="group/node relative select-none"
        style={{
          minWidth: style.width,
          minHeight: style.height,
          borderRadius: style.borderRadius,
          border: `${style.strokeWidth}px dashed ${style.strokeColor}`,
          background: style.fillColor,
          padding: '8px 12px',
          boxShadow: isSelected ? `0 0 0 2px color-mix(in oklab, var(--color-primary) 40%, transparent)` : '',
        }}
      >
        <Handle id="top" type="target" position={Position.Top} className={handleClass} />
        <Handle id="left" type="target" position={Position.Left} className={handleClass} />
        <div className="text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">Actor</div>
        <div
          className="text-center select-none"
          style={{
            fontSize: style.fontSize,
            fontFamily: style.fontFamily === 'inherit' ? undefined : style.fontFamily,
            color: style.color || 'var(--color-foreground)',
          }}
        >
          {label}
        </div>
        <Handle id="right" type="source" position={Position.Right} className={handleClass} />
        <Handle id="bottom" type="source" position={Position.Bottom} className={handleClass} />
      </div>
    );
  }

  if (kind === 'queue') {
    return (
      <div
        className="group/node relative overflow-hidden select-none"
        style={{
          minWidth: style.width,
          minHeight: style.height,
          borderRadius: style.borderRadius,
          border: `${style.strokeWidth}px solid ${style.strokeColor}`,
          background: style.fillColor,
          padding: '8px 12px 8px 18px',
          boxShadow: isSelected ? `0 0 0 2px color-mix(in oklab, var(--color-primary) 40%, transparent)` : '0 2px 8px rgba(0,0,0,0.2)',
        }}
      >
        <Handle id="top" type="target" position={Position.Top} className={handleClass} />
        <Handle id="left" type="target" position={Position.Left} className={handleClass} />
        <div
          className="absolute inset-y-0 left-0 w-2.5 opacity-40"
          style={{ background: `repeating-linear-gradient(-45deg, ${style.strokeColor}, ${style.strokeColor} 2px, transparent 2px, transparent 5px)` }}
        />
        <div
          className="relative text-center select-none"
          style={{
            fontSize: style.fontSize,
            fontFamily: style.fontFamily === 'inherit' ? undefined : style.fontFamily,
            fontWeight: style.fontWeight as any,
            color: style.color || 'var(--color-foreground)',
          }}
        >
          {label}
        </div>
        <Handle id="right" type="source" position={Position.Right} className={handleClass} />
        <Handle id="bottom" type="source" position={Position.Bottom} className={handleClass} />
      </div>
    );
  }

  if (kind === 'io') {
    return (
      <div className="group/node relative select-none" style={{ width: style.width, height: style.height }}>
        <Handle id="top" type="target" position={Position.Top} className={cn(handleClass, "!z-20")} />
        <Handle id="left" type="target" position={Position.Left} className={cn(handleClass, "!z-20")} />
        <Handle id="right" type="source" position={Position.Right} className={cn(handleClass, "!z-20")} />
        <Handle id="bottom" type="source" position={Position.Bottom} className={cn(handleClass, "!z-20")} />
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: 'skewX(-12deg)',
            border: `${style.strokeWidth}px solid ${style.strokeColor}`,
            background: style.fillColor,
            borderRadius: style.borderRadius,
            boxShadow: isSelected ? `0 0 0 2px color-mix(in oklab, var(--color-primary) 40%, transparent), 0 4px 12px rgba(0,0,0,0.25)` : '0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          <div
            className="max-w-[85%] px-2 text-center select-none"
            style={{
              transform: 'skewX(12deg)',
              fontSize: style.fontSize,
              fontFamily: style.fontFamily === 'inherit' ? undefined : style.fontFamily,
              fontWeight: style.fontWeight as any,
              color: style.color || 'var(--color-foreground)',
            }}
          >
            {label}
          </div>
        </div>
      </div>
    );
  }

  // process / default
  const dataIcon = props.data?.icon as string | undefined;
  let IconComponent = NODE_ICONS[kind] || (dataIcon && NODE_ICONS[dataIcon]) || null;
  if (!IconComponent && label) {
    const labelKey = label.toLowerCase().replace(/[^a-z0-9]/g, '');
    IconComponent = NODE_ICONS[labelKey] || null;
  }
  const hasIcon = !!IconComponent;
  
  const getCategoryColor = (k: string) => {
    if (['ui', 'button', 'input', 'card', 'modal', 'navbar', 'sidebar-nav', 'avatar', 'badge', 'toggle'].includes(k)) 
      return 'rgba(59, 130, 246, 0.15)';
    if (['cloud', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'github', 'git', 'ci-cd', 'terraform', 'monitoring', 'log'].includes(k)) 
      return 'rgba(16, 185, 129, 0.15)';
    if (['security', 'lock', 'shield', 'key', 'oauth', 'jwt', 'vault'].includes(k)) 
      return 'rgba(239, 68, 68, 0.15)';
    if (['mobile', 'smartphone', 'tablet', 'touch', 'notification-mobile', 'biometric'].includes(k)) 
      return 'rgba(139, 92, 246, 0.15)';
    if (['analytics', 'chart-bar', 'chart-line', 'chart-pie', 'dashboard', 'metric'].includes(k)) 
      return 'rgba(245, 158, 11, 0.15)';
    if (['communication', 'chat', 'email', 'video-call', 'sms'].includes(k)) 
      return 'rgba(14, 165, 233, 0.15)';
    if (['media', 'image', 'video', 'audio', 'camera'].includes(k)) 
      return 'rgba(236, 72, 153, 0.15)';
    if (['location', 'map', 'gps', 'directions'].includes(k)) 
      return 'rgba(34, 197, 94, 0.15)';
    return 'rgba(201, 147, 103, 0.1)';
  };

  const categoryBg = getCategoryColor(kind);
  
  return (
    <div
      className="group/node relative select-none"
      style={{
        minWidth: hasIcon ? Math.max(style.width, 160) : style.width,
        minHeight: hasIcon ? Math.max(style.height, 80) : style.height,
        borderRadius: style.borderRadius,
        border: `${style.strokeWidth + (isSelected ? 1 : 0)}px solid ${style.strokeColor}`,
        background: `linear-gradient(135deg, ${style.fillColor} 0%, ${style.fillColor} 70%, ${categoryBg} 100%)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: hasIcon ? '12px 16px' : '10px 16px',
        gap: hasIcon ? '6px' : '0',
        boxShadow: isSelected
          ? `0 0 0 3px color-mix(in oklab, var(--color-primary) 28%, transparent), 0 8px 24px rgba(0,0,0,0.35)`
          : '0 4px 14px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)',
        transition: 'all 0.2s ease',
      }}
    >
      <Handle id="top" type="target" position={Position.Top} className={handleClass} />
      <Handle id="left" type="target" position={Position.Left} className={handleClass} />
      
      {IconComponent && (
        <div 
          className="flex items-center justify-center mb-1"
          style={{ 
            color: style.iconColor || style.strokeColor,
            opacity: 0.95,
          }}
        >
          <IconComponent 
            className="w-8 h-8" 
            style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.3))' }}
          />
        </div>
      )}
      
      <div
        className="text-center leading-snug select-none"
        style={{
          fontSize: style.fontSize,
          fontFamily: style.fontFamily === 'inherit' ? undefined : style.fontFamily,
          fontWeight: style.fontWeight as any,
          fontStyle: style.fontStyle,
          textDecoration: style.textDecoration as any,
          textAlign: style.textAlign,
          color: style.color || 'var(--color-foreground)',
        }}
      >
        {label}
      </div>
      
      {hasIcon && (
        <div 
          className="text-[8px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded"
          style={{ 
            background: 'rgba(0,0,0,0.2)',
            color: style.iconColor || style.strokeColor,
            opacity: 0.7,
          }}
        >
          {kind}
        </div>
      )}
      
      <Handle id="right" type="source" position={Position.Right} className={handleClass} />
      <Handle id="bottom" type="source" position={Position.Bottom} className={handleClass} />
    </div>
  );
});
