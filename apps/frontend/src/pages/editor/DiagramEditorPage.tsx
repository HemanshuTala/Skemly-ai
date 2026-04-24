import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Link as RouterLink } from 'react-router-dom';
import { useDiagramStore } from '@/stores/diagramStore';
import { useAuthStore } from '@/stores/authStore';
import { Toolbar } from '@/components/editor/Toolbar';
import { CodeEditor, type CodeEditorApi } from '@/components/editor/CodeEditor';
import { ShapePalette } from '@/components/editor/ShapePalette';
import { DiagramCanvas } from '@/components/editor/DiagramCanvas';
import { PropertiesPanel } from '@/components/editor/PropertiesPanel';
import { NotesEditor } from '@/components/editor/NotesEditor';
import { useAutoSave } from '@/hooks/useAutoSave';
import { aiAPI, commentAPI, diagramAPI, exportAPI, notesAPI } from '@/services/api.service';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  Sparkles, 
  Link2 as LinkIcon, 
  LayoutGrid, 
  Code, 
  Layers, 
  Download, 
  Plus, 
  Mail,
  Zap, 
  HelpCircle, 
  MessageSquare, 
  History as HistoryIcon, 
  Clock,
  Copy,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { MarkerType, type Edge, type Node } from 'reactflow';

// Helper functions for parsing and normalizing graph data
function parseSyntaxToGraph(syntax: string): { nodes: Node[]; edges: Edge[] } {
  const lines = String(syntax || '')
    .split('\n')
    .map((l) => l.trim());

  const nodeById = new Map<string, Node>();
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  lines.forEach((line) => {
    if (!line) return;
    
    // Simple node pattern: [Node], {Node}, etc.
    const nodeMatch = line.match(/^\[(.*)\]$/);
    if (nodeMatch) {
      const label = nodeMatch[1];
      const id = label.replace(/\s+/g, '-').toLowerCase();
      const newNode: Node = {
        id,
        position: { x: 100 + nodes.length * 150, y: 100 + nodes.length * 100 },
        data: { label, kind: 'node' },
      };
      nodes.push(newNode);
      nodeById.set(id, newNode);
      return;
    }

    // Edge pattern: [From] --> [To]
    const edgeMatch = line.match(/^(.+?)\s*-->\s*(.+)$/);
    if (edgeMatch) {
      const from = edgeMatch[1].trim();
      const to = edgeMatch[2].trim();
      const fromId = from.replace(/\s+/g, '-').toLowerCase();
      const toId = to.replace(/\s+/g, '-').toLowerCase();
      
      // Create or find nodes
      let fromNode = nodeById.get(fromId);
      let toNode = nodeById.get(toId);
      
      if (!fromNode) {
        fromNode = {
          id: fromId,
          position: { x: 100 + nodes.length * 150, y: 100 + nodes.length * 100 },
          data: { label: from, kind: 'node' },
        };
        nodes.push(fromNode);
        nodeById.set(fromId, fromNode);
      }
      
      if (!toNode) {
        toNode = {
          id: toId,
          position: { x: 100 + nodes.length * 150, y: 100 + nodes.length * 150 },
          data: { label: to, kind: 'node' },
        };
        nodes.push(toNode);
        nodeById.set(toId, toNode);
      }
      
      edges.push({
        id: `${fromId}-${toId}`,
        source: fromId,
        target: toId,
        type: 'smoothstep',
      });
    }
  });

  return { nodes, edges };
}

function normalizeGraphForBackend(graph: { nodes: Node[]; edges: Edge[] }) {
  // Strip internal MongoDB fields to prevent version conflicts
  const stripInternalFields = (obj: any) => {
    const { _id, __v, createdAt, updatedAt, ...rest } = obj;
    return rest;
  };

  return {
    nodes: graph.nodes.map(stripInternalFields),
    edges: graph.edges.map(stripInternalFields),
  };
}

function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName?.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
}

