import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Connection,
  BackgroundVariant,
  NodeChange,
  EdgeChange,
  Handle,
  Position,
  NodeProps,
  MarkerType,
  ConnectionMode,
  ReactFlowProvider,
  type OnSelectionChangeParams,
  type Viewport,
  useReactFlow,
  getNodesBounds,
} from 'reactflow';
import type { ReactFlowInstance } from 'reactflow';
import 'reactflow/dist/style.css';
import { cn } from '@/lib/utils';
import { Modal } from '../ui/modal';
import { ResizableShapeNode } from '../nodes/ResizableShapeNode';
import { ImageNode } from '../nodes/ImageNode';
import { Button } from '../ui/button';
import {
  Plus, Maximize2, MousePointer2, Hand, ZoomIn, ZoomOut,
  Box, LayoutDashboard, User, Tag, ToggleRight, Container, Layers, Diamond,
  Cloud, Github, GitBranch, RefreshCw, Settings, Activity, FileText,
  Lock, Shield, Key, Globe, Fingerprint, Database, Smartphone, Tablet,
  MousePointer, Bell, BarChart3, LineChart, PieChart, Target,
  MessageSquare, Mail, Video, MessageCircle, Image, Music, Camera,
  MapPin, Map as MapIcon, Navigation, ArrowRight, Server, HardDrive, Monitor, Circle,
  FileCode, Code, Wifi, Zap, Battery, Home, Building, Car, Plane,
  ShoppingCart, CreditCard, Wallet, Calendar, Clock, Star, Heart,
  Share, Download, Upload, Search, Filter, Grid, List, Menu,
  MoreHorizontal, MoreVertical, ChevronLeft, ChevronRight, ChevronUp, ChevronDown,
  Check, X, AlertCircle, Info, HelpCircle, AlertTriangle,
  Trash, Copy, Edit, Save, Undo, Redo, Eye, EyeOff, Lock as LockIcon,
  Unlock, LogIn, LogOut, UserPlus, Users, UserMinus,
  Briefcase, BookOpen, GraduationCap, School, Factory,
  Warehouse, Store, Hotel, Castle, Church, Landmark,
  Trees, Flower, Leaf, Sun, Moon, CloudRain, Wind, Thermometer,
  Flame, Snowflake, Droplets, Waves, Anchor, Compass, Rocket,
  Satellite, Radio, Antenna, Scan, Radar, Siren, Megaphone,
  Speaker, Headphones, Watch, Glasses, Smartphone as MobileIcon,
  Laptop, Computer, Cpu, Disc, Usb, Bluetooth, Wifi as WifiIcon,
  Cable, Power, BatteryCharging, BatteryFull,
  BatteryLow, BatteryMedium, BatteryWarning, Plug, Zap as ZapIcon,
  Activity as ActivityIcon, Heart as HeartIcon, Stethoscope,
  Syringe, Pill, Microscope, FlaskConical, TestTube, Dna,
  Atom, Orbit, Rocket as RocketIcon, Satellite as SatIcon,
  Brain, Bot, Sparkles, Lightbulb, Flashlight, Flame as FireIcon
} from 'lucide-react';
import gsap from 'gsap';
import { toPng } from 'html-to-image';

const EDGE_STROKE = 'var(--color-primary)';
const PANEL_MUTED = 'h-9 border-b border-border/80 bg-muted/35 flex items-center px-3 shrink-0';

interface DiagramCanvasProps {
  syntax: string;
  visualData?: { nodes: Node[]; edges: Edge[] };
  onNodesChange?: (nodes: Node[]) => void;
  onEdgesChange?: (edges: Edge[]) => void;
  onGraphChange?: (graph: { nodes: Node[]; edges: Edge[] }) => void;
  onUserGraphChange?: (graph: { nodes: Node[]; edges: Edge[] }) => void;
  /** Fired when the user edits the canvas (drag, connect, drop, ...) so the parent can treat the graph as authoritative over code. */
  onCanvasUserGesture?: () => void;
  paperColor?: string;
  showGrid?: boolean;
  showRuler?: boolean;
  onSelectionChange?: (selection: {
    nodeId: string | null;
    edgeId: string | null;
    nodeIds: string[];
    edgeIds: string[];
    selectedNode: Node | null;
    selectedEdge: Edge | null;
  }) => void;
  onRegisterPngExporter?: (exporter: ((scale: number) => Promise<string>) | null) => void;
}

