import { useCallback, useEffect, useMemo, useRef, useState, memo, type DragEvent } from 'react';
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
import { CollaborativeCursors } from './CollaborativeCursors';
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
  /**
   * Fired once when a drag operation ENDS (onNodeDragStop / onSelectionDragStop).
   * Use this for expensive operations (syntax serialization, save) instead of
   * onUserGraphChange which fires at ~35fps during drag.
   */
  onDragCommit?: (graph: { nodes: Node[]; edges: Edge[] }) => void;
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
  /**
   * Registers a direct style-patcher function that can patch node styles in-place
   * without going through the syntax/visualData roundtrip. Call with null to unregister.
   */
  onRegisterStylePatcher?: (
    patcher: ((nodeIds: string[], stylePatch: Record<string, unknown>) => void) | null
  ) => void;
  currentView?: string;
  onViewChange?: (view: string) => void;
  cursors?: any[];
  onMouseMoveCanvas?: (pos: { x: number; y: number }) => void;
}

import { FlowchartNode, getNodeStyle } from '../nodes/FlowchartNode';

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

  const btnClass = "absolute flex items-center justify-center w-5 h-5 rounded-full bg-white text-zinc-950 border border-zinc-200 shadow-lg hover:scale-125 hover:bg-zinc-900 hover:text-white transition-all cursor-pointer z-[60]";

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
  onDragCommit,
  onCanvasUserGesture,
  paperColor = '#09090b',
  showGrid = true,
  showRuler = false,
  onSelectionChange,
  onRegisterPngExporter,
  onRegisterStylePatcher,
  currentView = 'all',
  onViewChange,
  cursors = [],
  onMouseMoveCanvas,
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
  const lastEmitRef = useRef(0);
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!onMouseMoveCanvas || !reactFlowInstance) return;
    const now = Date.now();
    if (now - lastEmitRef.current > 50) {
      lastEmitRef.current = now;
      const pos = reactFlowInstance.screenToFlowPosition({ x: e.clientX, y: e.clientY });
      onMouseMoveCanvas(pos);
    }
  };
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

      // Temporarily clear react-flow selection to hide resize and selection handles in export
      const originalNodes = reactFlowInstance.getNodes();
      const originalEdges = reactFlowInstance.getEdges();
      reactFlowInstance.setNodes(originalNodes.map(n => ({ ...n, selected: false })));
      reactFlowInstance.setEdges(originalEdges.map(e => ({ ...e, selected: false })));

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
      // Memory safety calculation: clamp pixel ratio if dimensions exceed 64 Megapixels or 14000px bounds
      const requestedScale = Math.max(1, Math.min(Number(scale) || 2, 3));
      const maxPixels = 64 * 1024 * 1024;
      const targetPixels = (containerWidth * requestedScale) * (containerHeight * requestedScale);
      let safeScale = requestedScale;
      if (targetPixels > maxPixels || containerWidth * requestedScale > 14000 || containerHeight * requestedScale > 14000) {
        safeScale = Math.max(1, Math.floor(Math.sqrt(maxPixels / (containerWidth * containerHeight))));
      }

      // Capture the viewport element (has the CSS transforms applied)
      const dataUrl = await toPng(flowViewport, {
        cacheBust: true,
        pixelRatio: safeScale,
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
      reactFlowInstance.setNodes(originalNodes);
      reactFlowInstance.setEdges(originalEdges);
      setSelectedNodeId(previousSelectedNodeId);
      setInteractionMode(previousMode);
      setIsExportingSnapshot(false);
      
      return dataUrl;
    };

    onRegisterPngExporter(exporter);
    return () => onRegisterPngExporter(null);
  }, [onRegisterPngExporter, reactFlowInstance, selectedNodeId, interactionMode]);

  // Register a direct style-patcher so the parent can update node styles in-place
  // without going through the syntax → parse → visualData roundtrip (which loses styles).
  useEffect(() => {
    if (!onRegisterStylePatcher) return;
    const patcher = (nodeIds: string[], stylePatch: Record<string, unknown>) => {
      setNodes((prevNodes) =>
        prevNodes.map((n) => {
          if (!nodeIds.includes(n.id)) return n;
          const currentData = (n.data as any) || {};
          const currentStyle = currentData.style || {};
          return {
            ...n,
            data: {
              ...currentData,
              style: { ...currentStyle, ...stylePatch },
            },
          };
        })
      );
    };
    onRegisterStylePatcher(patcher);
    return () => onRegisterStylePatcher(null);
  }, [onRegisterStylePatcher, setNodes]);

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
    
   
    
    // Skip if neither hash changed — nothing new to apply
    if (!syntaxChanged && !visualChanged) {
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
1              // Check if cleanData has actual style properties (not just empty object)
              const hasParsedStyle = cleanData?.style && Object.keys(cleanData.style).length > 0;
              return {
                ...existing,
                ...n,
                type: nodeType,
                data: {
                  ...existingClean,
                  ...cleanData,
                  style: hasParsedStyle ? cleanData.style : existingClean?.style,
                },
              };
            }
            return { ...n, type: nodeType, data: cleanData };
          });
        });
        setEdges(visualData!.edges || []);
        lastAppliedVisualHashRef.current = visualHash;
        // CRITICAL: set to syntaxHash (not visualHash) so the next run correctly
        // detects whether the TEXT syntax has actually changed. Setting it to
        // visualHash caused syntaxHash !== lastSyntaxHashRef → syntaxChanged=true
        // on every subsequent render, triggering a full re-parse that created
        // nodes with wrong BFS IDs/positions → the blink/flicker.
        lastSyntaxHashRef.current = syntaxHash;
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
              // Check if cleanData has actual style properties (not just empty object)
              const hasParsedStyle = cleanData?.style && Object.keys(cleanData.style).length > 0;
              return {
                ...existing,
                ...n,
                type: nodeType,
                position: prevPos || n.position,
                // Preserve width/height from existing node if parsed node doesn't have them
                width: n.width ?? existing.width,
                height: n.height ?? existing.height,
                data: {
                  ...existingClean,
                  ...cleanData,
                  style: hasParsedStyle ? cleanData.style : existingClean?.style,
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

  // Inject fresh callbacks and apply view-based visibility on every render.
  const nodesForReactFlow = useMemo(() =>
    nodes.map((n) => {
      const nodeViews: string[] = n.data?.views || [];
      const isHidden =
        currentView !== 'all' &&
        nodeViews.length > 0 &&
        !nodeViews.includes(currentView);

      const baseNode = {
        ...n,
        hidden: isHidden,
      };

      if (baseNode.type !== 'resizableShape') return baseNode;

      return {
        ...baseNode,
        data: {
          ...baseNode.data,
          onDimensionsChange: (id: string, w: number, h: number) =>
            handleNodeDimensionsChangeRef.current(id, w, h),
          onLabelChange: (id: string, label: string) =>
            handleNodeLabelChangeRef.current(id, label),
        },
      };
    }),
    [nodes, currentView]
  );

  const edgesForReactFlow = useMemo(() => {
    // Hide edges if the source or target node is hidden
    const hiddenNodeIds = new Set(
      nodes
        .filter((n) => {
          const nodeViews: string[] = n.data?.views || [];
          return currentView !== 'all' && nodeViews.length > 0 && !nodeViews.includes(currentView);
        })
        .map((n) => n.id)
    );

    return edges.map((e) => {
      const isHidden = hiddenNodeIds.has(e.source) || hiddenNodeIds.has(e.target);
      return {
        ...e,
        hidden: isHidden,
      };
    });
  }, [edges, nodes, currentView]);

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
    const maxLevel = Math.max(...sortedLevels, 0);
    const isLinearPipeline = maxLevel >= 3 && sortedLevels.every((l) => (levels.get(l)?.length ?? 0) <= 2);

    const cellX = isLinearPipeline ? 260 : 260;
    const cellY = isLinearPipeline ? 120 : 160;

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
          if (isLinearPipeline) {
            target.position = { x: idx * cellX + 120, y: i * cellY + 60 };
          } else {
            target.position = { x: i * cellX + 80, y: idx * cellY + 60 };
          }
        });
    });

    suppressHistoryRef.current = false;
    setNodes(nextNodes);
    setTimeout(() => {
      reactFlowInstance?.fitView({ padding: 0.15, minZoom: 0.7, maxZoom: 1.2, duration: 800 });
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
      
      const raw = event.dataTransfer.getData('application/x-diagram-snippet');
      
      if (!raw) {
        return;
      }
      if (!reactFlowInstance) {
        return;
      }

      try {
        onCanvasUserGesture?.();
        const payload = JSON.parse(raw) as { kind?: string; label?: string; snippet?: string; color?: string; icon?: string; id?: string; shape?: string; width?: number; height?: number; fillColor?: string; strokeColor?: string };
        
        const pos = reactFlowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        // Use the snippet system to handle complex items (like mini flows)
        const subgraph = parseSyntaxToGraph(payload.snippet || '');
        
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
                  fillColor: payload.fillColor || '#18181b',
                  strokeColor: payload.strokeColor || '#3f3f46',
                  strokeWidth: 2,
                  fontSize: 14,
                  color: '#ffffff',
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

          {onViewChange && (
            <div className="flex items-center gap-1.5 ml-1 border-l border-border/40 pl-3">
              <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">Active View:</span>
              <select
                value={currentView}
                onChange={(e) => onViewChange(e.target.value)}
                className="h-7 rounded-lg border border-border/60 bg-background/50 px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground outline-none focus:border-primary/50 transition-all cursor-pointer"
              >
                <option value="all">Logical View (All)</option>
                <option value="infrastructure">Infrastructure View</option>
                <option value="data">Data View</option>
                <option value="security">Security View</option>
              </select>
            </div>
          )}
        </span>
      </div>

      <div
        onMouseMove={handleMouseMove}
        className="flex-1 relative w-full h-full overflow-hidden group/canvas"
      >
        <CollaborativeCursors cursors={cursors} />
        <ReactFlow
          style={{ width: '100%', height: '100%' }}
          nodes={nodesForReactFlow}
          edges={edgesForReactFlow}
          onNodesChange={relayNodesChange}
          onEdgesChange={relayEdgesChange}
          onConnect={onConnect}
          onNodeDragStart={() => onCanvasUserGesture?.()}
          onNodeDragStop={() => {
            if (onDragCommit) onDragCommit({ nodes, edges });
          }}
          onSelectionDragStop={() => {
            if (onDragCommit) onDragCommit({ nodes, edges });
          }}
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
            <div className="flex items-center gap-1 p-1.5 rounded-2xl bg-[#0d0d10]/90 border border-white/[0.08] backdrop-blur-2xl shadow-xl">
              <button
                type="button"
                onClick={() => setInteractionMode('select')}
                className={cn(
                  "p-2.5 rounded-xl transition-all duration-200",
                  interactionMode === 'select'
                    ? "bg-white/[0.14] text-white border border-white/[0.18] shadow-sm"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
                )}
                title="Select Tool (V)"
              >
                <MousePointer2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setInteractionMode('pan')}
                className={cn(
                  "p-2.5 rounded-xl transition-all duration-200",
                  interactionMode === 'pan'
                    ? "bg-white/[0.14] text-white border border-white/[0.18] shadow-sm"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
                )}
                title="Pan Tool (H)"
              >
                <Hand className="w-4 h-4" />
              </button>
            </div>

            {/* Zoom & View Controls */}
            <div className="flex items-center gap-1 p-1.5 rounded-2xl bg-[#0d0d10]/90 border border-white/[0.08] backdrop-blur-2xl shadow-xl">
              <button
                onClick={() => reactFlowInstance?.zoomOut()}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <div className="px-3 text-[11px] font-semibold tabular-nums text-white min-w-[3.5rem] text-center tracking-tighter">
                {Math.round(viewport.zoom * 100)}%
              </div>
              <button
                onClick={() => reactFlowInstance?.zoomIn()}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="w-px h-5 bg-white/[0.08] mx-1" />
              <button
                onClick={() => reactFlowInstance?.fitView({ duration: 800 })}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all"
                title="Fit View"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>}

          {!isExportingSnapshot && <MiniMap
            className="export-ignore"
            style={{
              backgroundColor: '#0d0d10',
              borderRadius: '1rem',
              border: '1px solid rgba(255,255,255,0.08)',
              overflow: 'hidden',
              bottom: 24,
              right: 24,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              width: 130,
              height: 90
            }}
            maskColor="rgba(0,0,0,0.6)"
            nodeColor={(n: Node) => (n.data as any)?.style?.fillColor || '#3f3f46'}
            nodeStrokeWidth={2}
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
export const DiagramCanvas = memo(function DiagramCanvas(props: DiagramCanvasProps) {
  return (
    <ReactFlowProvider>
      <DiagramCanvasInner {...props} />
    </ReactFlowProvider>
  );
});


function slugifyId(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[\s]+/g, '-')
    .replace(/[^a-z0-9-_]/g, '');
}

function unwrapNodeRef(raw: string): { label: string; kind: string; shape?: string; width?: number; height?: number; style?: Record<string, string> } {
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

  // [Label|w:X,h:Y,shape:S,fill:#fff,stroke:#000] — resizable shape syntax.
  // [Label|fill:#ff0000,stroke:#00ff00,kind:node] — styled regular node syntax.
  // Use non-greedy match for label to handle edge cases
  const pipeMatch = base.match(/^\[([^|\]]*?)\|([^\]]*?)\]$/);
  if (pipeMatch) {
    const label = pipeMatch[1].trim();
    const attrsStr = pipeMatch[2];
    let width: number | undefined;
    let height: number | undefined;
    let shape: string | undefined;
    let kind: string | undefined;
    const style: Record<string, string> = {};
    // Only process attrs if they look valid (contain :)
    if (attrsStr.includes(':')) {
      attrsStr.split(',').forEach(attr => {
        const [k, v] = attr.trim().split(':');
        if (!k || !v) return;
        if (k === 'w' && /^\d+$/.test(v)) width = parseInt(v, 10);
        if (k === 'h' && /^\d+$/.test(v)) height = parseInt(v, 10);
        if (k === 'shape') shape = v.trim();
        if (k === 'kind') kind = v.trim();
        if (k === 'fill' || k === 'fillColor') style.fillColor = v.trim();
        if (k === 'stroke' || k === 'strokeColor') style.strokeColor = v.trim();
        if (k === 'color' || k === 'textColor') style.color = v.trim();
        if (k === 'strokeWidth') style.strokeWidth = v.trim();
      });
    }
    // Ensure we have a valid label, not just attributes, and strip extra brackets
    let finalLabel = label || 'Shape';
    finalLabel = finalLabel.replace(/^[\[]+/, '').replace(/[\]]+$/, '').trim();
    // If has kind: attribute, it's a styled regular node (not a resizable shape)
    if (kind) {
      return { label: finalLabel, kind, style };
    }
    // Otherwise it's a resizable shape
    return { label: finalLabel, kind: 'resizableShape', shape: shape || 'rectangle', width, height, style };
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
  // Fix corrupted syntax where commas were converted to newlines in extended format
  // Pattern: lines like [Label|w:120], [h:80], [shape:rectangle] should be joined
  let fixedSyntax = String(syntax || '');

  // Pre-fix: Strip extra leading brackets from resizable shape tokens anywhere in the line.
  // [[Rectangle|w:240,h:200,shape:rectangle] -> [Rectangle|w:240,h:200,shape:rectangle]
  // Uses greedy attrs + required closing bracket so attrs are never empty.
  fixedSyntax = fixedSyntax.replace(/\[{2,}([a-zA-Z0-9_ \-]+)\|([^\]]*)\]/g, (_match, label, attrs) => {
    return `[${label.trim()}|${attrs}]`;
  });

  // Preprocess: split multiple connections on one line (comma-separated)
  const preprocessed = fixedSyntax
    .split('\n')
    .flatMap((line) => {
      const trimmed = line.trim();
      // Fix missing closing bracket at end of a shape token
      if (trimmed.match(/^\[[^\]]+\|/) && !trimmed.endsWith(']')) {
        return [trimmed + ']'];
      }
      // If line contains arrows and commas, split — but ONLY on commas outside brackets.
      // e.g. "[Rectangle|w:120,h:80,shape:rectangle] --> [B], [C] --> [D]"
      // must NOT split on the commas inside the shape token.
      if (trimmed.includes('-->') && trimmed.includes(',')) {
        const parts: string[] = [];
        let depth = 0;
        let current = '';
        for (const ch of trimmed) {
          if (ch === '[') { depth++; current += ch; }
          else if (ch === ']') { depth--; current += ch; }
          else if (ch === ',' && depth === 0) { if (current.trim()) parts.push(current.trim()); current = ''; }
          else { current += ch; }
        }
        if (current.trim()) parts.push(current.trim());
        // Only apply the split if there really were top-level commas
        if (parts.length > 1) return parts.filter((s) => s.length > 0);
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
    // IMPORTANT: Skip this path if the token contains '|' — those are extended shape tokens
    // like [Rectangle|w:240,h:200,shape:rectangle] which must go through unwrapNodeRef directly.
    // Without this guard, "Rectangle" gets parsed as the ID and "w:240,h:200,shape:rectangle"
    // as the inner content, stripping the pipe and losing all shape/dimension data.
    const hasPipe = trimmed.includes('|');
    const idLabelMatch = !hasPipe
      ? trimmed.match(/^([a-zA-Z0-9_-]+)\s*[\[\(\{]([^\]\)\}]*?)[\]\)\}]$/)
      : null;
    let finalId = '';
    let finalLabel = '';
    let finalKind = 'node';

    if (idLabelMatch) {
      finalId = idLabelMatch[1];
      const innerContent = idLabelMatch[2]; // The content inside brackets
      // Reconstruct the bracketed part for unwrapNodeRef
      const bracketType = trimmed.includes('(') ? '(' : trimmed.includes('{') ? '{' : '[';
      const closingBracket = bracketType === '(' ? ')' : bracketType === '{' ? '}' : ']';
      const unwrapped = unwrapNodeRef(`${bracketType}${innerContent}${closingBracket}`);
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
      // Use extracted style or defaults
      const extractedStyle = unwrappedFull.style || {};
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
            fillColor: extractedStyle.fillColor || '#ffffff',
            strokeColor: extractedStyle.strokeColor || '#000000',
            strokeWidth: extractedStyle.strokeWidth ? parseInt(extractedStyle.strokeWidth, 10) : 2,
            fontSize: 14,
            color: extractedStyle.color || '#000000',
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

    // Get the full unwrapped data including style
    const unwrappedFull = idLabelMatch
      ? unwrapNodeRef(trimmed.slice(finalId.length))
      : unwrapNodeRef(trimmed);
    const extractedStyle = unwrappedFull.style || {};

    const newNode: Node = {
      id: finalId,
      type: 'diagramNode',
      position: { x: 0, y: 0 },
      data: {
        label: finalLabel,
        kind: finalKind,
        icon: icon,
        // Include extracted style if present (fillColor, strokeColor, color)
        ...(Object.keys(extractedStyle).length > 0 ? { style: extractedStyle } : {}),
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