export default function DiagramEditorPage() {
  const { diagramId } = useParams<{ diagramId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { currentDiagram, loadDiagram, updateDiagram, isLoading } = useDiagramStore();

  const [syntax, setSyntax] = useState('');
  const syntaxRef = useRef(syntax);
  useEffect(() => {
    syntaxRef.current = syntax;
  }, [syntax]);
  const [notes, setNotes] = useState<any>(null);
  const [title, setTitle] = useState('Untitled Diagram');
  const [lastSaved, setLastSaved] = useState<Date | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isVersionsOpen, setIsVersionsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [sharePassword, setSharePassword] = useState('');
  const [shareExpiresAt, setShareExpiresAt] = useState('');
  const [isShareBusy, setIsShareBusy] = useState(false);
  const [exportFormat] = useState<'png'>('png');
  const [exportScale, setExportScale] = useState<1 | 2 | 4>(2);
  const [isExportBusy, setIsExportBusy] = useState(false);
  const [lastExportUrl, setLastExportUrl] = useState('');
  const [leftPaneWidth, setLeftPaneWidth] = useState(22); // percent
  const [rightPaneWidth, setRightPaneWidth] = useState(16); // percent
  const [isPaletteVisible, setIsPaletteVisible] = useState(false);
  const [isResizing, setIsResizing] = useState<'left' | 'right' | null>(null);
  const layoutRef = useRef<HTMLDivElement | null>(null);
  const hydratedDiagramIdRef = useRef<string | null>(null);
  const loadDiagramIdRef = useRef<string | null>(null);
  /** When true, diagram text is driven by the code editor — never overwrite it from canvas parse/layout. */
  const codeAuthoritativeRef = useRef(true);
  const codeEditorApiRef = useRef<CodeEditorApi | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<string[]>([]);
  const [selectedNodeData, setSelectedNodeData] = useState<Node | null>(null);
  const [selectedEdgeData, setSelectedEdgeData] = useState<Edge | null>(null);
  const [canvasPaper, setCanvasPaper] = useState('#f8f4ef');
  const [canvasShowGrid, setCanvasShowGrid] = useState(true);
  const [canvasShowRuler, setCanvasShowRuler] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiOutput, setAiOutput] = useState('');
  const [isAIBusy, setIsAIBusy] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isCommentsBusy, setIsCommentsBusy] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);
  const [versionName, setVersionName] = useState('');
  const [isVersionsBusy, setIsVersionsBusy] = useState(false);

  const [localGraph, setLocalGraph] = useState<{ nodes: Node[]; edges: Edge[] } | null>(null);
  const [visualOverride, setVisualOverride] = useState(false);
  const latestGraphRef = useRef<{ nodes: Node[]; edges: Edge[] } | null>(null);
  const [canvasStats, setCanvasStats] = useState({ nodes: 0, edges: 0 });
  const pngExporterRef = useRef<((scale: number) => Promise<string>) | null>(null);

  const editorChromeRef = useRef<HTMLDivElement | null>(null);
  const toolbarShellRef = useRef<HTMLDivElement | null>(null);
  const codeShellRef = useRef<HTMLDivElement | null>(null);
  const paletteShellRef = useRef<HTMLDivElement | null>(null);
  const centerColumnRef = useRef<HTMLDivElement | null>(null);
  const inspectorShellRef = useRef<HTMLDivElement | null>(null);

  // Load diagram — only clear hydration when diagramId actually changes (avoids refetch wiping the editor).
  useEffect(() => {
    if (!diagramId) return;
    if (loadDiagramIdRef.current !== diagramId) {
      loadDiagramIdRef.current = diagramId;
      hydratedDiagramIdRef.current = null;
    }
    void loadDiagram(diagramId);
  }, [diagramId, loadDiagram]);

  useEffect(() => {
    if (searchParams.get('ai') === '1' && currentDiagram) {
      setIsAIOpen(true);
    }
  }, [searchParams, currentDiagram]);

  // Set initial diagram fields (notes load separately via /notes API)
  useEffect(() => {
    if (!currentDiagram) return;
    // Hydrate editor state once per diagram load; do not re-apply on every autosave/store merge.
    if (String(hydratedDiagramIdRef.current) === String(currentDiagram.id)) return;

    const serverSyn = (currentDiagram.syntax ?? '').trim();
    const localSyn = syntaxRef.current.trim();
    // GET can finish after the user already picked an example / typed — don't replace real content with empty server state.
    if (!(localSyn.length > 0 && serverSyn.length === 0)) {
      setSyntax(currentDiagram.syntax || '');
    }

    setTitle(currentDiagram.title || 'Untitled Diagram');

    const hasPersistedVisual =
      (currentDiagram.nodes?.length ?? 0) > 0 || (currentDiagram.edges?.length ?? 0) > 0

    if (hasPersistedVisual) {
      const hydrated = {
        nodes: currentDiagram.nodes as any,
        edges: currentDiagram.edges as any,
      };
      setLocalGraph(hydrated);
      latestGraphRef.current = hydrated;
      setVisualOverride(true);
      codeAuthoritativeRef.current = false;
    } else {
      setLocalGraph(null)
      // Don't reset latestGraphRef here - let canvas report the graph after parsing
      setVisualOverride(false)
      codeAuthoritativeRef.current = true
    }
    if (currentDiagram.isPublic && currentDiagram.publicLinkToken) {
      setShareUrl(`${window.location.origin}/public/${currentDiagram.publicLinkToken}`);
    }
    hydratedDiagramIdRef.current = String(currentDiagram.id);
  }, [currentDiagram]);

  useEffect(() => {
    if (!diagramId || !currentDiagram) return;
    let cancelled = false;
    void (async () => {
      try {
        const doc = await notesAPI.get(diagramId);
        if (!cancelled && doc) {
          // Backend stores TipTap JSON in `content`.
          setNotes(doc.content ?? null);
        }
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [diagramId, currentDiagram?.id]);


  const onCanvasUserGesture = useCallback(() => {
    codeAuthoritativeRef.current = false
    setVisualOverride(true)
  }, []);

  // Auto-save function
  const handleSave = useCallback(
    async (data: { syntax?: string; nodes?: Node[]; edges?: Edge[]; notes?: { content?: any; contentText?: string } }) => {
      if (!diagramId) return;

      try {
        setIsSaving(true);
        if ('notes' in data) {
          const payload = data.notes as
            | { content?: any; contentText?: string }
        }
      } catch (e) {
        // Ignore notes parsing errors
      }

      // Get graph data - prioritize passed data over ref
      let graphForSave: { nodes: Node[]; edges: Edge[] } | null = null;
      
      // If new nodes/edges were passed, use those
      if (data.nodes && data.nodes.length > 0) {
        graphForSave = { nodes: data.nodes, edges: data.edges || [] };
      } 
      // Otherwise fall back to latestGraphRef
      else if (latestGraphRef.current && latestGraphRef.current.nodes.length > 0) {
        graphForSave = latestGraphRef.current;
      }
      // Finally, try to parse from syntax
      else if (data.syntax || syntaxRef.current) {
        const parsed = parseSyntaxToGraph(data.syntax || syntaxRef.current);
        graphForSave = parsed;
      }

      const normalized = graphForSave
        ? normalizeGraphForBackend(graphForSave)
        : { nodes: data.nodes || [], edges: data.edges || [] };

      try {
        // Always save with nodes and edges if we have them
        await updateDiagram(diagramId, {
          title,
          syntax: data.syntax ?? syntaxRef.current,
          nodes: normalized.nodes.length > 0 ? normalized.nodes : undefined,
          edges: normalized.edges.length > 0 ? normalized.edges : undefined,
        });
        setLastSaved(new Date());
      } catch (error: any) {
        toast.error(error?.response?.data?.error?.message || 'Save failed');
      } finally {
        setIsSaving(false);
      }
    },
    [diagramId, title, updateDiagram, normalizeGraphForBackend]
  );

  // Auto-save hook with 5s delay and 30s maxWait to avoid rate limits
  const { save, saveNow } = useAutoSave({
    onSave: handleSave,
    delay: 5000,
    maxWait: 30000,
    enabled: !!diagramId,
  });

  // Manual save function
  const runQuickSave = useCallback(async () => {
    if (!diagramId) return;
    const graphForSave = latestGraphRef.current;
    await handleSave({ syntax, nodes: graphForSave?.nodes, edges: graphForSave?.edges });
    toast.success('Saved to database');
  }, [diagramId, syntax, handleSave]);

  // Keyboard shortcut for save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        runQuickSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [runQuickSave]);

  // Save before leaving page or hiding tab
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (diagramId && latestGraphRef.current) {
        // Use fetch with keepalive for reliable delivery during page unload
        const token = localStorage.getItem('token');
        fetch(`/api/v1/diagrams/${diagramId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          },
          body: JSON.stringify({
            title,
            syntax: syntaxRef.current,
            nodes: latestGraphRef.current.nodes,
            edges: latestGraphRef.current.edges,
          }),
          keepalive: true,
        }).catch(() => {}); // Ignore errors - we're leaving anyway
      }
    };
    
    // Also save when tab becomes hidden (more reliable than beforeunload)
    const handleVisibilityChange = () => {
      if (document.hidden && diagramId) {
        runQuickSave();
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [diagramId, runQuickSave, title]);

  // Handle syntax change
  const handleSyntaxChange = useCallback(
    (newSyntax: string, source: 'code' | 'visual') => {
      setSyntax(newSyntax);
      syntaxRef.current = newSyntax;

      if (source === 'code') {
        codeAuthoritativeRef.current = true
        setVisualOverride(false)
        setLocalGraph(null)
        // Don't reset latestGraphRef here - let canvas report the new graph after parsing
        // Only save the syntax now - the parsed nodes/edges will be reported back by canvas
        save({ 
          syntax: newSyntax,
        });
      } else {
        codeAuthoritativeRef.current = false
        setVisualOverride(true)
        // For visual changes, save with current graph data
        const graphForSave = latestGraphRef.current;
        save({ 
          syntax: newSyntax,
          nodes: graphForSave?.nodes,
          edges: graphForSave?.edges,
        });
      }
    },
    [save]
  );

  const handlePaletteInsert = useCallback(
    (snippet: string) => {
      const api = codeEditorApiRef.current;
      if (api) {
        api.insertText(snippet);
        return;
      }
      const next =
        (syntax ? `${syntax.replace(/\s*$/, '')}\n` : '') + snippet.replace(/^\n/, '');
      handleSyntaxChange(next, 'code');
    },
    [syntax, handleSyntaxChange]
  );

  // Prefer React Flow's live selection (always in sync with canvas). localGraph can lag behind by a tick.
  const selectedNode =
    selectedNodeData ??
    (selectedNodeId ? localGraph?.nodes?.find((n) => n.id === selectedNodeId) ?? null : null);
  const selectedEdge =
    selectedEdgeData ??
    (selectedEdgeId ? localGraph?.edges?.find((e) => e.id === selectedEdgeId) ?? null : null);

  const graphToSyntax = useCallback((nodes: Node[], edges: Edge[]): string => {
    const nodeById = new Map<string, { label: string; kind: string }>()
    nodes.forEach((n) => {
      nodeById.set(n.id, {
        label: String((n.data as any)?.label ?? n.id),
        kind: String((n.data as any)?.kind ?? 'node'),
      })
    })

    const wrap = (label: string, kind: string) => {
      if (kind === 'decision') return `{${label}}`
      if (kind === 'startend') return `(${label})`
      if (kind === 'database') return `[[${label}]]`
      return `[${label}]`
    }

    const lines: string[] = []
    const connectedNodeIds = new Set<string>()
    edges.forEach((e, i) => {
      const from = nodeById.get(e.source)
      const to = nodeById.get(e.target)
      if (!from || !to) return
      connectedNodeIds.add(e.source)
      connectedNodeIds.add(e.target)

      const fromRef = wrap(from.label, from.kind)
      const toRef = wrap(to.label, to.kind)

      const label = String(e.label ?? '').trim()
      if (label) {
        lines.push(`${fromRef} -- ${label} --> ${toRef}`)
      } else {
        lines.push(`${fromRef} --> ${toRef}`)
      }
    })

    // Preserve standalone nodes created from drag/drop or manual visual edits.
    nodes.forEach((n) => {
      if (connectedNodeIds.has(n.id)) return
      const info = nodeById.get(n.id)
      if (!info) return
      lines.push(wrap(info.label, info.kind))
    })

    return lines.join('\n')
  }, []);

  const updateVisualGraph = useCallback(
    (updater: (prev: { nodes: Node[]; edges: Edge[] }) => { nodes: Node[]; edges: Edge[] }) => {
      // If we're currently in 'code mode' (localGraph is null), start from the latest auto-layout state.
      const current = localGraph ?? latestGraphRef.current ?? { nodes: [], edges: [] };
      const next = updater(current);
      setLocalGraph(next);
      // CRITICAL: Also update latestGraphRef so saves get the latest data including styles
      latestGraphRef.current = next;
      const nextSyntax = graphToSyntax(next.nodes, next.edges);
      handleSyntaxChange(nextSyntax, 'visual');
    },
    [localGraph, handleSyntaxChange, graphToSyntax]
  );

  const handleRenameSelectedNode = useCallback(
    (nextLabel: string) => {
      const label = nextLabel.trim();
      if (!selectedNodeId || !label) return;
      updateVisualGraph((prev) => ({
        nodes: prev.nodes.map((n) =>
          n.id === selectedNodeId ? { ...n, data: { ...(n.data as any), label } } : n
        ),
        edges: prev.edges,
      }));
    },
    [selectedNodeId, updateVisualGraph]
  );

  const handleRenameSelectedEdge = useCallback(
    (nextLabel: string) => {
      const label = nextLabel.trim();
      if (!selectedEdgeId || !label) return;
      updateVisualGraph((prev) => ({
        nodes: prev.nodes,
        edges: prev.edges.map((e) =>
          e.id === selectedEdgeId ? { ...e, label } : e
        ),
      }));
    },
    [selectedEdgeId, updateVisualGraph]
  );

  const handleSelectedNodeKindChange = useCallback(
    (kind: 'node' | 'decision' | 'startend' | 'database' | 'entity' | 'actor' | 'queue' | 'io') => {
      const ids = selectedNodeIds.length > 0 ? selectedNodeIds : selectedNodeId ? [selectedNodeId] : [];
      if (ids.length === 0) return;
      updateVisualGraph((prev) => ({
        nodes: prev.nodes.map((n) =>
          ids.includes(n.id) ? { ...n, data: { ...(n.data as any), kind } } : n
        ),
        edges: prev.edges,
      }));
    },
    [selectedNodeId, selectedNodeIds, updateVisualGraph]
  );

  const handleDeleteSelectedNode = useCallback(() => {
    const ids = selectedNodeIds.length > 0 ? selectedNodeIds : selectedNodeId ? [selectedNodeId] : [];
    if (ids.length === 0) return;
    updateVisualGraph((prev) => ({
      nodes: prev.nodes.filter((n) => !ids.includes(n.id)),
      edges: prev.edges.filter((e) => !ids.includes(e.source) && !ids.includes(e.target)),
    }));
    setSelectedNodeId(null);
    setSelectedNodeIds([]);
  }, [selectedNodeId, selectedNodeIds, updateVisualGraph]);

  const handleDeleteSelectedEdge = useCallback(() => {
    const ids = selectedEdgeIds.length > 0 ? selectedEdgeIds : selectedEdgeId ? [selectedEdgeId] : [];
    if (ids.length === 0) return;
    updateVisualGraph((prev) => ({
      nodes: prev.nodes,
      edges: prev.edges.filter((edge) => !ids.includes(edge.id)),
    }));
    // Explicitly clear selection to prevent ghostly properties panel
    setSelectedEdgeId(null);
    setSelectedEdgeIds([]);
    setSelectedEdgeData(null);
  }, [selectedEdgeId, selectedEdgeIds, updateVisualGraph]);

  const handleDuplicateSelection = useCallback(() => {
    const ids = selectedNodeIds.length > 0 ? selectedNodeIds : selectedNodeId ? [selectedNodeId] : [];
    if (ids.length === 0) return;
    updateVisualGraph((prev) => {
      const clones = prev.nodes
        .filter((n) => ids.includes(n.id))
        .map((src, idx) => ({
          ...src,
          id: `n-${Date.now()}-${Math.random().toString(16).slice(2)}-${idx}`,
          position: { x: src.position.x + 36, y: src.position.y + 36 },
          data: { ...(src.data as any), label: `${String((src.data as any)?.label || 'Node')} Copy` },
        }));
      return { nodes: [...prev.nodes, ...clones], edges: prev.edges };
    });
  }, [selectedNodeId, selectedNodeIds, updateVisualGraph]);

  const handleResetNodeStyle = useCallback(() => {
    const ids = selectedNodeIds.length > 0 ? selectedNodeIds : selectedNodeId ? [selectedNodeId] : [];
    if (ids.length === 0) return;
    updateVisualGraph((prev) => ({
      nodes: prev.nodes.map((n) =>
        ids.includes(n.id)
          ? {
              ...n,
              data: {
                ...(n.data as any),
                style: undefined,
              },
            }
          : n
      ),
      edges: prev.edges,
    }));
  }, [selectedNodeId, selectedNodeIds, updateVisualGraph]);

  const handleSelectedNodeStyleChange = useCallback(
    (patch: {
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
    }) => {
      const ids = selectedNodeIds.length > 0 ? selectedNodeIds : selectedNodeId ? [selectedNodeId] : [];
      if (ids.length === 0) return;
      updateVisualGraph((prev) => ({
        nodes: prev.nodes.map((n) =>
          ids.includes(n.id)
            ? {
                ...n,
                data: {
                  ...(n.data as any),
                  style: (() => {
                    const base = { ...((n.data as any)?.style || {}), ...patch };
                    if (patch.fontFamily === 'inherit') delete (base as any).fontFamily;
                    return base;
                  })(),
                },
              }
            : n
        ),
        edges: prev.edges,
      }));
    },
    [selectedNodeId, selectedNodeIds, updateVisualGraph]
  );

  const handleSelectedEdgeStyleChange = useCallback(
    (patch: {
      stroke?: string;
      strokeWidth?: number;
      strokeDasharray?: string;
      labelColor?: string;
      labelFontSize?: number;
      markerEndType?: 'none' | 'arrow' | 'arrowclosed';
    }) => {
      const ids = selectedEdgeIds.length > 0 ? selectedEdgeIds : selectedEdgeId ? [selectedEdgeId] : [];
      if (ids.length === 0) return;

      const markerForStroke = (stroke: string, kind: 'arrow' | 'arrowclosed' | 'none') => {
        if (kind === 'none') return undefined;
        if (kind === 'arrow') return { type: MarkerType.Arrow, color: stroke, width: 18, height: 18 };
        return { type: MarkerType.ArrowClosed, color: stroke, width: 18, height: 18 };
      };

      const inferMarkerKind = (raw: unknown): 'arrow' | 'arrowclosed' | 'none' => {
        if (raw === undefined || raw === null) return 'arrowclosed';
        if (typeof raw === 'string') {
          const s = raw.toLowerCase();
          if (s === 'none') return 'none';
          if (s === 'arrow') return 'arrow';
          return 'arrowclosed';
        }
        const t = String((raw as { type?: string })?.type || '').toLowerCase();
        if (t.includes('arrow') && !t.includes('closed')) return 'arrow';
        return 'arrowclosed';
      };

      updateVisualGraph((prev) => ({
        nodes: prev.nodes,
        edges: prev.edges.map((e) => {
          if (!ids.includes(e.id)) return e;
          const prevSt = (e.style as Record<string, unknown>) || {};
          const nextStyle = {
            ...prevSt,
            ...(patch.stroke !== undefined ? { stroke: patch.stroke } : {}),
            ...(patch.strokeWidth !== undefined ? { strokeWidth: patch.strokeWidth } : {}),
            ...(patch.strokeDasharray !== undefined ? { strokeDasharray: patch.strokeDasharray } : {}),
          };
          const strokeColor = String(nextStyle.stroke || prevSt.stroke || '#c99367');

          let nextMarker: unknown = e.markerEnd;
          if (patch.markerEndType === 'none') {
            nextMarker = undefined;
          } else if (patch.markerEndType === 'arrow') {
            nextMarker = markerForStroke(strokeColor, 'arrow');
          } else if (patch.markerEndType === 'arrowclosed') {
            nextMarker = markerForStroke(strokeColor, 'arrowclosed');
          } else if (patch.stroke !== undefined || patch.strokeWidth !== undefined) {
            const kind = inferMarkerKind(e.markerEnd);
            nextMarker = kind === 'none' ? undefined : markerForStroke(strokeColor, kind);
          }

          const nextLabel = {
            ...((e as any).labelStyle || {}),
            ...(patch.labelColor !== undefined ? { fill: patch.labelColor } : {}),
            ...(patch.labelFontSize !== undefined ? { fontSize: patch.labelFontSize } : {}),
          };

          return {
            ...e,
            style: nextStyle,
            markerEnd: nextMarker as any,
            labelStyle: nextLabel,
          } as Edge;
        }),
      }));
    },
    [selectedEdgeId, selectedEdgeIds, updateVisualGraph]
  );

  const handleMoveToFront = useCallback(() => {
    const ids = selectedNodeIds.length > 0 ? selectedNodeIds : selectedNodeId ? [selectedNodeId] : [];
    if (ids.length === 0) return;
    updateVisualGraph((prev) => {
      const remaining = prev.nodes.filter((n) => !ids.includes(n.id));
      const target = prev.nodes.filter((n) => ids.includes(n.id));
      return { nodes: [...remaining, ...target], edges: prev.edges };
    });
  }, [selectedNodeId, selectedNodeIds, updateVisualGraph]);

  const handleMoveToBack = useCallback(() => {
    const ids = selectedNodeIds.length > 0 ? selectedNodeIds : selectedNodeId ? [selectedNodeId] : [];
    if (ids.length === 0) return;
    updateVisualGraph((prev) => {
      const remaining = prev.nodes.filter((n) => !ids.includes(n.id));
      const target = prev.nodes.filter((n) => ids.includes(n.id));
      return { nodes: [...target, ...remaining], edges: prev.edges };
    });
  }, [selectedNodeId, selectedNodeIds, updateVisualGraph]);

  const handleAlign = useCallback((mode: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (selectedNodeIds.length < 2) return;
    updateVisualGraph((prev) => {
      const targets = prev.nodes.filter(n => selectedNodeIds.includes(n.id));
      if (targets.length < 2) return prev;

      let value: number = 0;
      if (mode === 'left') value = Math.min(...targets.map(n => n.position.x));
      else if (mode === 'right') {
        const widths = targets.map(n => n.position.x + Number((n.data as any)?.style?.width || 160));
        value = Math.max(...widths);
      }
      else if (mode === 'top') value = Math.min(...targets.map(n => n.position.y));
      else if (mode === 'bottom') {
        const heights = targets.map(n => n.position.y + Number((n.data as any)?.style?.height || 52));
        value = Math.max(...heights);
      }
      else if (mode === 'center') {
        const minX = Math.min(...targets.map(n => n.position.x));
        const maxX = Math.max(...targets.map(n => n.position.x + Number((n.data as any)?.style?.width || 160)));
        value = (minX + maxX) / 2;
      }
      else if (mode === 'middle') {
        const minY = Math.min(...targets.map(n => n.position.y));
        const maxY = Math.max(...targets.map(n => n.position.y + Number((n.data as any)?.style?.height || 52)));
        value = (minY + maxY) / 2;
      }
      
      return {
        nodes: prev.nodes.map(n => {
          if (!selectedNodeIds.includes(n.id)) return n;
          const style = (n.data as any)?.style || {};
          const w = Number(style.width || 160);
          const h = Number(style.height || 52);
          let nextPos = { ...n.position };
          
          if (mode === 'left') nextPos.x = value;
          else if (mode === 'right') nextPos.x = value - w;
          else if (mode === 'top') nextPos.y = value;
          else if (mode === 'bottom') nextPos.y = value - h;
          else if (mode === 'center') nextPos.x = value - (w / 2);
          else if (mode === 'middle') nextPos.y = value - (h / 2);
          
          return { ...n, position: nextPos };
        }),
        edges: prev.edges
      }
    });
  }, [selectedNodeIds, updateVisualGraph]);

  // Handle notes change
  const handleNotesChange = useCallback(
    (payload: { content: any; contentText: string }) => {
      setNotes(payload.content);
      save({ notes: payload });
    },
    [save]
  );

  // Handle title change
  const handleTitleChange = useCallback(
    (newTitle: string) => {
      setTitle(newTitle);
      save({ title: newTitle });
    },
    [save]
  );

  const pollExportDownloadUrl = useCallback(async (jobId: string): Promise<string> => {
    const maxPolls = 30;
    for (let i = 0; i < maxPolls; i += 1) {
      const statusRes = await exportAPI.getStatus(jobId);
      const status = statusRes.data?.data?.status;
      if (status === 'done') {
        const dl = await exportAPI.getDownloadInfo(jobId);
        const url = dl.data?.data?.fileUrl;
        if (!url) throw new Error('Download URL missing');
        return url;
      }
      if (status === 'failed') {
        throw new Error(statusRes.data?.data?.errorMessage || 'Export failed');
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    throw new Error('Export timed out');
  }, []);

  // Handle share
  const handleShare = () => {
    setIsShareOpen(true);
  };

  // Handle export
  const handleExport = () => {
    setIsExportOpen(true);
  };

  // Handle AI assist
  const handleAIAssist = () => {
    setIsAIOpen(true);
  };

  const handleCommentsOpen = useCallback(async () => {
    if (!diagramId) return;
    setIsCommentsOpen(true);
    setIsCommentsBusy(true);
    try {
      const res = await commentAPI.list(diagramId);
      setComments(res.data?.data || []);
    } catch {
      toast.error('Failed to load comments');
    } finally {
      setIsCommentsBusy(false);
    }
  }, [diagramId]);

  const handleVersionsOpen = useCallback(async () => {
    if (!diagramId) return;
    setIsVersionsOpen(true);
    setIsVersionsBusy(true);
    try {
      const res = await diagramAPI.getVersions(diagramId);
      setVersions(res.data?.data || []);
    } catch {
      toast.error('Failed to load versions');
    } finally {
      setIsVersionsBusy(false);
    }
  }, [diagramId]);

  const createShareLink = useCallback(async () => {
    if (!diagramId) return;
    if (shareExpiresAt && new Date(shareExpiresAt).getTime() <= Date.now()) {
      toast.error('Expiry must be in the future');
      return;
    }
    if (sharePassword && sharePassword.length < 4) {
      toast.error('Password must be at least 4 characters');
      return;
    }
    setIsShareBusy(true);
    try {
      const expiresAt = shareExpiresAt ? new Date(shareExpiresAt).toISOString() : undefined;
      const res = await diagramAPI.share(diagramId, {
        expiresAt,
        password: sharePassword || undefined,
      });
      const nextUrl = res.data?.data?.url || '';
      setShareUrl(nextUrl);
      toast.success('Share link created');
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message || 'Failed to create share link');
    } finally {
      setIsShareBusy(false);
    }
  }, [diagramId, shareExpiresAt, sharePassword]);

  const revokeShareLink = useCallback(async () => {
    if (!diagramId) return;
    setIsShareBusy(true);
    try {
      await diagramAPI.revokeShare(diagramId);
      setShareUrl('');
      setSharePassword('');
      setShareExpiresAt('');
      toast.success('Share link revoked');
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message || 'Failed to revoke link');
    } finally {
      setIsShareBusy(false);
    }
  }, [diagramId]);

  const runExport = useCallback(async () => {
    // PNG export only
    if (pngExporterRef.current) {
      setIsExportBusy(true);
      try {
        const dataUrl = await pngExporterRef.current(exportScale);
        setLastExportUrl(dataUrl);
        toast.success('PNG export ready. Click Download.');
      } catch (error: any) {
        toast.error(error?.message || 'PNG export failed');
      } finally {
        setIsExportBusy(false);
      }
    }
  }, [exportScale]);

  const runAIGenerate = useCallback(async () => {
    if (!diagramId || !aiPrompt.trim()) {
      toast.error('Enter a prompt first');
      return;
    }
    setIsAIBusy(true);
    try {
      const res = await aiAPI.generate({
        prompt: aiPrompt.trim(),
        diagramType: currentDiagram?.type || 'flowchart',
        diagramId,
      });
      const nextSyntax = res.data?.data?.syntax || '';
      if (!nextSyntax) throw new Error('AI returned empty output');
      setAiOutput(nextSyntax);
      handleSyntaxChange(nextSyntax, 'code');
      toast.success('AI generated diagram syntax');
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message || 'AI generation failed');
    } finally {
      setIsAIBusy(false);
    }
  }, [aiPrompt, currentDiagram?.type, diagramId, handleSyntaxChange]);

  const runAIExplain = useCallback(async () => {
    if (!diagramId) return;
    setIsAIBusy(true);
    try {
      const res = await aiAPI.explain({ diagramId });
      setAiOutput(res.data?.data?.explanation || 'No explanation returned');
      toast.success('Explanation ready');
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message || 'AI explain failed');
    } finally {
      setIsAIBusy(false);
    }
  }, [diagramId]);

  const applyAiOutputToCode = useCallback(
    (mode: 'replace' | 'append') => {
      const text = aiOutput.trim();
      if (!text) {
        toast.error('No AI output to apply yet');
        return;
      }
      if (mode === 'replace') {
        handleSyntaxChange(text, 'code');
      } else {
        const cur = syntaxRef.current.trim();
        const next = cur ? `${cur}\n\n${text}` : text;
        handleSyntaxChange(next, 'code');
      }
      toast.success(mode === 'replace' ? 'Diagram code replaced' : 'Diagram code appended');
      // Close AI modal after applying code
      setIsAIOpen(false);
    },
    [aiOutput, handleSyntaxChange]
  );

  const runAIImprove = useCallback(async () => {
    if (!diagramId) return;
    setIsAIBusy(true);
    try {
      const res = await aiAPI.improve(diagramId);
      const improved = res.data?.data?.improvedSyntax || res.data?.data?.syntax || '';
      const suggestions = res.data?.data?.suggestions || [];
      if (improved) {
        handleSyntaxChange(improved, 'code');
      }
      const textSuggestions = Array.isArray(suggestions)
        ? suggestions.map((s: any) => (typeof s === 'string' ? s : JSON.stringify(s))).join('\n')
        : '';
      setAiOutput(improved || textSuggestions || 'No improvements returned');
      toast.success('Improvement completed');
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message || 'AI improve failed');
    } finally {
      setIsAIBusy(false);
    }
  }, [diagramId, handleSyntaxChange]);

  const submitNewComment = useCallback(async () => {
    if (!diagramId || !newComment.trim() || isCommentsBusy) return;
    setIsCommentsBusy(true);
    try {
      await commentAPI.create(diagramId, { content: newComment.trim() });
      setNewComment('');
      const res = await commentAPI.list(diagramId);
      setComments(res.data?.data || []);
    } catch {
      toast.error('Failed to add comment');
    } finally {
      setIsCommentsBusy(false);
    }
  }, [diagramId, newComment, isCommentsBusy]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const mod = e.ctrlKey || e.metaKey;

      // Global escape behavior: close open modal first.
      if (key === 'escape') {
        if (isExportOpen) setIsExportOpen(false);
        else if (isShareOpen) setIsShareOpen(false);
        else if (isAIOpen) setIsAIOpen(false);
        else if (isCommentsOpen) setIsCommentsOpen(false);
        else if (isVersionsOpen) setIsVersionsOpen(false);
        else if (isShortcutsOpen) setIsShortcutsOpen(false);
        return;
      }

      if ((key === 'backspace' || key === 'delete') && !isEditableTarget(e.target)) {
        if (!(selectedNodeId || selectedNodeIds.length > 0 || selectedEdgeId || selectedEdgeIds.length > 0)) return;
        e.preventDefault();
        if (selectedNodeId || selectedNodeIds.length > 0) {
          handleDeleteSelectedNode();
        } else if (selectedEdgeId || selectedEdgeIds.length > 0) {
          const ids = selectedEdgeIds.length > 0 ? selectedEdgeIds : selectedEdgeId ? [selectedEdgeId] : [];
          updateVisualGraph((prev) => ({
            nodes: prev.nodes,
            edges: prev.edges.filter((edge) => !ids.includes(edge.id)),
          }));
          setSelectedEdgeId(null);
          setSelectedEdgeIds([]);
        }
        return;
      }

      // Allow plain typing in inputs/editors.
      if (!mod) return;

      if (key === 's') {
        e.preventDefault();
        if (e.shiftKey) {
          setIsShareOpen(true);
          return;
        }
        void runQuickSave();
        return;
      }

      if (key === '?' || (e.shiftKey && key === '/')) {
        e.preventDefault();
        setIsShortcutsOpen(true);
        return;
      }

      if (key === 'e') {
        e.preventDefault();
        setIsExportOpen(true);
        return;
      }

      if (key === 'i') {
        e.preventDefault();
        setIsAIOpen(true);
        return;
      }

      if (key === 'd' && !isEditableTarget(e.target)) {
        const ids = selectedNodeIds.length > 0 ? selectedNodeIds : selectedNodeId ? [selectedNodeId] : [];
        if (ids.length === 0) return;
        e.preventDefault();
        handleDuplicateSelection();
        return;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    isExportOpen,
    isShareOpen,
    isAIOpen,
    isCommentsOpen,
    isVersionsOpen,
    isShortcutsOpen,
    runQuickSave,
    selectedNodeId,
    selectedEdgeId,
    selectedNodeIds,
    selectedEdgeIds,
    handleDeleteSelectedNode,
    handleDuplicateSelection,
  ]);

  useEffect(() => {
    if (!isResizing) return;
    const onMove = (e: MouseEvent) => {
      if (!layoutRef.current) return;
      const rect = layoutRef.current.getBoundingClientRect();
      const xPct = ((e.clientX - rect.left) / rect.width) * 100;
      if (isResizing === 'left') {
        const next = Math.max(22, Math.min(55, xPct));
        // Keep center at least 23%
        if (100 - next - rightPaneWidth >= 23) setLeftPaneWidth(next);
      } else {
        const nextRight = Math.max(18, Math.min(35, 100 - xPct));
        if (100 - leftPaneWidth - nextRight >= 23) setRightPaneWidth(nextRight);
      }
    };
    const onUp = () => setIsResizing(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isResizing, leftPaneWidth, rightPaneWidth]);

  useEffect(() => {
    if (localGraph && localGraph.nodes && localGraph.edges) {
      setCanvasStats({ nodes: localGraph.nodes.length, edges: localGraph.edges.length });
    }
  }, [localGraph]);

  useLayoutEffect(() => {
    if (isLoading || !currentDiagram) return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const root = editorChromeRef.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      const toolbar = toolbarShellRef.current;
      if (toolbar) {
        gsap.fromTo(
          toolbar,
          { y: -14, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.48, ease: 'power3.out', clearProps: 'transform' }
        );
      }
      const cols = [
        codeShellRef.current,
        paletteShellRef.current,
        centerColumnRef.current,
        inspectorShellRef.current,
      ].filter(Boolean) as HTMLElement[];
      if (cols.length) {
        gsap.fromTo(
          cols,
          { opacity: 0, y: 16 },
          {
            opacity: 1,
            y: 0,
            duration: 0.42,
            stagger: 0.06,
            ease: 'power2.out',
            delay: 0.08,
            clearProps: 'transform',
          }
        );
      }
    }, root);
    return () => ctx.revert();
  }, [isLoading, currentDiagram?.id]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!currentDiagram && !isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Diagram not found</h2>
          <p className="text-muted-foreground mb-4">
            The diagram you're looking for doesn't exist or you don't have access to it.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={editorChromeRef} className="h-screen flex flex-col bg-background">
      <div ref={toolbarShellRef} className="shrink-0">
        <Toolbar
          title={title}
          onTitleChange={handleTitleChange}
          isSaving={isSaving}
          lastSaved={lastSaved}
          onShare={handleShare}
          onExport={handleExport}
          onAIAssist={handleAIAssist}
          onComments={handleCommentsOpen}
          onVersions={handleVersionsOpen}
          onShortcuts={() => setIsShortcutsOpen(true)}
          onSave={runQuickSave}
        />
      </div>

      <div ref={layoutRef} className="flex-1 flex overflow-hidden min-h-0">
        {/* Code Editor - Left */}
        <div
          ref={codeShellRef}
          style={{ width: `${leftPaneWidth}%` }}
          className="min-w-[260px] max-w-[680px] min-h-0 flex flex-col overflow-visible"
        >
          <CodeEditor
            value={syntax}
            onChange={(v) => handleSyntaxChange(v, 'code')}
            editorApiRef={codeEditorApiRef}
          />
        </div>
        <div
          role="separator"
          aria-label="Resize code panel"
          className={`w-[3px] cursor-col-resize hover:bg-primary/50 transition-colors ${isResizing === 'left' ? 'bg-primary/60' : 'bg-border/40'}`}
          onMouseDown={() => setIsResizing('left')}
        />

        {/* Canvas + Notes - Center */}
        <div ref={centerColumnRef} className="flex-1 flex flex-col min-w-[280px] min-h-0">
          {/* Canvas toolbar strip */}
          <div className="shrink-0 h-9 border-b border-border/40 bg-card/60 backdrop-blur flex items-center px-3 gap-2">
            {/* Palette toggle */}
            <button
              type="button"
              onClick={() => setIsPaletteVisible((v) => !v)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                isPaletteVisible
                  ? 'bg-primary/12 text-primary border border-primary/30'
                  : 'text-muted-foreground/50 hover:text-foreground hover:bg-muted/40 border border-transparent'
              }`}
              title="Toggle shape palette (P)"
            >
              <LayoutGrid className="w-3 h-3" />
              Shapes
            </button>

            {/* Divider */}
            <div className="h-4 w-px bg-border/40" />

            {/* Stats */}
            {canvasStats.nodes > 0 && (
              <span className="text-[10px] text-muted-foreground/40 font-mono tabular-nums">
                {canvasStats.nodes} nodes · {canvasStats.edges} edges
              </span>
            )}

            {/* Spacer */}
            <div className="flex-1" />
          </div>
          <div className="flex-1 flex overflow-hidden">
            {/* inline palette when visible */}
            {isPaletteVisible && (
              <div className="w-[190px] min-w-[160px] max-w-[220px] shrink-0 h-full border-r border-border/50">
                <ShapePalette onInsert={handlePaletteInsert} />
              </div>
            )}
            <div className="flex-1 flex flex-col overflow-hidden">
              <DiagramCanvas
                syntax={syntax}
                visualData={visualOverride && localGraph ? localGraph : undefined}
                paperColor={canvasPaper}
                showGrid={canvasShowGrid}
                showRuler={canvasShowRuler}
                onRegisterPngExporter={(exporter) => { pngExporterRef.current = exporter; }}
                onSelectionChange={({ nodeId, edgeId, nodeIds, edgeIds, selectedNode, selectedEdge }) => {
                  setSelectedNodeId(nodeId);
                  setSelectedEdgeId(edgeId);
                  setSelectedNodeIds(nodeIds);
                  setSelectedEdgeIds(edgeIds);
                  setSelectedNodeData(selectedNode);
                  setSelectedEdgeData(selectedEdge);
                }}
                onGraphChange={(graph) => {
                  latestGraphRef.current = graph;
                  setCanvasStats({ nodes: graph.nodes.length, edges: graph.edges.length });
                  // When code is authoritative, save the parsed graph to persist nodes/edges
                  // Use save (not saveNow) to allow throttling and prevent rate limits
                  if (codeAuthoritativeRef.current) {
                    save({ 
                      syntax: syntaxRef.current,
                      nodes: graph.nodes,
                      edges: graph.edges,
                    });
                  }
                }}
                onCanvasUserGesture={onCanvasUserGesture}
                onUserGraphChange={(graph) => {
                  latestGraphRef.current = graph;
                  if (codeAuthoritativeRef.current) {
                    return;
                  }
                  const snapshot = {
                    nodes: graph.nodes.map((n) => ({ ...n })),
                    edges: graph.edges.map((e) => ({ ...e })),
                  };
                  const nextSyntax = graphToSyntax(snapshot.nodes, snapshot.edges);
                  if (nextSyntax.trim() !== syntaxRef.current.trim()) {
                    setLocalGraph(snapshot);
                    handleSyntaxChange(nextSyntax, 'visual');
                  }
                }}
              />
            </div>
          </div>
          <NotesEditor value={notes} onChange={handleNotesChange} />
        </div>
        <div
          role="separator"
          aria-label="Resize properties panel"
          className={`w-[3px] cursor-col-resize hover:bg-primary/50 transition-colors ${isResizing === 'right' ? 'bg-primary/60' : 'bg-border/40'}`}
          onMouseDown={() => setIsResizing('right')}
        />

        {/* Properties Panel - Right */}
        <div
          ref={inspectorShellRef}
          style={{ width: `${rightPaneWidth}%` }}
          className="min-w-[240px] max-w-[440px] min-h-0 flex flex-col"
        >
          <PropertiesPanel
            selectedNode={selectedNode}
            selectedEdge={selectedEdge as any}
            selectedNodeCount={selectedNodeIds.length}
            selectedEdgeCount={selectedEdgeIds.length}
            nodeCount={canvasStats.nodes}
            edgeCount={canvasStats.edges}
            paperColor={canvasPaper}
            onPaperColorChange={setCanvasPaper}
            showGrid={canvasShowGrid}
            onShowGridChange={setCanvasShowGrid}
            showRuler={canvasShowRuler}
            onShowRulerChange={setCanvasShowRuler}
            onRenameNode={handleRenameSelectedNode}
            onRenameEdge={handleRenameSelectedEdge}
            onNodeKindChange={handleSelectedNodeKindChange}
            onNodeStyleChange={handleSelectedNodeStyleChange}
            onEdgeStyleChange={handleSelectedEdgeStyleChange}
            onDeleteNode={handleDeleteSelectedNode}
            onDeleteEdge={handleDeleteSelectedEdge}
            onDuplicateNodes={handleDuplicateSelection}
            onResetNodeStyle={handleResetNodeStyle}
            onMoveToFront={handleMoveToFront}
            onMoveToBack={handleMoveToBack}
            onAlign={handleAlign}
          />
        </div>
      </div>


      <Modal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        title="Share Diagram"
        description="Collaborate with others via a secure link or workspace invite."
        size="md"
      >
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="rounded-xl border border-primary/15 bg-primary/5 p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-foreground">Invite collaborators</h3>
                  <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                    For full real-time collaboration, add people directly to your workspace.
                  </p>
                </div>
                <RouterLink
                  to="/workspace"
                  className="px-4 py-2 rounded-lg bg-primary text-white text-[11px] font-bold uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all"
                >
                  Go to Invites
                </RouterLink>
              </div>
            </div>

            <div className="w-full border-t border-border/30" />

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">Access Password</label>
                <input
                  type="password"
                  value={sharePassword}
                  onChange={(e) => setSharePassword(e.target.value)}
                  placeholder="Optional protection"
                  className="w-full rounded-[14px] border border-border/60 bg-background/50 px-4 py-3 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">Expiry Date</label>
                <input
                  type="datetime-local"
                  value={shareExpiresAt}
                  onChange={(e) => setShareExpiresAt(e.target.value)}
                  className="w-full rounded-[14px] border border-border/60 bg-background/50 px-4 py-3 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
            </div>
            {shareExpiresAt && new Date(shareExpiresAt).getTime() <= Date.now() && (
              <p className="text-[11px] font-medium text-destructive/80 px-1">⚠️ Expiry must be in the future.</p>
            )}
          </div>

          {shareUrl && (
            <div className="group/link relative rounded-2xl border border-primary/20 bg-primary/5 p-4 transition-all hover:bg-primary/8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-primary/70">Public Link</span>
                <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
              </div>
              <div className="text-sm font-mono break-all text-foreground/80 pr-10">{shareUrl}</div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl).then(() => toast.success('Link copied'));
                }}
                className="absolute right-4 bottom-4 flex h-8 w-8 items-center justify-center rounded-lg bg-background border border-border/40 shadow-sm transition-all hover:border-primary/40 hover:text-primary active:scale-90"
              >
                <LinkIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex flex-col gap-2 pt-1">
            <Button
              onClick={createShareLink}
              isLoading={isShareBusy}
              className="h-11 rounded-xl font-semibold shadow-md shadow-primary/15"
            >
              {shareUrl ? 'Update Settings' : 'Generate Secure Link'}
            </Button>
            {shareUrl && (
              <Button
                variant="outline"
                onClick={revokeShareLink}
                isLoading={isShareBusy}
                className="h-11 rounded-xl border-destructive/20 text-destructive/80 hover:bg-destructive/5 font-semibold"
              >
                Revoke All Access
              </Button>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        title="Export Assets"
        description="High-fidelity export for your documents and presentations."
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-primary/5 border border-primary/20">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-semibold text-primary">PNG Export</span>
              <p className="text-[11px] text-muted-foreground">High resolution image</p>
            </div>
          </div>

          <div className="rounded-xl border border-border/40 bg-muted/25 p-3">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-3">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> PNG Image
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground/75">
              Ultra-high resolution raster image. Supports up to 4x scaling for large displays and print.
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Export Scale</label>
            <div className="grid grid-cols-3 gap-2 p-1 rounded-2xl bg-muted/40 border border-border/40">
              {[1, 2, 4].map((s) => (
                <button
                  key={s}
                  onClick={() => setExportScale(s as any)}
                  className={cn(
                    'py-2.5 rounded-xl text-xs font-black transition-all',
                    exportScale === s
                      ? 'bg-background text-primary shadow-sm'
                      : 'text-muted-foreground/40 hover:text-foreground/60'
                  )}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          <div className="pt-1">
            <Button
              onClick={runExport}
              isLoading={isExportBusy}
              className="h-11 w-full rounded-xl text-xs font-semibold uppercase tracking-wide shadow-md shadow-primary/15"
            >
              {isExportBusy ? 'Preparing…' : 'Export'}
            </Button>
          </div>

          {lastExportUrl && (
            <div className="group/dl relative mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4 text-center animate-in slide-in-from-bottom-2 duration-300">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Download className="h-5 w-5" />
              </div>
              <h4 className="mb-1 text-sm font-semibold text-foreground">Ready</h4>
              <p className="mb-4 truncate px-2 font-mono text-[10px] text-muted-foreground/70">{lastExportUrl}</p>
              <div className="flex gap-2">
                <Button
                  className="h-10 flex-1 rounded-lg text-xs font-semibold shadow-sm"
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = lastExportUrl;
                    a.download = `${title || 'diagram'}.png`;
                    a.click();
                  }}
                >
                  Download File
                </Button>
                <Button
                  variant="outline"
                  className="h-10 rounded-lg text-xs font-semibold"
                  onClick={() => {
                    navigator.clipboard.writeText(lastExportUrl).then(() => toast.success('Link copied'));
                  }}
                >
                  Copy Link
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        title="AI assistant"
        description="Generate diagram syntax from a prompt. Matches the code panel: nodes, arrows, labeled edges."
        size="xl"
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-border/40 bg-muted/20 px-4 py-3 text-[11px] leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">Syntax:</span>{' '}
            <code className="rounded bg-background/80 px-1 py-0.5 text-[10px]">--&gt;</code>,{' '}
            <code className="rounded bg-background/80 px-1 py-0.5 text-[10px]">-&gt;</code>, or{' '}
            <code className="rounded bg-background/80 px-1 py-0.5 text-[10px]">=&gt;</code>{' '}
            between nodes. One connection per line works best.
          </div>

          <div className="relative">
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="E.g. Create a microservices architecture for an e-commerce platform with Redis cache and PostgreSQL..."
              rows={5}
              className="w-full rounded-2xl border border-border/60 bg-background/50 px-5 py-4 text-sm focus:bg-background focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted-foreground/30 leading-relaxed scrollbar-hide"
            />
            <div className="absolute right-3 bottom-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary/5 text-primary/40">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={runAIGenerate}
                disabled={isAIBusy}
                className="flex items-center gap-2 rounded-[14px] bg-primary px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:translate-y-[-1px] active:scale-95 disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                Generate code
              </button>
              <button
                onClick={runAIImprove}
                disabled={isAIBusy}
                className="flex items-center gap-2 rounded-[14px] border border-border/60 bg-background/50 px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-foreground/70 transition-all hover:bg-background hover:border-primary/40 hover:text-primary active:scale-95 disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5" />
                Improve
              </button>
              <button
                onClick={runAIExplain}
                disabled={isAIBusy}
                className="flex items-center gap-2 rounded-[14px] border border-border/60 bg-background/50 px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-foreground/70 transition-all hover:bg-background hover:border-primary/40 hover:text-primary active:scale-95 disabled:opacity-50"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                Explain
              </button>
            </div>
            {isAIBusy && (
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Working…
              </span>
            )}
          </div>

          {aiOutput && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-500">
              <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1 flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-primary" /> Output
              </label>
              <div className="relative group overflow-hidden rounded-2xl border border-border/40 bg-muted/30">
                <pre className="max-h-72 overflow-auto p-5 text-xs font-mono leading-relaxed text-foreground/80 scrollbar-hide whitespace-pre-wrap">
                  {aiOutput}
                </pre>
                <div className="absolute inset-0 pointer-events-none border border-inset border-white/5 rounded-2xl" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="primary"
                  className="rounded-xl text-xs font-bold"
                  onClick={() => applyAiOutputToCode('replace')}
                >
                  Replace diagram code
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl text-xs font-bold"
                  onClick={() => applyAiOutputToCode('append')}
                >
                  Append to code
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-xl text-xs font-bold gap-2"
                  onClick={() => {
                    void navigator.clipboard.writeText(aiOutput).then(() => toast.success('Copied'));
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground/70">
                Generate already updates the diagram when the model returns syntax. Use the buttons above if you edited the output or used Explain.
              </p>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
        title="Comments"
        description="Discuss this diagram with your team."
        size="xl"
      >
        <div className="flex h-[min(58vh,420px)] flex-col gap-4">
          <div className="relative shrink-0">
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !isCommentsBusy) {
                  e.preventDefault();
                  void submitNewComment();
                }
              }}
              placeholder="Add a thought or request feedback..."
              className="w-full rounded-[20px] border border-border/60 bg-background/50 pl-5 pr-32 py-4 text-sm focus:bg-background focus:ring-4 focus:ring-primary/10 outline-none transition-all"
            />
            <div className="absolute right-2 top-1.5 bottom-1.5 flex items-center">
              <Button
                isLoading={isCommentsBusy}
                className="h-full px-6 rounded-[16px] font-bold text-xs"
                onClick={() => void submitNewComment()}
              >
                Send
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
            {comments.length === 0 && !isCommentsBusy && (
              <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-muted/30">
                  <MessageSquare className="w-7 h-7 text-muted-foreground" />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest mb-1">Silence is golden</p>
                <p className="max-w-[200px] text-[10px] font-medium leading-relaxed">No threads yet. Be the first to start a conversation about this diagram.</p>
              </div>
            )}
            {comments.map((comment) => (
              <div key={comment._id || comment.id} className="relative group rounded-2xl border border-border/40 p-5 bg-background/40 transition-all hover:bg-background/60 hover:border-primary/20">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary/10 to-primary/30 flex items-center justify-center text-primary font-black text-xs shadow-inner">
                      {(comment.authorId?.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground/90">{comment.authorId?.name || 'Collaborator'}</div>
                      <div className="text-[10px] font-semibold text-muted-foreground/50 tracking-tighter uppercase">{new Date(comment.createdAt).toLocaleDateString()} at {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                  {!comment.resolved && (
                    <button
                      onClick={async () => {
                        if (!diagramId) return;
                        try {
                          await commentAPI.resolve(diagramId, comment._id || comment.id);
                          const res = await commentAPI.list(diagramId);
                          setComments(res.data?.data || []);
                          toast.success('Thread resolved');
                        } catch {
                          toast.error('Resolution failed');
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-primary/60 hover:bg-primary/10 hover:text-primary transition-all active:scale-95"
                    >
                      Resolve
                    </button>
                  )}
                  {comment.resolved && (
                    <div className="rounded-full bg-success-500/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-success-600">Resolved</div>
                  )}
                </div>
                <div className="text-sm font-medium leading-relaxed text-foreground/80 pl-12">{comment.content}</div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isVersionsOpen}
        onClose={() => setIsVersionsOpen(false)}
        title="Versions"
        description="Save snapshots and restore earlier states."
        size="xl"
      >
        <div className="flex h-[min(58vh,420px)] flex-col gap-4">
          <div className="relative shrink-0">
            <input
              value={versionName}
              onChange={(e) => setVersionName(e.target.value)}
              placeholder="Snapshot name (e.g. V1.2 Initial Database Schema)..."
              className="w-full rounded-[20px] border border-border/60 bg-background/50 pl-5 pr-44 py-4 text-sm focus:bg-background focus:ring-4 focus:ring-primary/10 outline-none transition-all"
            />
            <div className="absolute right-2 top-1.5 bottom-1.5 flex items-center">
              <Button
                isLoading={isVersionsBusy}
                className="h-full px-6 rounded-[16px] font-bold text-xs shadow-md shadow-primary/20"
                onClick={async () => {
                  if (!diagramId) return;
                  setIsVersionsBusy(true);
                  try {
                    await diagramAPI.saveVersion(diagramId, versionName || `Snapshot ${new Date().toLocaleString()}`);
                    setVersionName('');
                    const res = await diagramAPI.getVersions(diagramId);
                    setVersions(res.data?.data || []);
                    toast.success('Snapshot preserved');
                  } catch {
                    toast.error('Failed to preserve snapshot');
                  } finally {
                    setIsVersionsBusy(false);
                  }
                }}
              >
                Capture Snapshot
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
            {versions.length === 0 && !isVersionsBusy && (
              <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-muted/30">
                  <HistoryIcon className="w-7 h-7 text-muted-foreground" />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest mb-1">No Lineage Found</p>
                <p className="max-w-[200px] text-[10px] font-medium leading-relaxed">Save your first version to start tracking changes across time.</p>
              </div>
            )}
            {versions.map((v) => (
              <div key={v._id || v.id} className="group relative flex items-center justify-between gap-4 rounded-[22px] border border-border/40 bg-background/40 p-5 transition-all hover:bg-background/60 hover:border-primary/20 hover:shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-muted/40 group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-300">
                    <Clock className="w-5 h-5" strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground/90 mb-0.5">{v.name || `Version ${v.version || ''}`}</div>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">{new Date(v.createdAt).toLocaleDateString()}</span>
                       <span className="h-1 w-1 rounded-full bg-muted-foreground/20" />
                       <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">{new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    if (!diagramId) return;
                    try {
                      await diagramAPI.restoreVersion(diagramId, v._id || v.id);
                      await loadDiagram(diagramId);
                      setIsVersionsOpen(false);
                      toast.success('Timeline restored');
                    } catch {
                      toast.error('Restoration failed');
                    }
                  }}
                  className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-black uppercase tracking-widest text-primary transition-all hover:bg-primary hover:text-primary-foreground hover:shadow-lg hover:shadow-primary/20 active:scale-95"
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
        title="Keyboard System"
        description="Master the flow with high-efficiency keyboard triggers."
        size="md"
      >
        <div className="grid gap-3 py-2">
          {(
            [
              ['Save Change', 'Ctrl + S', 'Sync now'],
              ['Quick Share', 'Ctrl + Shift + S', 'Open portal'],
              ['Export Asset', 'Ctrl + E', 'Download'],
              ['AI Assist', 'Ctrl + I', 'Neural'],
              ['Delete Item', 'Del', 'Remove'],
              ['Duplicate', 'Ctrl + D', 'Clone'],
              ['Undo / Redo', 'Ctrl + Z / Y', 'History'],
              ['Shortcuts', '?', 'This panel'],
            ] as const
          ).map(([label, keys, action]) => (
            <div
              key={label}
              className="group/shortcut flex items-center justify-between gap-6 rounded-2xl border border-border/40 bg-muted/20 px-5 py-3.5 transition-all hover:bg-background hover:border-primary/20 hover:shadow-sm"
            >
              <div className="flex flex-col">
                <span className="text-xs font-black uppercase tracking-widest text-foreground/80">{label}</span>
                <span className="text-[10px] font-bold text-muted-foreground/40">{action}</span>
              </div>
              <div className="flex items-center gap-2">
                 <kbd className="inline-flex min-w-[32px] items-center justify-center rounded-lg border-b-2 border-border bg-background px-2 py-1.5 font-mono text-[10px] font-black tracking-tight text-foreground/60 shadow-sm group-hover/shortcut:border-primary/30 group-hover/shortcut:text-primary transition-all">
                  {keys}
                </kbd>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