type CanvasNodeStyle = {
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
const NODE_ICONS: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
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
  'github': Github,
  'git': GitBranch,
  'ci-cd': RefreshCw,
  'terraform': Settings,
  'monitoring': Activity,
  'log': FileText,
  // Security
  'security': Lock,
  'lock': Lock,
  'shield': Shield,
  'key': Key,
  'oauth': Globe,
  'jwt': Fingerprint,
  'vault': Database,
  // Mobile
  'mobile': Smartphone,
  'smartphone': Smartphone,
  'tablet': Tablet,
  'touch': MousePointer,
  'notification-mobile': Bell,
  'biometric': Fingerprint,
  // Analytics
  'analytics': BarChart3,
  'chart-bar': BarChart3,
  'chart-line': LineChart,
  'chart-pie': PieChart,
  'dashboard': LayoutDashboard,
  'metric': Target,
  // Communication
  'communication': MessageSquare,
  'chat': MessageSquare,
  'email': Mail,
  'video-call': Video,
  'sms': MessageCircle,
  // Media
  'media': Image,
  'image': Image,
  'video': Video,
  'audio': Music,
  'camera': Camera,
  // Location
  'location': MapPin,
  'map': MapIcon,
  'gps': Navigation,
  'directions': ArrowRight,
  // ERD / Data shapes
  'entity': Box,
  'database': Database,
  'db': Database,
  'queue': Layers,
  'cache': Database,
  'service': Settings,
  'function': Code,
  'cdn': Globe,
  'actor': User,
  'system': Monitor,
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

function getNodeStyle(data: any, kind: string): Required<CanvasNodeStyle> {
  const base =
    kind === 'decision'
      ? { width: 132, height: 132 }
      : kind === 'startend'
        ? { width: 140, height: 52 }
        : kind === 'database'
          ? { width: 168, height: 64 }
          : kind === 'entity'
            ? { width: 176, height: 80 }
            : kind === 'actor'
              ? { width: 152, height: 56 }
              : kind === 'queue'
                ? { width: 168, height: 52 }
                : kind === 'io'
                  ? { width: 172, height: 52 }
                  : { width: 160, height: 52 };
  // Get style from data or use defaults
  const style = data?.style || {};
  
  return {
    fillColor: String(style.fillColor || '#27272a'),
    strokeColor: String(style.strokeColor || '#ffffff'),
    strokeWidth: Number(style.strokeWidth || 2),
    fontSize: Number(style.fontSize || 12),
    fontWeight: style.fontWeight || 600,
    fontStyle: (style.fontStyle as 'normal' | 'italic') || 'normal',
    textDecoration: String(style.textDecoration || 'none'),
    textAlign: (style.textAlign as 'left' | 'center' | 'right') || 'center',
    width: Number(style.width || base.width),
    height: Number(style.height || base.height),
    fontFamily: String(style.fontFamily || 'inherit'),
    color: String(style.color || '#ffffff'),
    iconColor: String(style.iconColor || style.strokeColor || '#ffffff'),
    borderRadius:
      Number(style.borderRadius) > 0
        ? Number(style.borderRadius)
        : kind === 'startend'
          ? 9999
          : kind === 'decision'
            ? 4
            : kind === 'entity'
              ? 8
              : kind === 'actor'
                ? 8
                : kind === 'queue'
                  ? 8
                  : kind === 'io'
                    ? 4
                    : 10,
  };
}

function FlowchartNode(props: NodeProps) {
  const { setNodes } = useReactFlow();
  const label = String(props.data?.label ?? '');
  const kind = String(props.data?.kind ?? 'node');
  const style = getNodeStyle(props.data, kind);
  const isSelected = props.selected;

  // Connection handles - always visible but subtle, larger for easier connection
  const handleClass = "!w-4 !h-4 !rounded-full !border-2 !border-[#18181b] !bg-white/80 !opacity-60 hover:!opacity-100 !transition-all !shadow-md !cursor-crosshair";

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
      </div>
    );
  }

  if (kind === 'database') {
    const w = style.width;
    const h = style.height;
    return (
      <div className="group/node relative flex flex-col items-center justify-center select-none" style={{ width: w, height: h }}>
        <Handle id="left" type="target" position={Position.Left} className={cn(handleClass, "!z-20")} />
        <Handle id="right" type="source" position={Position.Right} className={cn(handleClass, "!z-20")} />
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="absolute inset-0 z-0" aria-hidden
          style={{ filter: isSelected ? 'drop-shadow(0 0 10px rgba(var(--color-primary),0.4))' : 'drop-shadow(0 2px 6px rgba(0,0,0,0.25))' }}
        >
          {/* Cylinder body */}
          <path 
            d={`M0,12 L0,${h-12} C0,${h+2} ${w},${h+2} ${w},${h-12} L${w},12 Z`} 
            fill={style.fillColor} stroke={style.strokeColor} strokeWidth={style.strokeWidth} 
          />
          {/* Cylinder lid (top ellipse) */}
          <ellipse cx={w/2} cy="12" rx={w/2} ry="12" fill={style.fillColor} stroke={style.strokeColor} strokeWidth={style.strokeWidth} />
          {/* Decorative faint ring */}
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
    
    // Auto-expand height
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
        <Handle id="left" type="target" position={Position.Left} className={cn(handleClass, "!top-1/2 !z-20")} />
        <Handle id="right" type="source" position={Position.Right} className={cn(handleClass, "!top-1/2 !z-20")} />
        
        {/* Entity Header */}
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
        
        {/* Entity Fields */}
        <div
          className="flex flex-col flex-1 px-1.5 py-1.5 text-left select-none relative"
          style={{
            color: style.color || 'var(--color-foreground)',
            fontFamily: style.fontFamily === 'inherit' ? 'var(--font-mono, monospace)' : style.fontFamily,
          }}
        >
          {fields.map((f, i) => {
            // Split field by colon or space to highlight types if user added them
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
        
        {/* Quick Add Column Button */}
        {isSelected && (
          <button
            autoFocus={false}
            className="absolute bottom-1 right-1 w-[22px] h-[22px] bg-primary/10 hover:bg-primary hover:text-primary-foreground text-primary rounded-md flex items-center justify-center opacity-0 group-hover/node:opacity-100 transition-all shadow-sm z-30"
            title="Add field"
            onPointerDown={(e) => {
              e.stopPropagation(); // Preempt dragging
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
      </div>
    );
  }

  if (kind === 'io') {
    return (
      <div className="group/node relative select-none" style={{ width: style.width, height: style.height }}>
        <Handle id="left" type="target" position={Position.Left} className={cn(handleClass, "!z-20")} />
        <Handle id="right" type="source" position={Position.Right} className={cn(handleClass, "!z-20")} />
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

  // process / default — enhanced node with icon and better styling
  const dataIcon = props.data?.icon as string | undefined;
  // Try to find icon: first by kind, then by data icon, then by label match
  let IconComponent = NODE_ICONS[kind] || (dataIcon && NODE_ICONS[dataIcon]) || null;
  // If still no icon, try to match label to icon
  if (!IconComponent && label) {
    const labelKey = label.toLowerCase().replace(/[^a-z0-9]/g, '');
    IconComponent = NODE_ICONS[labelKey] || null;
  }
  const hasIcon = !!IconComponent;
  
  // Get category color based on node kind
  const getCategoryColor = (k: string) => {
    if (['ui', 'button', 'input', 'card', 'modal', 'navbar', 'sidebar-nav', 'avatar', 'badge', 'toggle'].includes(k)) 
      return 'rgba(59, 130, 246, 0.15)'; // Blue
    if (['cloud', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'github', 'git', 'ci-cd', 'terraform', 'monitoring', 'log'].includes(k)) 
      return 'rgba(16, 185, 129, 0.15)'; // Green
    if (['security', 'lock', 'shield', 'key', 'oauth', 'jwt', 'vault'].includes(k)) 
      return 'rgba(239, 68, 68, 0.15)'; // Red
    if (['mobile', 'smartphone', 'tablet', 'touch', 'notification-mobile', 'biometric'].includes(k)) 
      return 'rgba(139, 92, 246, 0.15)'; // Purple
    if (['analytics', 'chart-bar', 'chart-line', 'chart-pie', 'dashboard', 'metric'].includes(k)) 
      return 'rgba(245, 158, 11, 0.15)'; // Amber
    if (['communication', 'chat', 'email', 'video-call', 'sms'].includes(k)) 
      return 'rgba(14, 165, 233, 0.15)'; // Sky
    if (['media', 'image', 'video', 'audio', 'camera'].includes(k)) 
      return 'rgba(236, 72, 153, 0.15)'; // Pink
    if (['location', 'map', 'gps', 'directions'].includes(k)) 
      return 'rgba(34, 197, 94, 0.15)'; // Green
    return 'rgba(201, 147, 103, 0.1)'; // Default tan/brown tint
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
      
      {/* Icon - larger like palette */}
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
      
      {/* Label */}
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
      
      {/* Kind badge */}
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
}

// nodeTypes MUST be defined outside the component to avoid ReactFlow remounting nodes on every render
const nodeTypes = { diagramNode: FlowchartNode, resizableShape: ResizableShapeNode, image: ImageNode };

// Strip callback functions from node data before serializing to parent/storage
function stripNodeCallbacks(data: any): any {
  if (!data) return data;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { onDimensionsChange, onLabelChange, ...rest } = data;
  return rest;
}

function QuickAddHandles({
  node,
  zoom,
  viewport,
  onAdd
}: {
  node: Node | undefined;
  zoom: number;
  viewport: { x: number; y: number };
  onAdd: (dir: 'top' | 'right' | 'bottom' | 'left') => void;
}) {
  if (!node?.data) return null;
  const style = getNodeStyle(node.data, (node.data as any)?.kind || 'node');
  const w = style.width * zoom;
  const h = style.height * zoom;
  const tx = node.position.x * zoom + viewport.x;
  const ty = node.position.y * zoom + viewport.y;

  const btnClass = "absolute flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white shadow-lg hover:scale-125 hover:bg-primary-foreground hover:text-primary transition-all cursor-pointer z-[60]";

  return (
    <div
      className="absolute pointer-events-none z-[50]"
      style={{ left: tx, top: ty, width: w, height: h }}
    >
      {/* Top */}
      <button
        className={cn(btnClass, "pointer-events-auto -top-6 left-1/2 -translate-x-1/2")}
        onClick={(e) => { e.stopPropagation(); onAdd('top'); }}
      >
        <Plus className="w-3 h-3" />
      </button>
      {/* Right */}
      <button
        className={cn(btnClass, "pointer-events-auto -right-6 top-1/2 -translate-y-1/2")}
        onClick={(e) => { e.stopPropagation(); onAdd('right'); }}
      >
        <Plus className="w-3 h-3" />
      </button>
      {/* Bottom */}
      <button
        className={cn(btnClass, "pointer-events-auto -bottom-6 left-1/2 -translate-x-1/2")}
        onClick={(e) => { e.stopPropagation(); onAdd('bottom'); }}
      >
        <Plus className="w-3 h-3" />
      </button>
      {/* Left */}
      <button
        className={cn(btnClass, "pointer-events-auto -left-6 top-1/2 -translate-y-1/2")}
        onClick={(e) => { e.stopPropagation(); onAdd('left'); }}
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
}

// Inner implementation — must be a descendant of ReactFlowProvider
function DiagramCanvasInner({
  syntax,
  visualData,
  onNodesChange,
  onEdgesChange,
  onGraphChange,
  onUserGraphChange,
  onCanvasUserGesture,
  paperColor = '#09090b',
  showGrid = true,
  showRuler = false,
  onSelectionChange,
  onRegisterPngExporter,
}: DiagramCanvasProps) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const onNodesChangeInternal = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );
  const onEdgesChangeInternal = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const isParsingRef = useRef(false);
  const isInternalChangeRef = useRef(false);
  const suppressHistoryRef = useRef(false);

  const [snapToGrid, setSnapToGrid] = useState(true);
  const [isAddNodeOpen, setIsAddNodeOpen] = useState(false);
  const [addNodeLabel, setAddNodeLabel] = useState('Node');
  const [addNodeKind, setAddNodeKind] = useState<
    'node' | 'decision' | 'startend' | 'database' | 'entity' | 'actor' | 'queue' | 'io'
  >('node');
  const [pendingAddPosition, setPendingAddPosition] = useState<{ x: number; y: number } | null>(null);
  const [isRenameNodeOpen, setIsRenameNodeOpen] = useState(false);
  const [renameNodeId, setRenameNodeId] = useState<string | null>(null);
  const [renameNodeLabel, setRenameNodeLabel] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [interactionMode, setInteractionMode] = useState<'select' | 'pan'>('select');
  
  // DEBUG: Track nodes state

  const [isExportingSnapshot, setIsExportingSnapshot] = useState(false);
  // viewport is read inside <ReactFlow> via ViewportBridge to avoid the Zustand-provider error
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const floatingBarRef = useRef<HTMLDivElement>(null);

  const historyRef = useRef<Array<{ nodes: Node[]; edges: Edge[] }>>([]);
  const historyIndexRef = useRef(-1);
  const pushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSyncTimeRef = useRef<number>(0);
  const lastSyntaxHashRef = useRef<string | null>(null);
  const lastHistoryHashRef = useRef<string | null>(null);
  const lastAppliedVisualHashRef = useRef<string | null>(null);

  // GSAP entrance for canvas
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out', clearProps: 'opacity' });
  }, []);

  // Animate floating controls entrance
  useEffect(() => {
    if (!floatingBarRef.current) return;
    gsap.fromTo(floatingBarRef.current,
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: 'back.out(1.6)', delay: 0.3 }
    );
  }, []);

  useEffect(() => {
    if (!onRegisterPngExporter) return;
    const exporter = async (scale: number) => {
      const root = containerRef.current;
      if (!root) throw new Error('Canvas root not available');

      const previousSelectedNodeId = selectedNodeId;
      const previousMode = interactionMode;
      setIsExportingSnapshot(true);
      setSelectedNodeId(null);
      setInteractionMode('pan');

      // Get the flow container and viewport elements
      const flowContainer = root.querySelector('.react-flow') as HTMLElement | null;
      const flowViewport = root.querySelector('.react-flow__viewport') as HTMLElement | null;
      
      if (!flowContainer || !flowViewport || !reactFlowInstance) {
        throw new Error('Canvas elements not found');
      }

      // Get current nodes and calculate exact bounds including node dimensions
      const currentNodes = reactFlowInstance.getNodes();
      
      if (currentNodes.length === 0) {
        throw new Error('No nodes to export');
      }

      // Calculate bounds with proper node dimensions
      const nodesWithBounds = currentNodes.map((n) => {
        const styleW = Number((n.data as any)?.style?.width);
        const styleH = Number((n.data as any)?.style?.height);
        const width = Number(n.width) > 0 ? Number(n.width) : Number.isFinite(styleW) && styleW > 0 ? styleW : 160;
        const height = Number(n.height) > 0 ? Number(n.height) : Number.isFinite(styleH) && styleH > 0 ? styleH : 60;
        return {
          id: n.id,
          left: n.position.x,
          right: n.position.x + width,
          top: n.position.y,
          bottom: n.position.y + height,
          width,
          height,
        };
      });

      const minX = Math.min(...nodesWithBounds.map((n) => n.left));
      const maxX = Math.max(...nodesWithBounds.map((n) => n.right));
      const minY = Math.min(...nodesWithBounds.map((n) => n.top));
      const maxY = Math.max(...nodesWithBounds.map((n) => n.bottom));

      const contentWidth = maxX - minX;
      const contentHeight = maxY - minY;

      // Add padding around the content
      const padding = 40;
      const boundsWidth = contentWidth + padding * 2;
      const boundsHeight = contentHeight + padding * 2;

      // Get container dimensions
      const containerWidth = flowContainer.clientWidth;
      const containerHeight = flowContainer.clientHeight;

      // Calculate optimal zoom to fit all content
      const zoomX = containerWidth / boundsWidth;
      const zoomY = containerHeight / boundsHeight;
      const optimalZoom = Math.min(zoomX, zoomY, 1.2); // Cap at 1.2x
      const zoom = Math.max(optimalZoom, 0.2); // Minimum zoom 0.2

      // Center the content
      const centerX = minX + contentWidth / 2;
      const centerY = minY + contentHeight / 2;
      
      const viewportX = containerWidth / 2 - centerX * zoom;
      const viewportY = containerHeight / 2 - centerY * zoom;

      // Set viewport to fit all content
      reactFlowInstance.setViewport(
        { x: viewportX, y: viewportY, zoom },
        { duration: 0 }
      );

      // Wait for viewport to render
      await new Promise<void>((resolve) => window.setTimeout(() => resolve(), 300));

      // Get the canvas background color
      const computedStyle = window.getComputedStyle(flowContainer);
      const bgColor = computedStyle.backgroundColor || '#09090b';

      // Capture the viewport element (has the CSS transforms applied)
      const dataUrl = await toPng(flowViewport, {
        cacheBust: true,
        pixelRatio: Math.max(1, Math.min(Number(scale) || 2, 3)), // Cap at 3x
        backgroundColor: bgColor,
        width: containerWidth,
        height: containerHeight,
        skipFonts: false,
        filter: (node) => {
          if (!(node instanceof Element)) return true;
          const classList = node.classList;
          // Remove UI overlays and controls
          return !(
            classList.contains('export-ignore') ||
            classList.contains('react-flow__controls') ||
            classList.contains('react-flow__minimap') ||
            classList.contains('react-flow__attribution') ||
            classList.contains('react-flow__handle') ||
            classList.contains('react-flow__nodesselection') ||
            classList.contains('react-flow__selection') ||
            classList.contains('react-flow__edgeupdater') ||
            classList.contains('react-flow__panel') ||
            node.getAttribute('data-testid')?.includes('panel')
          );
        },
      });

      // Restore previous state
      setSelectedNodeId(previousSelectedNodeId);
      setInteractionMode(previousMode);
      setIsExportingSnapshot(false);
      
      return dataUrl;
    };

    onRegisterPngExporter(exporter);
    return () => onRegisterPngExporter(null);
  }, [onRegisterPngExporter, reactFlowInstance, selectedNodeId, interactionMode]);

  const graphHash = useMemo(() => {
    const simple = {
      nodes: nodes.map((n) => ({
        id: n.id,
        x: n.position.x,
        y: n.position.y,
        label: (n.data as any)?.label,
        kind: (n.data as any)?.kind,
        style: (n.data as any)?.style,
      })),
      edges: edges.map((e) => ({
        id: e.id,
        s: e.source,
        t: e.target,
        label: e.label,
        style: e.style,
        labelStyle: (e as any).labelStyle,
        markerEnd: (e as any).markerEnd,
      })),
    };
    return JSON.stringify(simple);
  }, [nodes, edges]);
  const visualHash = useMemo(() => {
    const vNodes = visualData?.nodes ?? [];
    const vEdges = visualData?.edges ?? [];
    const simple = {
      nodes: vNodes.map((n) => ({
        id: n.id,
        x: n.position.x,
        y: n.position.y,
        w: n.width,   // include dimensions so resize triggers visualChanged
        h: n.height,
        label: (n.data as any)?.label,
        kind: (n.data as any)?.kind,
        shape: (n.data as any)?.shape,
        style: (n.data as any)?.style,
      })),
      edges: vEdges.map((e) => ({
        id: e.id,
        s: e.source,
        t: e.target,
        label: e.label,
        style: e.style,
        labelStyle: (e as any).labelStyle,
        markerEnd: (e as any).markerEnd,
      })),
    };
    return JSON.stringify(simple);
  }, [visualData]);

  const syntaxHash = useMemo(() => String(syntax || '').trim(), [syntax]);

  // Parse syntax to generate nodes/edges
  useEffect(() => {
   
    const hasVisual =
      visualData &&
      ((visualData.nodes?.length ?? 0) > 0 || (visualData.edges?.length ?? 0) > 0);
    
    const syntaxChanged = syntaxHash !== lastSyntaxHashRef.current;
    const visualChanged = visualHash !== lastAppliedVisualHashRef.current;
    
   
    
    // Only skip if BOTH hashes are unchanged AND we have no visual data to apply
    if (!syntaxChanged && !visualChanged && !hasVisual) {
    
      return;
    }


    
    const t = window.setTimeout(() => {
      
      isParsingRef.current = true;
      isInternalChangeRef.current = true;

    try {
   
      const graph = parseSyntaxToGraph(syntax);
     
      if (visualChanged && hasVisual) {
        // Apply visualData from parent. Strip stale callbacks — nodesForReactFlow memo re-injects fresh ones.
        setNodes((prevNodes: Node[]) => {
          const existingNodes = new Map<string, Node>(prevNodes.map(n => [n.id, n]));
          return (visualData!.nodes || []).map((n: any) => {
            const cleanData = stripNodeCallbacks(n.data);
            const nodeType = n.type || (cleanData?.shape ? 'resizableShape' : 'diagramNode');
            const existing = existingNodes.get(n.id);
            if (existing) {
              const existingClean = stripNodeCallbacks(existing.data);
              return {
                ...existing,
                ...n,
                type: nodeType,
                data: {
                  ...existingClean,
                  ...cleanData,
                  style: cleanData?.style || existingClean?.style,
                },
              };
            }
            return { ...n, type: nodeType, data: cleanData };
          });
        });
        setEdges(visualData!.edges || []);
        lastAppliedVisualHashRef.current = visualHash;
        lastSyntaxHashRef.current = visualHash;
      } else if (syntaxChanged) {
        // Re-parse from syntax text. Preserve existing positions and styles.
        setNodes((prevNodes: Node[]) => {
          const existingNodes = new Map<string, Node>(prevNodes.map(n => [n.id, n]));
          const positions = new Map<string, { x: number; y: number }>(prevNodes.map(n => [n.id, n.position]));

          return graph.nodes.map(n => {
            const prevPos = positions.get(n.id);
            const existing = existingNodes.get(n.id);
            const cleanData = stripNodeCallbacks(n.data);
            // Preserve node type — use encoded type from syntax first, then existing node type
            const nodeType = n.type || (cleanData?.shape ? 'resizableShape' : (existing?.type || 'diagramNode'));

            if (existing) {
              const existingClean = stripNodeCallbacks(existing.data);
              return {
                ...existing,
                ...n,
                type: nodeType,
                position: prevPos || n.position,
                data: {
                  ...existingClean,
                  ...cleanData,
                  style: cleanData?.style || existingClean?.style,
                },
              };
            }

            return { ...n, type: nodeType, data: cleanData, position: prevPos || n.position };
          });
        });
        setEdges(graph.edges);
        lastSyntaxHashRef.current = syntaxHash;
        lastAppliedVisualHashRef.current = visualHash;
        if (reactFlowInstance && graph.nodes.length > 0) {
          setTimeout(() => reactFlowInstance.fitView({ padding: 0.2, duration: 300 }), 50);
        }
        onGraphChange?.(graph);
      }
    } catch (err) {
      console.error('Error in parsing:', err);
    }

    window.setTimeout(() => {
      isParsingRef.current = false;
      isInternalChangeRef.current = false;
    }, 100);
  }, 0);

    return () => {
      window.clearTimeout(t);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syntaxHash, visualHash, onGraphChange, reactFlowInstance]);

  const onConnect = useCallback(
    (params: Connection) => {
      onCanvasUserGesture?.();
      const sideFromHandle = (h: string | null | undefined): Position | null => {
        const v = String(h || '').toLowerCase();
        if (v.includes('top')) return Position.Top;
        if (v.includes('bottom')) return Position.Bottom;
        if (v.includes('left')) return Position.Left;
        if (v.includes('right')) return Position.Right;
        return null;
      };
      const src = nodes.find((n) => n.id === params.source);
      const tgt = nodes.find((n) => n.id === params.target);
      const srcCx = src ? src.position.x + Number((src as any).width || (src.data as any)?.style?.width || 160) / 2 : 0;
      const srcCy = src ? src.position.y + Number((src as any).height || (src.data as any)?.style?.height || 52) / 2 : 0;
      const tgtCx = tgt ? tgt.position.x + Number((tgt as any).width || (tgt.data as any)?.style?.width || 160) / 2 : 0;
      const tgtCy = tgt ? tgt.position.y + Number((tgt as any).height || (tgt.data as any)?.style?.height || 52) / 2 : 0;
      const dx = tgtCx - srcCx;
      const dy = tgtCy - srcCy;
      const sourceFromHandle = sideFromHandle(params.sourceHandle);
      const targetFromHandle = sideFromHandle(params.targetHandle);
      const useVertical = Math.abs(dy) > Math.abs(dx);
      const sourcePosition =
        sourceFromHandle ??
        (useVertical ? (dy >= 0 ? Position.Bottom : Position.Top) : dx >= 0 ? Position.Right : Position.Left);
      const targetPosition =
        targetFromHandle ??
        (useVertical ? (dy >= 0 ? Position.Top : Position.Bottom) : dx >= 0 ? Position.Left : Position.Right);
      
      const edgeId = `e-${params.source}-${params.target}-${Date.now()}`;
      const newEdge: any = {
        ...params,
        id: edgeId,
        type: 'smoothstep',
        sourcePosition,
        targetPosition,
        style: { stroke: EDGE_STROKE, strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: EDGE_STROKE, width: 18, height: 18 },
      };
      setEdges((eds: Edge[]) =>
        addEdge(newEdge, eds)
      );
    },
    [setEdges, onCanvasUserGesture, nodes]
  );

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChangeInternal(changes);
      if (onNodesChange) {
        onNodesChange(nodes);
      }
    },
    [onNodesChangeInternal, onNodesChange, nodes]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChangeInternal(changes);
      if (onEdgesChange) {
        onEdgesChange(edges);
      }
    },
    [onEdgesChangeInternal, onEdgesChange, edges]
  );

  // Handle dimension changes from ResizableShapeNode.
  // NOTE: Do NOT call onUserGraphChange here — the useEffect([nodes,edges]) already does it.
  const handleNodeDimensionsChange = useCallback(
    (nodeId: string, width: number, height: number) => {
      setNodes((prevNodes) =>
        prevNodes.map((n) => {
          if (n.id !== nodeId) return n;
          // CRITICAL: Preserve node type when updating dimensions
          const nodeType = n.type || (n.data?.shape ? 'resizableShape' : 'diagramNode');
          return { ...n, type: nodeType, width, height };
        })
      );
    },
    [setNodes]
  );

  // Stable refs so that nodesForReactFlow memo can always reference latest callbacks
  // without causing the memo to invalidate on every render.
  const handleNodeDimensionsChangeRef = useRef(handleNodeDimensionsChange);
  useEffect(() => { handleNodeDimensionsChangeRef.current = handleNodeDimensionsChange; }, [handleNodeDimensionsChange]);

  // Handle label changes from ResizableShapeNode.
  const handleNodeLabelChange = useCallback(
    (nodeId: string, newLabel: string) => {
      setNodes((prevNodes) =>
        prevNodes.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, label: newLabel } } : n
        )
      );
      onCanvasUserGesture?.();
    },
    [setNodes, onCanvasUserGesture]
  );

  const handleNodeLabelChangeRef = useRef(handleNodeLabelChange);
  useEffect(() => { handleNodeLabelChangeRef.current = handleNodeLabelChange; }, [handleNodeLabelChange]);

  // Inject fresh callbacks into resizable shape nodes on every render.
  // This is the ONLY place callbacks live — never stored permanently in node data.
  const nodesForReactFlow = useMemo(() =>
    nodes.map((n) => {
      if (n.type !== 'resizableShape') return n;
      return {
        ...n,
        data: {
          ...n.data,
          onDimensionsChange: (id: string, w: number, h: number) =>
            handleNodeDimensionsChangeRef.current(id, w, h),
          onLabelChange: (id: string, label: string) =>
            handleNodeLabelChangeRef.current(id, label),
        },
      };
    }),
    [nodes]
  );

  const relayNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (
        (changes.some((c) => c.type === 'remove') || changes.some((c) => c.type === 'position')) &&
        !isParsingRef.current &&
        !isInternalChangeRef.current
      ) {
        onCanvasUserGesture?.();
      }

      handleNodesChange(changes);
    },
    [handleNodesChange, onCanvasUserGesture]
  );

  const relayEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      if (
        changes.some((c) => c.type === 'remove') &&
        !isParsingRef.current &&
        !isInternalChangeRef.current
      ) {
        onCanvasUserGesture?.();
      }
      handleEdgesChange(changes);
    },
    [handleEdgesChange, onCanvasUserGesture]
  );

  const handleSelectionChange = useCallback(
    (p: OnSelectionChangeParams) => {
      const firstNode = p.nodes[0];
      const firstEdge = p.edges[0];
      setSelectedNodeId(firstNode?.id ?? null);
      onSelectionChange?.({
        nodeId: firstNode?.id ?? null,
        edgeId: firstEdge?.id ?? null,
        nodeIds: p.nodes.map((n) => n.id),
        edgeIds: p.edges.map((e) => e.id),
        selectedNode: firstNode ?? null,
        selectedEdge: firstEdge ?? null,
      });
    },
    [onSelectionChange]
  );

  // Notify parent whenever the graph changes.
  // Throttled user-sync ensures Figma-like responsiveness during drag.
  useEffect(() => {
    const graph = { nodes, edges };
    onGraphChange?.(graph);

    // Safety: only notify parent of "user changes" if we aren't currently 
    // applying a structural change from the props (syntax parse or visualData update).
    if (isParsingRef.current || isInternalChangeRef.current) return;

    if (syncTimeoutRef.current) window.clearTimeout(syncTimeoutRef.current);

    const now = Date.now();
    const elapsed = now - lastSyncTimeRef.current;
    const throttleMs = 28; // ~35fps for snappier multi-user canvas sync

    if (elapsed >= throttleMs) {
      onUserGraphChange?.(graph);
      lastSyncTimeRef.current = now;
    } else {
      syncTimeoutRef.current = window.setTimeout(() => {
        onUserGraphChange?.(graph);
        lastSyncTimeRef.current = Date.now();
      }, throttleMs - elapsed);
    }

    return () => {
      if (syncTimeoutRef.current) window.clearTimeout(syncTimeoutRef.current);
    };
  }, [nodes, edges, onGraphChange, onUserGraphChange]);

  const pushHistorySnapshot = useCallback(() => {
    if (suppressHistoryRef.current) return;
    if (isParsingRef.current) return;
    if (graphHash === lastHistoryHashRef.current) return;

    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    }

    historyRef.current.push({
      nodes: nodes.map((n) => ({ ...n, data: { ...(n.data as any) } })),
      edges: edges.map((e) => ({ ...e })),
    });
    historyIndexRef.current = historyRef.current.length - 1;
    lastHistoryHashRef.current = graphHash;

    if (historyRef.current.length > 50) {
      historyRef.current.shift();
      historyIndexRef.current = historyRef.current.length - 1;
    }
  }, [edges, graphHash, nodes]);

  useEffect(() => {
    if (isParsingRef.current || suppressHistoryRef.current) return;
    if (!nodes.length && !edges.length) return;
    if (pushTimeoutRef.current) window.clearTimeout(pushTimeoutRef.current);
    pushTimeoutRef.current = window.setTimeout(() => {
      pushHistorySnapshot();
    }, 350);

    return () => {
      if (pushTimeoutRef.current) window.clearTimeout(pushTimeoutRef.current);
    };
  }, [nodes, edges, pushHistorySnapshot]);

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    const snap = historyRef.current[historyIndexRef.current];
    if (!snap) return;
    suppressHistoryRef.current = true;
    setNodes(snap.nodes.map((n) => ({ ...n, data: { ...(n.data as any) } })));
    setEdges(snap.edges.map((e) => ({ ...e })));
    lastHistoryHashRef.current = null;
    window.setTimeout(() => {
      suppressHistoryRef.current = false;
    }, 0);
  }, [setEdges, setNodes]);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    const snap = historyRef.current[historyIndexRef.current];
    if (!snap) return;
    suppressHistoryRef.current = true;
    setNodes(snap.nodes.map((n) => ({ ...n, data: { ...(n.data as any) } })));
    setEdges(snap.edges.map((e) => ({ ...e })));
    lastHistoryHashRef.current = null;
    window.setTimeout(() => {
      suppressHistoryRef.current = false;
    }, 0);
  }, [setEdges, setNodes]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const target = e.target as unknown as globalThis.Node;
      if (!el.contains(target)) return;
      if (!(e.ctrlKey || e.metaKey)) return;

      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((key === 'z' && e.shiftKey) || key === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    
    // Paste handler for images
    const handlePaste = (e: ClipboardEvent) => {
      const el = containerRef.current;
      if (!el || !reactFlowInstance) return;
      
      // Check if paste is within canvas
      const target = e.target as HTMLElement;
      if (!el.contains(target)) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const blob = item.getAsFile();
          if (!blob) continue;

          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            if (!dataUrl) return;

            // Get center of current viewport
            const { x, y, zoom } = reactFlowInstance.getViewport();
            const rect = el.getBoundingClientRect();
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const pos = reactFlowInstance.screenToFlowPosition({
              x: centerX,
              y: centerY,
            });

            const newNode: Node = {
              id: `img-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
              type: 'image',
              position: pos,
              data: {
                src: dataUrl,
                alt: 'Pasted image',
              },
              style: { width: 200, height: 150 },
            };

            setNodes((nds) => [...nds, newNode]);
            onCanvasUserGesture?.();
          };
          reader.readAsDataURL(blob);
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    
    // Listen for delete node events from ImageNode
    const handleDeleteNode = (e: CustomEvent<{ nodeId: string }>) => {
      const { nodeId } = e.detail;
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      onCanvasUserGesture?.();
    };
    window.addEventListener('deleteNode', handleDeleteNode as EventListener);
    
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('paste', handlePaste);
      window.removeEventListener('deleteNode', handleDeleteNode as EventListener);
    };
  }, [redo, undo, reactFlowInstance, setNodes, onCanvasUserGesture]);

  const autoLayout = useCallback(() => {
    if (!nodes.length) return;
    onCanvasUserGesture?.();

    const incoming = new Map<string, number>();
    nodes.forEach((n) => incoming.set(n.id, 0));
    edges.forEach((e) => incoming.set(e.target, (incoming.get(e.target) ?? 0) + 1));

    const roots = nodes.filter((n) => (incoming.get(n.id) ?? 0) === 0);
    if (roots.length === 0) roots.push(nodes[0]);

    const adj = new Map<string, string[]>();
    nodes.forEach((n) => adj.set(n.id, []));
    edges.forEach((e) => adj.set(e.source, [...(adj.get(e.source) ?? []), e.target]));

    const depth = new Map<string, number>();
    const visit = (id: string, d: number) => {
      depth.set(id, Math.max(depth.get(id) ?? 0, d));
      ; (adj.get(id) ?? []).forEach((next) => visit(next, d + 1));
    };

    roots.forEach((r) => visit(r.id, 0));

    const levels = new Map<number, Node[]>();
    nodes.forEach((n) => {
      const d = depth.get(n.id) ?? 0;
      const arr = levels.get(d) ?? [];
      arr.push(n);
      levels.set(d, arr);
    });

    const sortedLevels = Array.from(levels.keys()).sort((a, b) => a - b);
    const cellX = 280;
    const cellY = 180;

    const nextNodes = nodes.map((n) => ({ ...n, position: { ...n.position } }));
    sortedLevels.forEach((levelIndex, i) => {
      const list = levels.get(levelIndex) ?? [];
      list
        .slice()
        .sort((a, b) =>
          String((a.data as any)?.label ?? a.id).localeCompare(String((b.data as any)?.label ?? b.id))
        )
        .forEach((node, idx) => {
          const target = nextNodes.find((x) => x.id === node.id);
          if (!target) return;
          target.position = { x: i * cellX + 80, y: idx * cellY + 60 };
        });
    });

    suppressHistoryRef.current = false;
    setNodes(nextNodes);
    setTimeout(() => {
      reactFlowInstance?.fitView({ padding: 0.2, duration: 800 });
    }, 100);
  }, [edges, nodes, reactFlowInstance, setNodes, onCanvasUserGesture]);

  const rulerTicks = Array.from({ length: 24 }, (_, i) => i * 40);
  const handleDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      console.log('[Canvas] Drop event received');
      
      const raw = event.dataTransfer.getData('application/x-diagram-snippet');
      console.log('[Canvas] Drop data:', raw);
      
      if (!raw) {
        console.warn('[Canvas] No drop data received');
        return;
      }
      if (!reactFlowInstance) {
        console.warn('[Canvas] ReactFlow instance not ready');
        return;
      }

      try {
        onCanvasUserGesture?.();
        const payload = JSON.parse(raw) as { kind?: string; label?: string; snippet?: string; color?: string; icon?: string; id?: string; shape?: string; width?: number; height?: number; fillColor?: string; strokeColor?: string };
        console.log('[Canvas] Parsed payload:', payload);
        
        const pos = reactFlowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });
        console.log('[Canvas] Drop position:', pos);

        // Use the snippet system to handle complex items (like mini flows)
        const subgraph = parseSyntaxToGraph(payload.snippet || '');
        console.log('[Canvas] Parsed subgraph:', subgraph);
        
        if (subgraph.nodes.length > 0) {
          // Offset the subgraph to drop position
          const minX = Math.min(...subgraph.nodes.map(n => n.position.x));
          const minY = Math.min(...subgraph.nodes.map(n => n.position.y));

          const newNodes = subgraph.nodes.map(n => ({
            ...n,
            id: `n-${Date.now()}-${slugifyId(n.id)}-${Math.random().toString(16).slice(2, 5)}`,
            position: {
              x: (n.position.x - minX) + pos.x,
              y: (n.position.y - minY) + pos.y
            }
          }));

          // Re-map edges for the new node IDs
          const idMap = new Map(subgraph.nodes.map((n, i) => [n.id, newNodes[i].id]));
          const newEdges = subgraph.edges.map(e => ({
            ...e,
            id: `e-${idMap.get(e.source)}-${idMap.get(e.target)}-${Date.now()}`,
            source: idMap.get(e.source)!,
            target: idMap.get(e.target)!
          }));

          setNodes((nds: Node[]) => [...nds, ...newNodes]);
          setEdges((eds: Edge[]) => [...eds, ...newEdges]);
        } else {
          // Individual node fallback
          console.log('[Canvas] Using individual node fallback, kind:', payload.kind);
          const k = payload.kind;
          const kind =
            k === 'decision' ||
            k === 'startend' ||
            k === 'database' ||
            k === 'entity' ||
            k === 'actor' ||
            k === 'queue' ||
            k === 'io'
              ? k
              : 'node';
          // Get default label for resizable shapes - capitalize first letter
          const shapeDefault = payload.shape 
            ? payload.shape.charAt(0).toUpperCase() + payload.shape.slice(1)
            : 'Shape';
          const label = payload.kind === 'resizableShape' 
            ? (payload.label || shapeDefault)
            : String(payload.label || 'Node');
          const id = `n-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
          
          // Handle resizable shapes
          if (payload.kind === 'resizableShape') {
            const shape = payload.shape || 'rectangle';
            const width = payload.width || 120;
            const height = payload.height || 80;
            const newNode: Node = {
              id,
              type: 'resizableShape',
              position: pos,
              width,
              height,
              data: {
                // NOTE: Do NOT put onDimensionsChange/onLabelChange here.
                // nodesForReactFlow memo injects fresh callbacks on every render.
                label,
                shape,
                style: {
                  fillColor: payload.fillColor || '#ffffff',
                  strokeColor: payload.strokeColor || '#000000',
                  strokeWidth: 2,
                  fontSize: 14,
                  color: '#000000',
                },
              },
            };
            onCanvasUserGesture?.();
            setNodes((nds: Node[]) => [...nds, newNode]);
            return;
          }

          // Determine fill color from palette color or use default
          const getCategoryFillColor = (catColor?: string) => {
            if (!catColor) return '#27272a';
            // Map palette colors to fill colors
            const colorMap: Record<string, string> = {
              '#3b82f6': '#1e3a5f', // Blue
              '#10b981': '#1e3a2f', // Green  
              '#ef4444': '#3d1f1f', // Red
              '#8b5cf6': '#2d1f3f', // Purple
              '#f59e0b': '#3d2a0f', // Amber
              '#0ea5e9': '#1e2d4a', // Sky
              '#ec4899': '#3d1f2f', // Pink
              '#22c55e': '#1e3a2f', // Green
            };
            return colorMap[catColor] || catColor;
          };
          
          const fillColor = getCategoryFillColor(payload.color);
          const strokeColor = payload.color || '#ffffff';
          
          const newNode: Node = {
            id,
            type: 'diagramNode',
            position: pos,
            data: { 
              label, 
              kind,
              icon: payload.icon || payload.id, // Store icon for display
              style: {
                fillColor: fillColor,
                strokeColor: strokeColor,
                strokeWidth: 2,
                fontSize: 12,
                color: '#ffffff',
                iconColor: strokeColor
              }
            },
          };
          console.log('[Canvas] Creating new node:', newNode);
          setNodes((nds: Node[]) => {
            const updated = [...nds, newNode];
            console.log('[Canvas] Node added, total nodes:', updated.length);
            return updated;
          });
        }
      } catch (err) {
        console.error('[Canvas] Drop handling failed:', err);
      }
    },
    [reactFlowInstance, setNodes, setEdges, onCanvasUserGesture, handleNodeDimensionsChange, handleNodeLabelChange, onUserGraphChange]
  );

  const confirmAddNode = useCallback(() => {
    if (!pendingAddPosition) return;
    onCanvasUserGesture?.();
    const label = addNodeLabel.trim() || 'Node';
    const id = `n-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const newNode: Node = {
      id,
      type: 'diagramNode',
      position: pendingAddPosition,
      data: { 
        label, 
        kind: addNodeKind,
        style: {
          fillColor: '#27272a',
          strokeColor: '#ffffff',
          strokeWidth: 2,
          fontSize: 12,
          color: '#ffffff'
        }
      },
    };
    suppressHistoryRef.current = false;
    setNodes((nds: Node[]) => [...nds, newNode]);
    setIsAddNodeOpen(false);
    setAddNodeLabel('Node');
    setAddNodeKind('node');
    setPendingAddPosition(null);
  }, [pendingAddPosition, addNodeLabel, addNodeKind, setNodes, onCanvasUserGesture]);

  const confirmRenameNode = useCallback(() => {
    const next = renameNodeLabel.trim();
    if (!renameNodeId) return;
    onCanvasUserGesture?.();
    setNodes((nds: Node[]) =>
      nds.map((n: Node) =>
        n.id === renameNodeId ? { ...n, data: { ...(n.data as any), label: next } } : n
      )
    );
    setIsRenameNodeOpen(false);
    setRenameNodeId(null);
    setRenameNodeLabel('');
  }, [renameNodeId, renameNodeLabel, setNodes, onCanvasUserGesture]);

  const onQuickAdd = useCallback((direction: 'top' | 'right' | 'bottom' | 'left') => {
    if (!selectedNodeId) return;
    onCanvasUserGesture?.();
    const parent = nodes.find(n => n.id === selectedNodeId);
    if (!parent) return;

    const style = getNodeStyle(parent.data, (parent.data as any)?.kind || 'node');
    const spacing = 120;

    let nextPos = { ...parent.position };
    if (direction === 'top') nextPos.y -= (style.height + spacing);
    if (direction === 'bottom') nextPos.y += (style.height + spacing);
    if (direction === 'left') nextPos.x -= (style.width + spacing);
    if (direction === 'right') nextPos.x += (style.width + spacing);

    const id = `n-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
    const parentStyle = (parent.data as any)?.style;
    const newNode: Node = {
      id,
      type: 'diagramNode',
      position: nextPos,
      data: { 
        label: 'New Step', 
        kind: (parent.data as any)?.kind || 'node',
        style: parentStyle ? { ...parentStyle } : {
          fillColor: '#27272a',
          strokeColor: '#ffffff',
          strokeWidth: 2,
          fontSize: 12,
          color: '#ffffff'
        }
      },
    };

    const edgeId = `e-${parent.id}-${id}-${Date.now()}`;
    const newEdge: Edge = {
      id: edgeId,
      source: parent.id,
      target: id,
      type: 'smoothstep',
      style: { stroke: EDGE_STROKE, strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: EDGE_STROKE, width: 18, height: 18 },
    };

    setNodes((nds: Node[]) => [...nds, newNode]);
    setEdges((eds: Edge[]) => [...eds, newEdge]);

    setTimeout(() => setSelectedNodeId(id), 50);
  }, [selectedNodeId, nodes, setNodes, setEdges, onCanvasUserGesture]);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className="h-full w-full relative flex flex-col outline-none overflow-hidden transition-colors duration-300"
      style={{ backgroundColor: paperColor || 'var(--color-background)' }}
    >
      {/* Ruler Horizontal */}
      {showRuler && !isExportingSnapshot && (
        <div className="absolute top-[36px] left-[36px] right-0 h-9 bg-card/40 border-b border-border/40 backdrop-blur-md z-[50] flex items-center overflow-hidden pointer-events-none select-none">
          <div
            className="flex h-full"
            style={{
              transform: `translateX(${viewport.x}px)`,
              width: '10000px',
            }}
          >
            {Array.from({ length: 200 }).map((_, i) => (
              <div
                key={i}
                className="shrink-0 flex flex-col justify-end border-l border-border/30 pb-1"
                style={{ width: 40 * viewport.zoom }}
              >
                <span className="text-[8px] font-mono text-muted-foreground/50 pl-1">
                  {i * 40}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ruler Vertical */}
      {showRuler && !isExportingSnapshot && (
        <div className="absolute top-[72px] left-0 bottom-0 w-9 bg-card/40 border-r border-border/40 backdrop-blur-md z-[50] flex flex-col overflow-hidden pointer-events-none select-none">
          <div
            className="flex flex-col"
            style={{
              transform: `translateY(${viewport.y}px)`,
              height: '10000px',
            }}
          >
            {Array.from({ length: 200 }).map((_, i) => (
              <div
                key={i}
                className="shrink-0 flex items-end justify-end border-t border-border/30 pr-1"
                style={{ height: 40 * viewport.zoom }}
              >
                <span className="text-[8px] font-mono text-muted-foreground/50 [writing-mode:vertical-rl] rotate-180">
                  {i * 40}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={cn(PANEL_MUTED, 'export-ignore', 'z-[60]')}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Live Canvas</span>
        </div>
        <span className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSnapToGrid((v) => !v)}
            className={cn(
              "px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider transition-all",
              snapToGrid
                ? 'bg-primary/20 border-primary/40 text-primary shadow-[0_0_12px_rgba(var(--color-primary),0.2)]'
                : 'bg-background/40 border-border/60 text-muted-foreground hover:border-border hover:text-foreground'
            )}
          >
            Snap {snapToGrid ? 'On' : 'Off'}
          </button>
          <button
            type="button"
            onClick={() => autoLayout()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 bg-background/40 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:border-border hover:text-foreground transition-all hover:bg-background/60"
          >
            <Maximize2 className="w-3 h-3" />
            Auto Layout
          </button>
        </span>
      </div>

      <div className="flex-1 relative w-full h-full overflow-hidden group/canvas">
        <ReactFlow
          style={{ width: '100%', height: '100%' }}
          nodes={nodesForReactFlow}
          edges={edges}
          onNodesChange={relayNodesChange}
          onEdgesChange={relayEdgesChange}
          onConnect={onConnect}
          onNodeDragStart={() => onCanvasUserGesture?.()}
          onInit={setReactFlowInstance}
          nodeTypes={nodeTypes}
          onSelectionChange={handleSelectionChange}
          snapToGrid={snapToGrid}
          snapGrid={[20, 20]}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          panOnDrag={true}
          selectionOnDrag={false}
          panOnScroll={false}
          zoomOnScroll={true}
          fitView
          minZoom={0.02}
          maxZoom={2}
          connectionMode={ConnectionMode.Loose}
          multiSelectionKeyCode="Control"
          deleteKeyCode={['Delete', 'Backspace']}
          className="bg-transparent"
          onPaneContextMenu={(e: React.MouseEvent) => {
            e.preventDefault();
            if (!reactFlowInstance) return;
            const pos = reactFlowInstance.screenToFlowPosition({ x: e.clientX, y: e.clientY });
            setPendingAddPosition(pos);
            setAddNodeLabel('Node');
            setAddNodeKind('node');
            setIsAddNodeOpen(true);
          }}
          onNodeDoubleClick={(e: React.MouseEvent, node: Node) => {
            e.preventDefault();
            setRenameNodeId(node.id);
            setRenameNodeLabel(String((node.data as any)?.label ?? node.id));
            setIsRenameNodeOpen(true);
          }}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{
            type: 'smoothstep',
            style: { stroke: EDGE_STROKE, strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: EDGE_STROKE, width: 18, height: 18 },
          }}
          onMove={(_event: MouseEvent | TouchEvent, vp: Viewport) => setViewport(vp)}
          onMoveEnd={(_event: MouseEvent | TouchEvent, vp: Viewport) => setViewport(vp)}
        >
          {showGrid && (
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="var(--color-border)"
              className="opacity-40"
            />
          )}
          {nodes.length === 0 && edges.length === 0 && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-10 p-6">
              <div className="max-w-[320px] w-full rounded-2xl border border-border/50 bg-card/90 backdrop-blur-md p-6 text-center shadow-xl">
                <div className="relative mx-auto w-12 h-12 mb-4">
                  <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse" />
                  <div className="relative w-full h-full rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 text-primary" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="8" width="7" height="5" rx="1" />
                      <rect x="14" y="3" width="7" height="5" rx="1" />
                      <rect x="14" y="14" width="7" height="5" rx="1" />
                      <path d="M10 10.5h2l2-6" />
                      <path d="M10 10.5h2l2 6" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Canvas is empty</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Start typing in the code editor, or right-click to add elements
                </p>
                <div className="text-left bg-muted/50 border border-border/30 rounded-lg p-2.5 font-mono text-[10px] text-muted-foreground">
                  <div className="text-primary">[Start]</div>
                  <div>{'--> [Process]'}</div>
                  <div>{'[Process] --> {Decision}'}</div>
                </div>
              </div>
            </div>
          )}

          {!isExportingSnapshot && selectedNodeId && interactionMode === 'select' && (
            <QuickAddHandles
              node={nodes.find((n) => n.id === selectedNodeId)}
              zoom={viewport.zoom}
              viewport={viewport}
              onAdd={onQuickAdd}
            />
          )}

          {/* Floating Controls Overlay */}
          {!isExportingSnapshot && <div ref={floatingBarRef} className="export-ignore absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-50 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Tool Picker */}
            <div className="flex items-center gap-1 p-1.5 rounded-2xl bg-card/60 border border-border/40 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              <button
                type="button"
                onClick={() => setInteractionMode('select')}
                className={cn(
                  "p-2.5 rounded-xl transition-all duration-300",
                  interactionMode === 'select'
                    ? "bg-primary text-white shadow-[0_0_15px_rgba(var(--color-primary),0.4)] scale-110"
                    : "text-muted-foreground/60 hover:text-primary hover:bg-primary/10"
                )}
                title="Select Tool (V)"
              >
                <MousePointer2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setInteractionMode('pan')}
                className={cn(
                  "p-2.5 rounded-xl transition-all duration-300",
                  interactionMode === 'pan'
                    ? "bg-primary text-white shadow-[0_0_15px_rgba(var(--color-primary),0.4)] scale-110"
                    : "text-muted-foreground/60 hover:text-primary hover:bg-primary/10"
                )}
                title="Pan Tool (H)"
              >
                <Hand className="w-4 h-4" />
              </button>
            </div>

            {/* Zoom & View Controls */}
            <div className="flex items-center gap-1 p-1.5 rounded-2xl bg-card/60 border border-border/40 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              <button
                onClick={() => reactFlowInstance?.zoomOut()}
                className="p-2 rounded-xl text-muted-foreground/60 hover:text-primary hover:bg-primary/10 transition-all"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <div className="px-3 text-[11px] font-black tabular-nums text-foreground/80 min-w-[3.5rem] text-center tracking-tighter">
                {Math.round(viewport.zoom * 100)}%
              </div>
              <button
                onClick={() => reactFlowInstance?.zoomIn()}
                className="p-2 rounded-xl text-muted-foreground/60 hover:text-primary hover:bg-primary/10 transition-all"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="w-px h-5 bg-border/40 mx-1" />
              <button
                onClick={() => reactFlowInstance?.fitView({ duration: 800 })}
                className="p-2 rounded-xl text-muted-foreground/60 hover:text-primary hover:bg-primary/10 transition-all"
                title="Fit View"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>}

          {!isExportingSnapshot && <MiniMap
            className="export-ignore"
            style={{
              backgroundColor: 'var(--color-card)',
              borderRadius: '1.25rem',
              border: '1px solid var(--color-border)',
              overflow: 'hidden',
              bottom: 24,
              right: 24,
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              width: 140,
              height: 100
            }}
            maskColor="rgba(0,0,0,0.3)"
            nodeColor={(n: Node) => (n.data as any)?.style?.fillColor || 'var(--color-primary)'}
            nodeStrokeWidth={3}
            zoomable
            pannable
          />}
        </ReactFlow>
      </div>

      <Modal isOpen={isAddNodeOpen} onClose={() => setIsAddNodeOpen(false)} title="Create New Element" size="sm">
        <div className="space-y-6 pt-2">
          <div className="space-y-2.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-primary">Label / Text</label>
            <textarea
              value={addNodeLabel}
              onChange={(e) => setAddNodeLabel(e.target.value)}
              className="w-full rounded-2xl border border-border/60 bg-background/40 px-5 py-3 text-sm outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/40 transition-all font-medium min-h-[100px] resize-y"
              autoFocus
              placeholder="Enter element name. Use new lines for Entity fields..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) confirmAddNode();
              }}
            />
            <p className="text-[9px] text-muted-foreground/50 italic px-2 pt-1">
              Tip: Press <kbd className="bg-muted px-1 rounded">Cmd/Ctrl + Enter</kbd> to save. Multi-line is supported!
            </p>
          </div>
          <div className="space-y-2.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-primary">Shape Kind</label>
            <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
              {(
                [
                  ['node', 'Process'],
                  ['decision', 'Decision'],
                  ['startend', 'Terminal'],
                  ['database', 'Database'],
                  ['entity', 'Entity'],
                  ['actor', 'Actor'],
                  ['queue', 'Queue'],
                  ['io', 'Data I/O'],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setAddNodeKind(k)}
                  className={cn(
                    'px-2 py-2.5 rounded-xl border-2 text-[10px] font-black uppercase tracking-tighter transition-all duration-300',
                    addNodeKind === k
                      ? 'bg-primary/15 border-primary text-primary shadow-[0_0_20px_rgba(var(--color-primary),0.1)]'
                      : 'border-border/40 bg-background/20 text-muted-foreground/60 hover:border-border hover:bg-background/40'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsAddNodeOpen(false)} className="flex-1 rounded-2xl h-12 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">Cancel</Button>
            <Button onClick={confirmAddNode} className="flex-1 rounded-2xl h-12 text-[11px] font-bold uppercase tracking-widest shadow-[0_12px_24px_-8px_rgba(var(--color-primary),0.4)]">Create Element</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isRenameNodeOpen} onClose={() => setIsRenameNodeOpen(false)} title="Update Label" size="sm">
        <div className="space-y-6 pt-2">
          <div className="space-y-2.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-primary">New Label</label>
            <textarea
              value={renameNodeLabel}
              onChange={(e) => setRenameNodeLabel(e.target.value)}
              className="w-full rounded-2xl border border-border/60 bg-background/40 px-5 py-3 text-sm outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/40 transition-all font-medium min-h-[140px] resize-y font-mono whitespace-pre"
              autoFocus
              placeholder="Update text... For Entities, use newlines to define columns."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) confirmRenameNode();
              }}
            />
            <p className="text-[9px] text-muted-foreground/50 italic px-2 pt-1">
              Tip: Press <kbd className="bg-muted px-1 rounded">Cmd/Ctrl + Enter</kbd> to apply.
            </p>
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsRenameNodeOpen(false)} className="flex-1 rounded-2xl h-12 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">Dismiss</Button>
            <Button onClick={confirmRenameNode} className="flex-1 rounded-2xl h-12 text-[11px] font-bold uppercase tracking-widest shadow-[0_12px_24px_-8px_rgba(var(--color-primary),0.4)]">Apply Change</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/**
 * Public export Ã¢â‚¬â€ wraps the inner canvas in ReactFlowProvider so callers
 * don't need to manage the provider themselves. This fixes the
 * "[React Flow]: Seems like you have not used zustand provider" error.
 */
export function DiagramCanvas(props: DiagramCanvasProps) {
  return (
    <ReactFlowProvider>
      <DiagramCanvasInner {...props} />
    </ReactFlowProvider>
  );
}


function slugifyId(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[\s]+/g, '-')
    .replace(/[^a-z0-9-_]/g, '');
}

function unwrapNodeRef(raw: string): { label: string; kind: string; shape?: string; width?: number; height?: number } {
  const s = raw.trim();
  
  // Guard against empty or invalid input
  if (!s || s === '[]' || s === '{}' || s === '()') {
    return { label: 'Node', kind: 'node' };
  }
  
  // Explicit kind with :: prefix
  const kindMatch = s.match(/^(.*)::(node|decision|startend|database|entity|actor|queue|io)$/i);
  const base = kindMatch ? kindMatch[1].trim() : s;
  const explicitKind = kindMatch ? kindMatch[2].toLowerCase() : '';

  // [[Database]]
  const dbl = base.match(/^\[\[(.*?)\]\]$/);
  if (dbl) return { label: dbl[1].trim() || 'Database', kind: explicitKind || 'database' };

  // [Label|w:X,h:Y,shape:S] — resizable shape syntax.
  // Use non-greedy match for label to handle edge cases
  const pipeMatch = base.match(/^\[([^|\]]*?)\|([^\]]*?)\]$/);
  if (pipeMatch) {
    const label = pipeMatch[1].trim();
    const attrsStr = pipeMatch[2];
    let width: number | undefined;
    let height: number | undefined;
    let shape: string | undefined;
    // Only process attrs if they look valid (contain :)
    if (attrsStr.includes(':')) {
      attrsStr.split(',').forEach(attr => {
        const [k, v] = attr.trim().split(':');
        if (k === 'w' && v && /^\d+$/.test(v)) width = parseInt(v, 10);
        if (k === 'h' && v && /^\d+$/.test(v)) height = parseInt(v, 10);
        if (k === 'shape' && v) shape = v.trim();
      });
    }
    // Ensure we have a valid label, not just attributes
    const finalLabel = label || 'Shape';
    return { label: finalLabel, kind: 'resizableShape', shape: shape || 'rectangle', width, height };
  }

  // [Process] - with better validation
  const square = base.match(/^\[(.*?)\]$/);
  if (square) {
    const content = square[1].trim();
    // Ignore if content looks like malformed attributes (starts with shape:, w:, h:)
    if (content && !content.match(/^(shape|w|h):/)) {
      return { label: content, kind: explicitKind || 'node' };
    }
    // If content is empty or looks like attributes, return default
    return { label: 'Node', kind: explicitKind || 'node' };
  }

  // {Decision}
  const curly = base.match(/^\{(.*)\}$/);
  if (curly) return { label: curly[1], kind: explicitKind || 'decision' };

  // (Terminal)
  const paren = base.match(/^\((.*)\)$/);
  if (paren) return { label: paren[1], kind: explicitKind || 'startend' };

  // ERD / Mermaid specific syntax matches
  // Entity[Label]
  const entityMatch = base.match(/^([a-zA-Z0-9_-]+)\[(.*)\]$/);
  if (entityMatch) return { label: entityMatch[2], kind: explicitKind || 'entity' };

  // Entity{Label}
  const entityCurlyMatch = base.match(/^([a-zA-Z0-9_-]+)\{(.*)\}$/);
  if (entityCurlyMatch) return { label: entityCurlyMatch[2], kind: explicitKind || 'entity' };

  return { label: base, kind: explicitKind || 'node' };
}

