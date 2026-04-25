import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import gsap from 'gsap';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { ColorPicker } from '../ui/color-picker';
import {
  LayoutGrid,
  MousePointer2,
  Sparkles,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignEndVertical,
  AlignCenterVertical,
  ArrowUp,
  ArrowDown,
  Bold,
  Italic,
  Underline,
  Trash2,
  Copy,
  RotateCcw,
  ChevronsUpDown,
  Palette,
  Frame,
  BarChart,
  Activity,
  Layers,
  Box,
} from 'lucide-react';
import type { Edge, Node } from 'reactflow';
import { cn } from '@/lib/utils';


interface PropertiesPanelProps {
  selectedNode?: Node | null;
  selectedEdge?: Edge | null;
  selectedNodeCount: number;
  selectedEdgeCount: number;
  nodeCount: number;
  edgeCount: number;
  paperColor: string;
  onPaperColorChange: (hex: string) => void;
  showGrid: boolean;
  onShowGridChange: (v: boolean) => void;
  showRuler: boolean;
  onShowRulerChange: (v: boolean) => void;
  onRenameNode: (nextLabel: string) => void;
  onRenameEdge: (nextLabel: string) => void;
  onNodeKindChange: (
    kind: 'node' | 'decision' | 'startend' | 'database' | 'entity' | 'actor' | 'queue' | 'io'
  ) => void;
  onNodeStyleChange: (patch: {
    fillColor?: string;
    strokeColor?: string;
    strokeWidth?: number;
    fontSize?: number;
    fontWeight?: number;
    fontStyle?: 'normal' | 'italic';
    textDecoration?: string;
    textAlign?: 'left' | 'center' | 'right';
    width?: number;
    height?: number;
    fontFamily?: string;
    color?: string;
    borderRadius?: number;
    shape?: 'rectangle' | 'circle' | 'rounded';
  }) => void;
  onEdgeStyleChange: (patch: {
    stroke?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
    labelColor?: string;
    labelFontSize?: number;
    markerEndType?: 'none' | 'arrow' | 'arrowclosed';
  }) => void;
  onDeleteNode: () => void;
  onDeleteEdge: () => void;
  onDuplicateNodes: () => void;
  onResetNodeStyle: () => void;
  onMoveToFront?: () => void;
  onMoveToBack?: () => void;
  onAlign?: (mode: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
}

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Palette presets ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬

const PAPER_PRESETS = ['#09090b', '#f8f4ef', '#eef6ff', '#ffffff', '#e8e4df', '#1a1510', '#120d0a'];
const NODE_FILL_PRESETS = ['#120d0a', '#15100d', '#1e3a2f', '#1e2d4a', '#3d2914', '#f4e7db', '#ffffff', '#c99367'];
const NODE_STROKE_PRESETS = ['#c99367', '#d7a780', '#8f5c38', '#64748b', '#38bdf8', '#a78bfa', '#f4e7db', '#ffffff'];
const NODE_TEXT_PRESETS = ['#000000', '#f4e7db', '#ffffff', '#120d0a', '#c99367', '#94a3b8', '#fde68a'];
const EDGE_LINE_PRESETS = ['#c99367', '#d7a780', '#38bdf8', '#a78bfa', '#34d399', '#f472b6', '#f4e7db', '#64748b'];

const FONT_OPTIONS = [
  { value: 'inherit', label: 'Theme default' },
  { value: 'ui-sans-serif, system-ui, sans-serif', label: 'Sans-Serif' },
  { value: 'ui-serif, Georgia, serif', label: 'Serif' },
  { value: 'ui-monospace, SFMono-Regular, monospace', label: 'Monospace' },
  { value: 'Inter, ui-sans-serif, system-ui, sans-serif', label: 'Inter' },
  { value: '"Segoe UI", Roboto, sans-serif', label: 'Segoe / Roboto' },
];

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Helpers ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬

function hexForPicker(raw: string | undefined, fallback: string): string {
  const s = String(raw || '').trim();
  if (!s || s.startsWith('var(')) return fallback;
  if (/^#[0-9A-Fa-f]{6}$/.test(s)) return s;
  if (/^#[0-9A-Fa-f]{3}$/.test(s)) {
    const a = s.slice(1).split('');
    return `#${a[0]}${a[0]}${a[1]}${a[1]}${a[2]}${a[2]}`;
  }
  return fallback;
}

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Sub-components ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬

function SectionTitle({ children, icon: Icon }: { children: ReactNode; icon?: any }) {
  return (
    <h3 className="flex items-center gap-2 text-[11px] font-semibold text-foreground/60 mb-3 px-1">
      {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground/50" />}
      {children}
    </h3>
  );
}

function InspectorSection({
  title,
  hint,
  icon,
  children,
  className,
}: {
  title: string;
  hint?: string;
  icon?: any;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'space-y-3 border-b border-border/30 pb-5 last:border-0 last:pb-0',
        className
      )}
    >
      <div>
        <SectionTitle icon={icon}>{title}</SectionTitle>
        {hint && (
          <p className="text-[10px] leading-relaxed text-muted-foreground/40 -mt-2 mb-3 px-1">{hint}</p>
        )}
      </div>
      <div className="space-y-3 px-1">{children}</div>
    </section>
  );
}

/** Toggle switch (replaces plain checkbox) */
function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border/40 bg-background/30 px-3.5 py-3 transition-all hover:border-border/70 hover:bg-background/50 group">
      <div>
        <span className="text-xs font-semibold text-foreground/80 group-hover:text-foreground transition-colors">
          {label}
        </span>
        {description && (
          <p className="text-[10px] text-muted-foreground/50 mt-0.5">{description}</p>
        )}
      </div>
      {/* Custom toggle track */}
      <div
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-5 w-9 shrink-0 rounded-full transition-all duration-200',
          checked ? 'bg-primary shadow-inner shadow-primary/40' : 'bg-muted border border-border/60'
        )}
      >
        <div
          className={cn(
            'absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200',
            checked && 'translate-x-4'
          )}
        />
      </div>
    </label>
  );
}

function ColorField({
  label,
  value,
  fallback,
  onChange,
  presets,
  sublabel,
}: {
  label: string;
  sublabel?: string;
  value: string | undefined;
  fallback: string;
  onChange: (hex: string) => void;
  presets: string[];
}) {
  const safe = hexForPicker(value, fallback);
  const displayHex = value?.startsWith('var(') ? safe : value || safe;

  return (
    <div className="space-y-2">
      {/* Header with label and current color */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-foreground/80">{label}</span>
          {sublabel && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground/60 font-medium">
              {sublabel}
            </span>
          )}
        </div>
        <ColorPicker
          value={displayHex}
          onChange={onChange}
          className="w-auto"
        />
      </div>
      
      {/* Preset swatches - more compact */}
      <div className="flex flex-wrap gap-1">
        {presets.map((c) => (
          <button
            key={c}
            type="button"
            title={c}
            onClick={() => onChange(c)}
            className={cn(
              'h-4 w-4 rounded-sm border border-border/50 transition-all hover:scale-125 active:scale-95',
              safe.toLowerCase() === c.toLowerCase() &&
              'ring-1.5 ring-primary ring-offset-1 ring-offset-background scale-110'
            )}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
    </div>
  );
}

// Main

export function PropertiesPanel({
  selectedNode,
  selectedEdge,
  selectedNodeCount,
  selectedEdgeCount,
  nodeCount,
  edgeCount,
  paperColor,
  onPaperColorChange,
  showGrid,
  onShowGridChange,
  showRuler,
  onShowRulerChange,
  onRenameNode,
  onRenameEdge,
  onNodeKindChange,
  onNodeStyleChange,
  onEdgeStyleChange,
  onDeleteNode,
  onDeleteEdge,
  onDuplicateNodes,
  onResetNodeStyle,
  onMoveToFront,
  onMoveToBack,
  onAlign,
}: PropertiesPanelProps) {
  const [activeTab, setActiveTab] = useState('selection');
  const [draftLabel, setDraftLabel] = useState('');
  const selectionPanelRef = useRef<HTMLDivElement>(null);

  // Auto-switch to element tab when selection changes
  useEffect(() => {
    if (selectedNode?.id || selectedEdge?.id) {
      setActiveTab('selection');
    }
  }, [selectedNode?.id, selectedEdge?.id]);

  // Animate panel on selection change
  const selectionAnimKey = `${selectedNode?.id ?? ''}|${selectedEdge?.id ?? ''}`;

  useLayoutEffect(() => {
    if (activeTab !== 'selection') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = selectionPanelRef.current;
    if (!el) return;
    gsap.fromTo(el, { opacity: 0.6, x: 10 }, { opacity: 1, x: 0, duration: 0.28, ease: 'power2.out' });
  }, [activeTab, selectionAnimKey]);

  // Sync draft label with selected node/edge
  useEffect(() => {
    if (selectedNode) {
      setDraftLabel(String((selectedNode.data as { label?: string })?.label ?? ''));
    } else if (selectedEdge) {
      setDraftLabel(String((selectedEdge as any).label ?? ''));
    }
  }, [selectedNode?.id, selectedEdge?.id]);

  // Edge marker helper
  const edgeMarkerValue = (): string => {
    const m = (selectedEdge as Edge & { markerEnd?: unknown })?.markerEnd;
    if (!m) return 'arrowclosed';
    if (typeof m === 'string') {
      const s = m.toLowerCase();
      if (s === 'none') return 'none';
      if (s === 'arrow') return 'arrow';
      return 'arrowclosed';
    }
    const t = String((m as { type?: string })?.type || 'ArrowClosed').toLowerCase();
    if (t.includes('arrow') && !t.includes('closed')) return 'arrow';
    if (t === 'none') return 'none';
    return 'arrowclosed';
  };

  const nodeStyle = (selectedNode?.data as any)?.style || {};
  const edgeStyle = (selectedEdge?.style as any) || {};
  const [fontSizeDraft, setFontSizeDraft] = useState('12');
  const [borderWidthDraft, setBorderWidthDraft] = useState('2');
  // Draft states for dimensions
  const [widthDraft, setWidthDraft] = useState('160');
  const [heightDraft, setHeightDraft] = useState('52');
  const [borderRadiusDraft, setBorderRadiusDraft] = useState('4');

  useEffect(() => {
    setFontSizeDraft(String(Number(nodeStyle?.fontSize || 12)));
    setBorderWidthDraft(String(Number(nodeStyle?.strokeWidth || 2)));
    // Sync dimension drafts
    setWidthDraft(String(Number(selectedNode?.width || (selectedNode?.data as any)?.width || 160)));
    setHeightDraft(String(Number(selectedNode?.height || (selectedNode?.data as any)?.height || 52)));
    setBorderRadiusDraft(String(Number((selectedNode?.data as any)?.borderRadius || nodeStyle?.borderRadius || 4)));
  }, [selectedNode?.id, selectedNode?.width, selectedNode?.height, nodeStyle?.fontSize, nodeStyle?.strokeWidth, nodeStyle?.borderRadius]);

  const commitFontSize = () => {
    const parsed = Number(fontSizeDraft);
    if (!Number.isFinite(parsed)) {
      setFontSizeDraft(String(Number(nodeStyle?.fontSize || 12)));
      return;
    }
    const next = Math.max(8, Math.min(96, Math.round(parsed)));
    setFontSizeDraft(String(next));
    onNodeStyleChange({ fontSize: next });
  };

  const commitBorderWidth = () => {
    const parsed = Number(borderWidthDraft);
    if (!Number.isFinite(parsed)) {
      setBorderWidthDraft(String(Number(nodeStyle?.strokeWidth || 2)));
      return;
    }
    const next = Math.max(1, Math.min(24, Math.round(parsed)));
    setBorderWidthDraft(String(next));
    onNodeStyleChange({ strokeWidth: next });
  };

  const commitWidth = () => {
    const parsed = Number(widthDraft);
    if (!Number.isFinite(parsed)) {
      setWidthDraft(String(Number(selectedNode?.width || 160)));
      return;
    }
    const next = Math.max(50, parsed);
    setWidthDraft(String(next));
    onNodeStyleChange({ width: next });
  };

  const commitHeight = () => {
    const parsed = Number(heightDraft);
    if (!Number.isFinite(parsed)) {
      setHeightDraft(String(Number(selectedNode?.height || 52)));
      return;
    }
    const next = Math.max(30, parsed);
    setHeightDraft(String(next));
    onNodeStyleChange({ height: next });
  };

  const commitBorderRadius = () => {
    const parsed = Number(borderRadiusDraft);
    if (!Number.isFinite(parsed)) {
      setBorderRadiusDraft(String(Number((selectedNode?.data as any)?.borderRadius || 4)));
      return;
    }
    const next = Math.max(0, Math.min(100, Math.round(parsed)));
    setBorderRadiusDraft(String(next));
    onNodeStyleChange({ borderRadius: next });
  };

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col border-l border-border/50 bg-card/97 backdrop-blur-xl overflow-hidden">
      {/* Panel header */}
      <header className="shrink-0 border-b border-border/40 px-4 py-3 bg-gradient-to-r from-background to-muted/20">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 shadow-sm">
            <Frame className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-foreground/80">
              Properties
            </h2>
            <p className="text-[10px] text-muted-foreground/50">Style & formatting</p>
          </div>

          {/* Element type badge */}
          {selectedNode && (
            <div className="ml-auto px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-[10px] font-semibold text-primary">
              Node
            </div>
          )}
          {selectedEdge && !selectedNode && (
            <div className="ml-auto px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-[10px] font-semibold text-sky-500">
              Edge
            </div>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-full min-h-0 flex-col">
          <TabsList className="sticky top-0 z-10 h-10 w-full shrink-0 justify-start gap-0 rounded-none border-b border-border/50 bg-background/70 p-1 backdrop-blur-sm">
            <TabsTrigger
              value="selection"
              className="flex-1 gap-1.5 rounded-md text-[11px] font-semibold data-[state=active]:bg-primary/12 data-[state=active]:text-primary transition-all"
            >
              <MousePointer2 className="h-3 w-3 opacity-70" />
              Element
              {(selectedNode || selectedEdge) && (
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse ml-0.5" />
              )}
            </TabsTrigger>
            <TabsTrigger
              value="canvas"
              className="flex-1 gap-1.5 rounded-md text-[11px] font-semibold data-[state=active]:bg-primary/12 data-[state=active]:text-primary transition-all"
            >
              <LayoutGrid className="h-3 w-3 opacity-70" />
              Canvas
            </TabsTrigger>
          </TabsList>

          {/* ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ CANVAS TAB ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */}
          <TabsContent value="canvas" className="mt-0 flex-1 space-y-5 overflow-y-auto p-4 pb-10">
            {/* Stats */}
            <InspectorSection title="Diagram Stats" icon={BarChart}>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Nodes', value: nodeCount, color: 'text-primary' },
                  { label: 'Edges', value: edgeCount, color: 'text-sky-400' },
                ].map(({ label, value, color }) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:bg-white/[0.04] group hover:border-white/10"
                  >
                    <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 group-hover:text-muted-foreground/50 transition-colors">
                      {label}
                    </div>
                    <div className={cn('mt-2 text-2xl font-black tabular-nums', color)}>{value}</div>
                  </div>
                ))}
              </div>
            </InspectorSection>

            {/* Paper color */}
            <InspectorSection title="Canvas Background" icon={Palette}>
              <ColorField
                label="Paper color"
                value={paperColor}
                fallback="#09090b"
                onChange={onPaperColorChange}
                presets={PAPER_PRESETS}
              />
            </InspectorSection>

            {/* View options */}
            <InspectorSection title="View Options">
              <div className="space-y-2">
                <Toggle
                  checked={showGrid}
                  onChange={onShowGridChange}
                  label="Dot Grid"
                  description="Background grid pattern"
                />
                <Toggle
                  checked={showRuler}
                  onChange={onShowRulerChange}
                  label="Ruler"
                  description="Show measurement guides"
                />
              </div>
            </InspectorSection>
          </TabsContent>

          {/* ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ ELEMENT TAB ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */}
          <TabsContent value="selection" className="mt-0 flex-1 overflow-y-auto p-4 pb-10">
            <div ref={selectionPanelRef} className="space-y-5">
              {/* Multi-selection banner */}
              {(selectedNodeCount > 1 || selectedEdgeCount > 1) && (
                <div className="rounded-xl border border-primary/25 bg-primary/8 px-3 py-2.5 text-[11px] leading-snug text-muted-foreground">
                  <span className="font-bold text-foreground">Multi-select:</span>{' '}
                  style changes apply to{' '}
                  {selectedNodeCount > 0 ? `${selectedNodeCount} node${selectedNodeCount > 1 ? 's' : ''}` : ''}
                  {selectedNodeCount > 0 && selectedEdgeCount > 0 ? ' + ' : ''}
                  {selectedEdgeCount > 0 ? `${selectedEdgeCount} edge${selectedEdgeCount > 1 ? 's' : ''}` : ''}.
                </div>
              )}

              {/* ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ NODE INSPECTOR ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */}
              {selectedNode ? (
                <div className="space-y-5">

                  {/* Shape & Label */}
                  <InspectorSection title="Label & Shape" icon={Type}>
                    <div className="space-y-1.5 mb-4">
                      <span className="text-[10px] font-semibold text-foreground/60">Node label</span>
                      <Input
                        className="h-9 text-[11px] font-medium bg-background/50"
                        placeholder="Enter label..."
                        value={draftLabel}
                        onChange={(e) => setDraftLabel(e.target.value)}
                        onBlur={() => onRenameNode(draftLabel)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            (e.currentTarget as HTMLInputElement).blur();
                          }
                        }}
                      />
                    </div>
                 
                    <div className="space-y-2">
                      <span className="text-[10px] font-semibold text-foreground/60">Node type</span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-1 rounded-xl bg-muted/30 border border-border/40 max-h-[200px] overflow-y-auto custom-scrollbar">
                        {[
                          { value: 'node', label: 'Process' },
                          { value: 'decision', label: 'Decision' },
                          { value: 'startend', label: 'Terminal' },
                          { value: 'database', label: 'Database' },
                          { value: 'entity', label: 'Entity' },
                          { value: 'actor', label: 'Actor' },
                          { value: 'queue', label: 'Queue' },
                          { value: 'io', label: 'Data I/O' },
                        ].map(({ value, label }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => onNodeKindChange(value as any)}
                            className={cn(
                              'py-1.5 rounded-lg text-[10px] font-bold transition-all leading-tight',
                              String((selectedNode.data as any)?.kind || 'node') === value
                                ? 'bg-background text-primary shadow-sm'
                                : 'text-muted-foreground/50 hover:text-foreground hover:bg-background/30'
                            )}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </InspectorSection>

                  {/* Resizable Shape Type Selector */}
                  {selectedNode?.type === 'resizableShape' && (
                    <InspectorSection title="Shape Type" icon={Box}>
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-muted/30 border border-border/40">
                          {[
                            { value: 'rectangle', label: 'Rectangle' },
                            { value: 'circle', label: 'Circle' },
                            { value: 'rounded', label: 'Rounded' },
                          ].map(({ value, label }) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => onNodeStyleChange({ shape: value as any })}
                              className={cn(
                                'py-1.5 rounded-lg text-[10px] font-bold transition-all leading-tight',
                                String((selectedNode.data as any)?.shape || 'rectangle') === value
                                  ? 'bg-background text-primary shadow-sm'
                                  : 'text-muted-foreground/50 hover:text-foreground hover:bg-background/30'
                              )}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </InspectorSection>
                  )}

                  {/* Colors */}
                  <InspectorSection title="Colors" icon={Palette}>
                    <ColorField
                      label="Fill"
                      value={nodeStyle?.fillColor}
                      fallback="#18181b"
                      onChange={(v) => onNodeStyleChange({ fillColor: v })}
                      presets={NODE_FILL_PRESETS}
                    />
                    <ColorField
                      label="Border"
                      value={nodeStyle?.strokeColor}
                      fallback="#ffffff"
                      onChange={(v) => onNodeStyleChange({ strokeColor: v })}
                      presets={NODE_STROKE_PRESETS}
                    />
                    <ColorField
                      label="Text"
                      sublabel="Label"
                      value={nodeStyle?.color}
                      fallback="#ffffff"
                      onChange={(v) => onNodeStyleChange({ color: v })}
                      presets={NODE_TEXT_PRESETS}
                    />
                  </InspectorSection>

                  {/* Typography */}
                  <InspectorSection title="Typography" icon={Type}>
                    <div className="space-y-1.5">
                      <span className="flex items-center gap-1.5 text-[10px] font-semibold text-foreground/60">
                        <Type className="h-3 w-3 opacity-70" />
                        Font family
                      </span>
                      <select
                        className="h-8 w-full rounded-lg border border-border/50 bg-background/50 px-2 text-[11px] font-medium shadow-sm transition-all focus:bg-background focus:ring-1 focus:ring-primary/30 outline-none"
                        value={String(nodeStyle?.fontFamily || 'inherit')}
                        onChange={(e) => onNodeStyleChange({ fontFamily: e.target.value })}
                      >
                        {FONT_OPTIONS.map((f) => (
                          <option key={f.value} value={f.value}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-semibold text-foreground/60">Font size</span>
                        <Input
                          type="number"
                          className="h-8 text-[11px]"
                          value={fontSizeDraft}
                          onChange={(e) => setFontSizeDraft(e.target.value)}
                          onBlur={commitFontSize}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              (e.currentTarget as HTMLInputElement).blur();
                            }
                          }}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-semibold text-foreground/60">Border px</span>
                        <Input
                          type="number"
                          className="h-8 text-[11px]"
                          value={borderWidthDraft}
                          onChange={(e) => setBorderWidthDraft(e.target.value)}
                          onBlur={commitBorderWidth}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              (e.currentTarget as HTMLInputElement).blur();
                            }
                          }}
                        />
                      </div>
                    </div>

                    {/* Bold / Italic / Underline */}
                    <div className="flex gap-1.5">
                      {[
                        {
                          Icon: Bold,
                          label: 'Bold',
                          active: Number(nodeStyle?.fontWeight || 600) >= 700,
                          fn: () => onNodeStyleChange({
                            fontWeight: Number(nodeStyle?.fontWeight || 600) >= 700 ? 400 : 700,
                          }),
                        },
                        {
                          Icon: Italic,
                          label: 'Italic',
                          active: String(nodeStyle?.fontStyle || 'normal') === 'italic',
                          fn: () => onNodeStyleChange({
                            fontStyle: String(nodeStyle?.fontStyle || 'normal') === 'italic' ? 'normal' : 'italic',
                          }),
                        },
                        {
                          Icon: Underline,
                          label: 'Underline',
                          active: String(nodeStyle?.textDecoration || 'none') === 'underline',
                          fn: () => onNodeStyleChange({
                            textDecoration: String(nodeStyle?.textDecoration || 'none') === 'underline' ? 'none' : 'underline',
                          }),
                        },
                      ].map(({ Icon, label, active, fn }) => (
                        <button
                          key={label}
                          type="button"
                          title={label}
                          onClick={fn}
                          className={cn(
                            'h-8 w-9 rounded-lg border text-sm font-semibold transition-all',
                            active
                              ? 'border-primary/50 bg-primary/15 text-primary shadow-sm'
                              : 'border-border/50 bg-background/40 text-foreground/60 hover:bg-background hover:text-foreground'
                          )}
                        >
                          <Icon className="w-3.5 h-3.5 mx-auto" />
                        </button>
                      ))}
                    </div>

                    {/* Text alignment */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-semibold text-foreground/60">Text align</span>
                      <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-muted/30 border border-border/40">
                        {[
                          { value: 'left', Icon: AlignLeft },
                          { value: 'center', Icon: AlignCenter },
                          { value: 'right', Icon: AlignRight },
                        ].map(({ value, Icon }) => (
                          <button
                            key={value}
                            type="button"
                            title={value}
                            onClick={() => onNodeStyleChange({ textAlign: value as any })}
                            className={cn(
                              'flex items-center justify-center py-1.5 rounded-md transition-all',
                              String(nodeStyle?.textAlign || 'center') === value
                                ? 'bg-background text-primary shadow-sm'
                                : 'text-muted-foreground/50 hover:text-foreground hover:bg-background/30'
                            )}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </InspectorSection>

                  {/* Size & Dimensions */}
                  <InspectorSection title="Dimensions" icon={LayoutGrid}>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-foreground/60">Width</span>
                          <span className="text-[9px] text-muted-foreground/40">px</span>
                        </div>
                        <Input
                          type="number"
                          className="h-9 text-[12px] font-medium bg-background/60 border-border/60 focus:border-primary/50"
                          value={widthDraft}
                          onChange={(e) => setWidthDraft(e.target.value)}
                          onBlur={commitWidth}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              commitWidth();
                              (e.currentTarget as HTMLInputElement).blur();
                            }
                          }}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-foreground/60">Height</span>
                          <span className="text-[9px] text-muted-foreground/40">px</span>
                        </div>
                        <Input
                          type="number"
                          className="h-9 text-[12px] font-medium bg-background/60 border-border/60 focus:border-primary/50"
                          value={heightDraft}
                          onChange={(e) => setHeightDraft(e.target.value)}
                          onBlur={commitHeight}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              commitHeight();
                              (e.currentTarget as HTMLInputElement).blur();
                            }
                          }}
                        />
                      </div>
                    </div>
                    {/* Border Radius for resizable shapes */}
                    {selectedNode?.type === 'resizableShape' && (
                      <div className="space-y-1.5 pt-3 border-t border-border/30 mt-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-foreground/60">Border Radius</span>
                          <span className="text-[9px] text-muted-foreground/40">px</span>
                        </div>
                        <Input
                          type="number"
                          className="h-9 text-[12px] font-medium bg-background/60 border-border/60 focus:border-primary/50"
                          min={0}
                          max={100}
                          value={borderRadiusDraft}
                          onChange={(e) => setBorderRadiusDraft(e.target.value)}
                          onBlur={commitBorderRadius}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              commitBorderRadius();
                              (e.currentTarget as HTMLInputElement).blur();
                            }
                          }}
                        />
                      </div>
                    )}
                  </InspectorSection>

                  {/* Arrange & Layers */}
                  <InspectorSection title="Arrange & Layers" icon={Layers}>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => onMoveToFront?.()}
                        className="flex items-center justify-center gap-1.5 h-8 rounded-lg border border-border/50 bg-background/40 text-[10px] font-bold uppercase tracking-wider text-foreground/70 hover:bg-primary/8 hover:border-primary/40 hover:text-primary transition-all"
                      >
                        <ArrowUp className="w-3 h-3" />
                        To Front
                      </button>
                      <button
                        type="button"
                        onClick={() => onMoveToBack?.()}
                        className="flex items-center justify-center gap-1.5 h-8 rounded-lg border border-border/50 bg-background/40 text-[10px] font-bold uppercase tracking-wider text-foreground/70 hover:bg-primary/8 hover:border-primary/40 hover:text-primary transition-all"
                      >
                        <ArrowDown className="w-3 h-3" />
                        To Back
                      </button>
                    </div>

                    {/* Multi-select alignment */}
                    {selectedNodeCount > 1 && onAlign && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-semibold text-foreground/60">Alignment</span>
                        <div className="grid grid-cols-6 gap-1 bg-muted/20 p-1 rounded-lg border border-border/40">
                          {[
                            { mode: 'left', Icon: AlignLeft, title: 'Align Left' },
                            { mode: 'center', Icon: AlignCenter, title: 'Align Center H' },
                            { mode: 'right', Icon: AlignRight, title: 'Align Right' },
                            { mode: 'top', Icon: AlignStartVertical, title: 'Align Top' },
                            { mode: 'middle', Icon: AlignCenterVertical, title: 'Align Middle V' },
                            { mode: 'bottom', Icon: AlignEndVertical, title: 'Align Bottom' },
                          ].map(({ mode, Icon, title }) => (
                            <button
                              key={mode}
                              type="button"
                              title={title}
                              onClick={() => onAlign(mode as any)}
                              className="flex items-center justify-center p-1.5 rounded-md hover:bg-background hover:text-primary transition-all text-muted-foreground/60"
                            >
                              <Icon className="w-3.5 h-3.5" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </InspectorSection>

                  {/* Actions */}
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={onDuplicateNodes}
                        className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-border/50 bg-background/40 px-3 text-[10px] font-bold uppercase tracking-wider text-foreground/65 shadow-sm transition-all hover:border-primary/40 hover:bg-background hover:text-primary active:scale-95"
                      >
                        <Copy className="w-3 h-3" />
                        Duplicate
                      </button>
                      <button
                        type="button"
                        onClick={onResetNodeStyle}
                        className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-border/50 bg-background/40 px-3 text-[10px] font-bold uppercase tracking-wider text-foreground/65 shadow-sm transition-all hover:border-border/80 hover:bg-background hover:text-foreground active:scale-95"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Reset
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={onDeleteNode}
                      className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-destructive/20 bg-destructive/5 px-4 text-[10px] font-bold uppercase tracking-widest text-destructive/70 transition-all hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive active:scale-[0.98]"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete Node
                    </button>
                  </div>
                </div>
              ) : selectedEdge ? (

                /* ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ EDGE INSPECTOR ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */
                <div className="space-y-5">
                  <InspectorSection title="Line & Arrow">
                    <ColorField
                      label="Line & arrow color"
                      value={
                        typeof edgeStyle?.stroke === 'string'
                          ? (edgeStyle.stroke as string)
                          : undefined
                      }
                      fallback="#ffffff"
                      onChange={(v) => onEdgeStyleChange({ stroke: v })}
                      presets={EDGE_LINE_PRESETS}
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-semibold text-foreground/60">Thickness</span>
                        <Input
                          type="number"
                          className="h-8 text-[11px]"
                          value={Number(edgeStyle?.strokeWidth || 2)}
                          onChange={(e) => onEdgeStyleChange({ strokeWidth: Number(e.target.value || 2) })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-semibold text-foreground/60">Line style</span>
                        <select
                          className="h-8 w-full rounded-lg border border-border/50 bg-background/50 px-2 text-[11px] font-medium shadow-sm transition-all focus:bg-background outline-none"
                          value={String(edgeStyle?.strokeDasharray || '')}
                          onChange={(e) => onEdgeStyleChange({ strokeDasharray: e.target.value })}
                        >
                          <option value="">Solid</option>
                          <option value="8 6">Dashed</option>
                          <option value="2 4">Dotted</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-semibold text-foreground/60">Arrow head</span>
                      <select
                        className="h-8 w-full rounded-lg border border-border/50 bg-background/50 px-2 text-[11px] font-medium shadow-sm transition-all focus:bg-background outline-none"
                        value={edgeMarkerValue()}
                        onChange={(e) => {
                          const v = e.target.value;
                          onEdgeStyleChange({
                            markerEndType: v === 'none' ? 'none' : v === 'arrow' ? 'arrow' : 'arrowclosed',
                          });
                        }}
                      >
                        <option value="arrowclosed">Filled arrow</option>
                        <option value="arrow">Open arrow</option>
                        <option value="none">No arrow</option>
                      </select>
                    </div>
                  </InspectorSection>

                  <InspectorSection title="Label">
                    <div className="space-y-1.5 mb-4">
                      <span className="text-[10px] font-semibold text-foreground/60">Edge label</span>
                      <Input
                        className="h-9 text-[11px] font-medium bg-background/50"
                        placeholder="e.g. Yes, No, 1:N..."
                        value={draftLabel}
                        onChange={(e) => setDraftLabel(e.target.value)}
                        onBlur={() => onRenameEdge(draftLabel)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            (e.currentTarget as HTMLInputElement).blur();
                          }
                        }}
                      />
                    </div>

                    <ColorField
                      label="Label color"
                      value={(selectedEdge as any)?.labelStyle?.fill as string | undefined}
                      fallback="#000000"
                      onChange={(v) => onEdgeStyleChange({ labelColor: v })}
                      presets={NODE_TEXT_PRESETS}
                    />
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-semibold text-foreground/60">Label size</span>
                      <Input
                        type="number"
                        className="h-8 text-[11px]"
                        value={Number((selectedEdge as any)?.labelStyle?.fontSize || 12)}
                        onChange={(e) => onEdgeStyleChange({ labelFontSize: Number(e.target.value || 12) })}
                      />
                    </div>
                  </InspectorSection>

                  <button
                    type="button"
                    onClick={onDeleteEdge}
                    className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-destructive/20 bg-destructive/5 px-4 text-[10px] font-bold uppercase tracking-widest text-destructive/70 transition-all hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive active:scale-[0.98]"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete Edge
                  </button>
                </div>
              ) : (

                /* EMPTY STATE */
                <div className="flex flex-col items-center justify-center gap-6 px-6 py-20 text-center">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl scale-150" />
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-background border border-primary/20 shadow-xl">
                      <MousePointer2 className="h-8 w-8 text-primary/70" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-foreground/80">
                      Select an element
                    </h4>
                    <p className="max-w-[200px] text-xs leading-relaxed text-muted-foreground/60">
                      Click any <span className="text-primary font-medium">node</span> or{' '}
                      <span className="text-primary font-medium">connection</span> on the canvas to edit its properties
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground/40">
                    <span className="px-2 py-1 rounded bg-muted/50 border border-border/30">Tip</span>
                    <span>Hold Shift to multi-select</span>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