function parseSyntaxToGraph(syntax: string): { nodes: Node[]; edges: Edge[] } {
  // Preprocess: split multiple connections on one line (comma-separated)
  const preprocessed = String(syntax || '')
    .split('\n')
    .flatMap((line) => {
      const trimmed = line.trim();
      // If line contains arrows and commas, split by comma
      if (trimmed.includes('-->') && trimmed.includes(',')) {
        return trimmed.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
      }
      return [trimmed];
    })
    .filter((l) => l.length > 0);

  const lines = preprocessed;

  const nodeById = new Map<string, Node>();
  const edges: Edge[] = [];

  /** Arrow patterns: -->, ->, =>, ---, --, -, -.-> */
  const ARROW_REGEX = /\s*(?:-\.-{1,}>|\.->{1,}>|-{2,}>|={1,}>|-{1,}>|---?|--?|==?)\s*/;

  const ensureNode = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return null;

    // Handle ID[Label] or ID(Label) style (Mermaid-ish)
    const idLabelMatch = trimmed.match(/^([a-zA-Z0-9_-]+)\s*[\[\(\{](.*)[\]\)\}]$/);
    let finalId = '';
    let finalLabel = '';
    let finalKind = 'node';

    if (idLabelMatch) {
      finalId = idLabelMatch[1];
      const unwrapped = unwrapNodeRef(trimmed.slice(finalId.length));
      finalLabel = unwrapped.label;
      finalKind = unwrapped.kind;
    } else {
      const unwrapped = unwrapNodeRef(trimmed);
      finalLabel = unwrapped.label;
      finalKind = unwrapped.kind;
      finalId = slugifyId(finalLabel);
    }

    if (nodeById.has(finalId)) {
      return nodeById.get(finalId)!;
    }

    // If it's a resizable shape, create the correct node type
    if (finalKind === 'resizableShape') {
      const unwrappedFull = idLabelMatch
        ? unwrapNodeRef(trimmed.slice(finalId.length))
        : unwrapNodeRef(trimmed);
      const shapeNode: Node = {
        id: finalId,
        type: 'resizableShape',
        position: { x: 0, y: 0 },
        ...(unwrappedFull.width ? { width: unwrappedFull.width } : {}),
        ...(unwrappedFull.height ? { height: unwrappedFull.height } : {}),
        data: {
          label: finalLabel,
          shape: unwrappedFull.shape || 'rectangle',
          style: {
            fillColor: '#ffffff',
            strokeColor: '#000000',
            strokeWidth: 2,
            fontSize: 14,
            color: '#000000',
          },
        },
      };
      nodeById.set(finalId, shapeNode);
      return shapeNode;
    }

    // Determine icon from kind or label
    const getIconFromKind = (k: string, label: string): string => {
      const labelLower = label.toLowerCase();
      // Check label first for specific matches
      if (labelLower.includes('user') || labelLower.includes('actor')) return 'actor';
      if (labelLower.includes('db') || labelLower.includes('database') || labelLower.includes('data')) return 'database';
      if (labelLower.includes('queue') || labelLower.includes('topic')) return 'queue';
      if (labelLower.includes('cache')) return 'cache';
      if (labelLower.includes('service')) return 'service';
      if (labelLower.includes('func') || labelLower.includes('lambda')) return 'function';
      if (labelLower.includes('cdn')) return 'cdn';
      if (labelLower.includes('system')) return 'system';
      // Then check kind
      if (k === 'entity') return 'entity';
      if (k === 'database') return 'database';
      if (k === 'queue') return 'queue';
      if (k === 'actor') return 'actor';
      if (['ui', 'cloud', 'security', 'mobile', 'analytics', 'communication', 'media', 'location'].includes(k)) return k;
      return k;
    };

    const icon = getIconFromKind(finalKind, finalLabel);
    
    const newNode: Node = {
      id: finalId,
      type: 'diagramNode',
      position: { x: 0, y: 0 },
      data: { 
        label: finalLabel, 
        kind: finalKind,
        icon: icon,
        style: {
          fillColor: '#27272a',
          strokeColor: '#ffffff',
          strokeWidth: 2,
          fontSize: 12,
          color: '#ffffff'
        }
      },
    };
    nodeById.set(finalId, newNode);
    return newNode;
  };

  lines.forEach((line, index) => {
    // Skip comments or metadata starting with @ or #
    if (line.startsWith('@') || line.startsWith('#') || line.startsWith('%%')) return;
    const low = line.toLowerCase();
    
    // Mermaid-style flowchart headers
    if (
      low.startsWith('flowchart ') ||
      low === 'flowchart' ||
      low.startsWith('graph ') ||
      low === 'graph' ||
      low.startsWith('subgraph ') ||
      low === 'subgraph' ||
      low === 'end' ||
      low.startsWith('erdiagram') ||
      low.startsWith('classdiagram')
    ) {
      return;
    }

    // Handle image syntax: ![alt](url) or img[url]
    const imageMatch = line.match(/^!\[(.*?)\]\((.+?)\)$/);
    if (imageMatch) {
      const alt = imageMatch[1];
      const url = imageMatch[2];
      const imgNode: Node = {
        id: `img-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
        type: 'image',
        position: { x: 0, y: 0 },
        data: {
          src: url,
          alt: alt || 'Image',
        },
        style: { width: 200, height: 150 },
      };
      nodeById.set(imgNode.id, imgNode);
      return;
    }

    // Handle labeled arrows: From -- label --> To OR From -.-> To (dotted)
    // Check dotted arrows first (more specific)
    const dottedMatch = line.match(/^(.+?)\s+(-\.-{1,}>|\.->{1,}>)\s*(.+)$/);
    if (dottedMatch) {
      const fromNode = ensureNode(dottedMatch[1]);
      const toNode = ensureNode(dottedMatch[3]);
      if (fromNode && toNode) {
        edges.push({
          id: `e-${fromNode.id}-${toNode.id}-${index}`,
          source: fromNode.id,
          target: toNode.id,
          type: 'smoothstep',
          style: { stroke: EDGE_STROKE, strokeWidth: 2, strokeDasharray: '5,5' },
          markerEnd: { type: MarkerType.ArrowClosed, color: EDGE_STROKE, width: 18, height: 18 },
        });
      }
      return;
    }

    // Handle labeled arrows with space separator: From -- label --> To
    // Use negative lookahead (?!-) to exclude lines starting with -.- (dotted arrows)
    const labeledMatch = line.match(/^(.+?)\s+--(?!\s*-)\s+(.+?)\s*(-->|->|=>|---)\s*(.+)$/);
    if (labeledMatch) {
      const fromNode = ensureNode(labeledMatch[1]);
      const edgeLabel = labeledMatch[2].trim();
      const toNode = ensureNode(labeledMatch[4]);

      if (fromNode && toNode) {
        edges.push({
          id: `e-${fromNode.id}-${toNode.id}-${index}`,
          source: fromNode.id,
          target: toNode.id,
          label: edgeLabel,
          type: 'smoothstep',
          style: { stroke: EDGE_STROKE, strokeWidth: 2 },
          labelStyle: { fill: '#000000', fontSize: 11, fontWeight: 700 },
          labelBgStyle: { fill: '#f4e7db', stroke: '#c99367', strokeWidth: 1 },
          labelShowBg: true,
          labelBgPadding: [6, 4],
          markerEnd: { type: MarkerType.ArrowClosed, color: EDGE_STROKE, width: 18, height: 18 },
        });
      }
      return;
    }

    // Handle labeled arrows with pipe: From -->|label| To or From -.->|label| To
    const pipeMatch = line.match(/^(.+?)\s*(?:-\.-{1,}>|\.->{1,}>|-{2,}>|={1,}>|-{1,}>|---)\s*\|(.+?)\|\s*(.+)$/);
    if (pipeMatch) {
      const fromNode = ensureNode(pipeMatch[1]);
      const toNode = ensureNode(pipeMatch[3]);
      const edgeLabel = pipeMatch[2].trim();

      if (fromNode && toNode) {
        edges.push({
          id: `e-${fromNode.id}-${toNode.id}-${index}-p`,
          source: fromNode.id,
          target: toNode.id,
          label: edgeLabel,
          type: 'smoothstep',
          style: { stroke: EDGE_STROKE, strokeWidth: 2 },
          labelStyle: { fill: '#000000', fontSize: 11, fontWeight: 700 },
          labelBgStyle: { fill: '#f4e7db', stroke: '#c99367', strokeWidth: 1 },
          labelShowBg: true,
          labelBgPadding: [6, 4],
          markerEnd: { type: MarkerType.ArrowClosed, color: EDGE_STROKE, width: 18, height: 18 },
        });
      }
      return;
    }

    // Handle simple arrows: From --> To
    const arrowParts = line.split(ARROW_REGEX);
    if (arrowParts.length >= 2) {
      let lastNode = ensureNode(arrowParts[0]);
      for (let i = 1; i < arrowParts.length; i++) {
        const currentNode = ensureNode(arrowParts[i]);
        if (lastNode && currentNode) {
          edges.push({
            id: `e-${lastNode.id}-${currentNode.id}-${index}-${i}`,
            source: lastNode.id,
            target: currentNode.id,
            type: 'smoothstep',
            style: { stroke: EDGE_STROKE, strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: EDGE_STROKE, width: 18, height: 18 },
          });
        }
        lastNode = currentNode;
      }
      return;
    }

    // Standalone node definitions: [Label], {Decision}, etc.
    ensureNode(line);
  });

  const nodes = Array.from(nodeById.values());

  // Automatic Hierarchical Layout (BFS Level Based)
  const incoming = new Map<string, number>();
  nodes.forEach((n) => incoming.set(n.id, 0));
  edges.forEach((e) => incoming.set(e.target, (incoming.get(e.target) ?? 0) + 1));

  const roots = nodes.filter((n) => (incoming.get(n.id) ?? 0) === 0);
  if (roots.length === 0 && nodes.length > 0) roots.push(nodes[0]);

  const adj = new Map<string, string[]>();
  nodes.forEach((n) => adj.set(n.id, []));
  edges.forEach((e) => adj.set(e.source, [...(adj.get(e.source) ?? []), e.target]));

  const depth = new Map<string, number>();
  const visit = (id: string, d: number) => {
    depth.set(id, Math.max(depth.get(id) ?? 0, d));
    ;(adj.get(id) ?? []).forEach((next) => visit(next, d + 1));
  };
  roots.forEach((r) => visit(r.id, 0));

  const levels = new Map<number, Node[]>();
  nodes.forEach((n) => {
    const d = depth.get(n.id) ?? 0;
    const arr = levels.get(d) ?? [];
    arr.push(n);
    levels.set(d, arr);
  });

  const sortedLevels = Array.from(levels.keys()).sort((a, b) => a - b);
  const cellX = 280;
  const cellY = 180;

  sortedLevels.forEach((levelIndex, i) => {
    const list = levels.get(levelIndex) ?? [];
    list
      .slice()
      .sort((a, b) =>
        String((a.data as any)?.label ?? a.id).localeCompare(String((b.data as any)?.label ?? b.id))
      )
      .forEach((node, idx) => {
        node.position = { x: i * cellX + 80, y: idx * cellY + 60 };
      });
  });

  return { nodes, edges };
}
