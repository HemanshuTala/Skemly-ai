import { useState, useEffect, useCallback, useRef, useLayoutEffect, useMemo, lazy, Suspense } from 'react';
import gsap from 'gsap';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Link as RouterLink } from 'react-router-dom';
import { useDiagramStore } from '@/stores/diagramStore';
import { useAuthStore } from '@/stores/authStore';
import {
  useEditorStore,
  useUIState,
  useSaveState,
  useSelectionState,
  useAIState,
  useCanvasSettings,
  useLayoutState,
} from '@/stores/editorStore';
import { useShallow } from 'zustand/react/shallow';
import { Toolbar } from '@/components/editor/Toolbar';
import type { CodeEditorApi } from '@/components/editor/CodeEditor';
import { ShapePalette } from '@/components/editor/ShapePalette';
import { DiagramCanvas } from '@/components/editor/DiagramCanvas';
import { PropertiesPanel } from '@/components/editor/PropertiesPanel';
import { NotesEditor } from '@/components/editor/NotesEditor';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useAIGenerate } from '@/hooks/useAIGenerate';
import { socketClient } from '@/lib/socket';

const CodeEditor = lazy(() => import('@/components/editor/CodeEditor').then(m => ({ default: m.CodeEditor })));
import { aiAPI, commentAPI, diagramAPI, exportAPI, notesAPI } from '@/services/api.service';
import { Modal } from '@/components/ui/modal';
import { ArchitectureReviewModal } from '@/components/editor/ArchitectureReviewModal';
import { TradeoffAnalysisModal } from '@/components/editor/TradeoffAnalysisModal';
import { RequirementsTraceabilityModal } from '@/components/editor/RequirementsTraceabilityModal';
import { InterviewModeModal } from '@/components/editor/InterviewModeModal';
import { ExportPanel } from '@/components/editor/ExportPanel';
import { VersionConflictModal } from '@/components/editor/VersionConflictModal';
import { parseSyntaxToGraph, graphToSyntax, mergeAIGraphUpdate } from '@/domain/diagramParser';
import { getOfflineDraft, saveOfflineDraft, clearOfflineDraft } from '@/lib/offlineStorage';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Loader2, 
  Sparkles, 
  ClipboardList, 
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

// Canonical parser & graphToSyntax imported from '@/domain/diagramParser'

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
  const {
    currentDiagram,
    loadDiagram,
    updateDiagram,
    isLoading,
    conflictState,
    closeConflictModal,
    resolveConflictKeepChanges,
    resolveConflictLoadServer,
  } = useDiagramStore();

  // ─── Fine-grained Zustand slices (replace 30+ local useState calls) ──────────
  // Each selector only re-renders this component when ITS slice changes.
  // Canvas-only state changes (node drags, selection) do NOT re-render toolbar/panels.
  const {
    isExportOpen, setIsExportOpen,
    isAIOpen, setIsAIOpen,
    isShareOpen, setIsShareOpen,
    isCommentsOpen, setIsCommentsOpen,
    isVersionsOpen, setIsVersionsOpen,
    isShortcutsOpen, setIsShortcutsOpen,
    isReviewOpen, setIsReviewOpen,
    isTradeoffsOpen, setIsTradeoffsOpen,
    isRequirementsOpen, setIsRequirementsOpen,
    isInterviewOpen, setIsInterviewOpen,
    isPaletteVisible, setIsPaletteVisible,
    currentView, setCurrentView,
  } = useUIState();

  const {
    isSaving, setIsSaving,
    lastSaved, setLastSaved,
    isOnline, setIsOnline,
    hasOfflineDraft, setHasOfflineDraft,
  } = useSaveState();

  const {
    selectedNodeId, setSelectedNodeId,
    selectedEdgeId, setSelectedEdgeId,
    selectedNodeIds, setSelectedNodeIds,
    selectedEdgeIds, setSelectedEdgeIds,
    clearSelection,
  } = useSelectionState();

  const {
    isAIBusy, setIsAIBusy,
    aiPrompt, setAIPrompt: setAiPrompt,
    aiOutput, setAIOutput: setAiOutput,
  } = useAIState();
  const [aiOutputMode, setAiOutputMode] = useState<'syntax' | 'text'>('syntax');

  const {
    canvasPaper, setCanvasPaper,
    canvasShowGrid, setCanvasShowGrid,
    canvasShowRuler, setCanvasShowRuler,
    exportScale, setExportScale,
    isExportBusy, setIsExportBusy,
    lastExportUrl, setLastExportUrl,
  } = useCanvasSettings();

  const {
    leftPaneWidth, setLeftPaneWidth,
    rightPaneWidth, setRightPaneWidth,
    isResizing, setIsResizing,
  } = useLayoutState();

  const {
    comments, setComments,
    newComment, setNewComment,
    isCommentsBusy, setIsCommentsBusy,
  } = useEditorStore(useShallow((s) => ({
    comments: s.comments, setComments: s.setComments,
    newComment: s.newComment, setNewComment: s.setNewComment,
    isCommentsBusy: s.isCommentsBusy, setIsCommentsBusy: s.setIsCommentsBusy,
  })));

  const {
    versions, setVersions,
    versionName, setVersionName,
    isVersionsBusy, setIsVersionsBusy,
  } = useEditorStore(useShallow((s) => ({
    versions: s.versions, setVersions: s.setVersions,
    versionName: s.versionName, setVersionName: s.setVersionName,
    isVersionsBusy: s.isVersionsBusy, setIsVersionsBusy: s.setIsVersionsBusy,
  })));

  const {
    shareUrl, setShareUrl,
    sharePassword, setSharePassword,
    shareExpiresAt, setShareExpiresAt,
    isShareBusy, setIsShareBusy,
  } = useEditorStore(useShallow((s) => ({
    shareUrl: s.shareUrl, setShareUrl: s.setShareUrl,
    sharePassword: s.sharePassword, setSharePassword: s.setSharePassword,
    shareExpiresAt: s.shareExpiresAt, setShareExpiresAt: s.setShareExpiresAt,
    isShareBusy: s.isShareBusy, setIsShareBusy: s.setIsShareBusy,
  })));

  const { canvasStats, setCanvasStats } = useEditorStore(useShallow((s) => ({
    canvasStats: s.canvasStats,
    setCanvasStats: s.setCanvasStats,
  })));

  // ─── Local state (truly component-local, not shared with other UI trees) ─────
  const [syntax, setSyntax] = useState('');
  const syntaxRef = useRef(syntax);
  useEffect(() => {
    syntaxRef.current = syntax;
  }, [syntax]);
  const [notes, setNotes] = useState<any>(null);
  const [title, setTitle] = useState('Untitled Diagram');
  // selectedNodeData and selectedEdgeData remain local (only needed by PropertiesPanel which is already in this tree)
  const [selectedNodeData, setSelectedNodeData] = useState<Node | null>(null);
  const [selectedEdgeData, setSelectedEdgeData] = useState<Edge | null>(null);
  const [cursors, setCursors] = useState<{ socketId: string; username: string; x: number; y: number }[]>([]);
  const [participants, setParticipants] = useState<{ socketId: string; username: string }[]>([]);
  const [localGraph, setLocalGraph] = useState<{ nodes: Node[]; edges: Edge[] } | null>(null);
  const [visualOverride, setVisualOverride] = useState(false);

  const layoutRef = useRef<HTMLDivElement | null>(null);
  const hydratedDiagramIdRef = useRef<string | null>(null);
  const loadDiagramIdRef = useRef<string | null>(null);
  const latestGraphRef = useRef<{ nodes: Node[]; edges: Edge[] } | null>(null);
  /** When true, diagram text is driven by the code editor — never overwrite it from canvas parse/layout. */
  const codeAuthoritativeRef = useRef(true);
  const codeEditorApiRef = useRef<CodeEditorApi | null>(null);
  const pngExporterRef = useRef<((opts?: any) => Promise<string>) | null>(null);
  const svgExporterRef = useRef<((opts?: any) => Promise<string>) | null>(null);
  /** Direct canvas style patcher — mutates node styles in the canvas without roundtripping through syntax. */
  const canvasStylePatcherRef = useRef<((nodeIds: string[], stylePatch: Record<string, unknown>) => void) | null>(null);

  const editorChromeRef = useRef<HTMLDivElement | null>(null);
  const toolbarShellRef = useRef<HTMLDivElement | null>(null);
  const codeShellRef = useRef<HTMLDivElement | null>(null);
  const paletteShellRef = useRef<HTMLDivElement | null>(null);
  const centerColumnRef = useRef<HTMLDivElement | null>(null);
  const inspectorShellRef = useRef<HTMLDivElement | null>(null);

  // Reset editor store when navigating away
  const resetEditorStore = useEditorStore((s) => s.reset);
  useEffect(() => {
    return () => { resetEditorStore(); };
  }, [resetEditorStore]);

  // ─── AI generation with cancellation + streaming ───────────────────────────
  const { generate: aiGenerate, cancel: cancelAIGenerate, isGenerating: isAIStreaming, statusLabel: aiStatusLabel } = useAIGenerate();

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
    if (!currentDiagram) return;
    const promptParam = searchParams.get('prompt');
    if (promptParam) {
      setAiPrompt(promptParam);
      setIsAIOpen(true);
    } else if (searchParams.get('ai') === '1') {
      setIsAIOpen(true);
    }
  }, [searchParams, currentDiagram, setAiPrompt, setIsAIOpen]);

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
      (currentDiagram.nodes?.length ?? 0) > 0 || (currentDiagram.edges?.length ?? 0) > 0;

    if (hasPersistedVisual) {
      // Parse syntax to get type/shape data (needed if DB nodes are missing type info)
      const parsedFromSyntax = parseSyntaxToGraph(currentDiagram.syntax || '');
      const parsedById = new Map(parsedFromSyntax.nodes.map((n: any) => [n.id, n]));
      const mergedNodes = (currentDiagram.nodes as any[]).map(dbNode => {
        // DB node IDs (e.g. n-1234-abcd) never match syntax-parsed IDs (e.g. 'rectangle').
        // Match by ID first, then fall back to matching by label+type.
        const { onDimensionsChange: _dc, onLabelChange: _lc, ...cleanData } = (dbNode.data || {}) as any;
        const dbLabel = cleanData.label || '';
        const dbShape = cleanData.shape || '';
        const parsedNode = parsedById.get(dbNode.id)
          ?? parsedFromSyntax.nodes.find((p: any) =>
              p.type === 'resizableShape' &&
              (p.data?.label ?? '') === dbLabel &&
              (p.data?.shape ?? '') === dbShape
            )
          ?? parsedFromSyntax.nodes.find((p: any) => (p.data?.label ?? '') === dbLabel);

        // Prefer DB width/height (user resized), then parsed node dims, then extract from syntax
        let width: number | undefined = dbNode.width ?? parsedNode?.width;
        let height: number | undefined = dbNode.height ?? parsedNode?.height;

        // Last resort: parse dimensions directly from syntax for resizableShape nodes
        if ((!width || !height) && (dbNode.type === 'resizableShape' || dbShape)) {
          let syntaxStr = currentDiagram.syntax || '';
          // Fix corrupted syntax with extra brackets: [[Rectangle|... -> [Rectangle|...
          syntaxStr = syntaxStr.replace(/\[\[+([a-zA-Z0-9_\-\s]+)\|/g, '[$1|');
          // Look for [label|w:X,h:Y,shape:S] pattern matching this node's label
          const escapedLabel = dbLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const dimMatch = syntaxStr.match(new RegExp(`\\[${escapedLabel}\\|([^\\]]*)\\]`));
          if (dimMatch) {
            dimMatch[1].split(',').forEach((attr: string) => {
              const [k, v] = attr.trim().split(':');
              if (k === 'w' && v && !width) width = parseInt(v, 10);
              if (k === 'h' && v && !height) height = parseInt(v, 10);
            });
          }
        }

        const type = dbNode.type || parsedNode?.type || 'diagramNode';
        const shape = dbShape || parsedNode?.data?.shape;
        const style = cleanData.style || parsedNode?.data?.style;
        return {
          ...dbNode,
          type,
          ...(width ? { width } : {}),
          ...(height ? { height } : {}),
          data: {
            ...cleanData,
            ...(shape ? { shape } : {}),
            ...(style ? { style } : {}),
          },
        };
      });
      
      const hydrated = {
        nodes: mergedNodes,
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
        // Clear local draft if successfully saved
        localStorage.removeItem(`offline_draft:${diagramId}`);
      } catch (error: any) {
        // Save to offline draft if it fails
        const draftKey = `offline_draft:${diagramId}`;
        const draftData = {
          syntax: data.syntax ?? syntaxRef.current,
          nodes: normalized.nodes,
          edges: normalized.edges,
          updatedAt: Date.now(),
        };
        localStorage.setItem(draftKey, JSON.stringify(draftData));
        toast.error(error?.response?.data?.error?.message || 'Save failed. Saved local offline draft.');
      } finally {
        setIsSaving(false);
      }
    },
    [diagramId, title, updateDiagram, normalizeGraphForBackend]
  );

  // Auto-save hook with 2.5s delay and 30s maxWait to avoid rate limits
  const { save, saveNow } = useAutoSave({
    onSave: handleSave,
    delay: 2500,
    maxWait: 30000,
    enabled: !!diagramId,
    diagramId,
  });

  // Monitor network status
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Check for offline drafts from IndexedDB or localStorage fallback
  useEffect(() => {
    if (!diagramId) return;
    getOfflineDraft(diagramId).then((draft) => {
      if (draft && draft.updatedAt && (!lastSaved || new Date(draft.updatedAt).getTime() > lastSaved.getTime())) {
        setHasOfflineDraft(true);
        return;
      }
      const lsDraft = localStorage.getItem(`offline_draft:${diagramId}`);
      if (lsDraft) {
        try {
          const parsed = JSON.parse(lsDraft);
          if (parsed.updatedAt && (!lastSaved || new Date(parsed.updatedAt).getTime() > lastSaved.getTime())) {
            setHasOfflineDraft(true);
          }
        } catch (err) {}
      }
    });
  }, [diagramId, lastSaved]);

  const handleSyncOfflineDraft = useCallback(async () => {
    if (!diagramId) return;
    let draft = await getOfflineDraft(diagramId);
    if (!draft) {
      const lsDraft = localStorage.getItem(`offline_draft:${diagramId}`);
      if (lsDraft) {
        try { draft = JSON.parse(lsDraft); } catch (e) {}
      }
    }
    if (draft) {
      try {
        setSyntax(draft.syntax || '');
        if (draft.nodes && draft.nodes.length > 0) {
          latestGraphRef.current = { nodes: draft.nodes, edges: draft.edges || [] };
          await saveNow({ syntax: draft.syntax, nodes: draft.nodes, edges: draft.edges });
        } else {
          await saveNow({ syntax: draft.syntax });
        }
        await clearOfflineDraft(diagramId);
        localStorage.removeItem(`offline_draft:${diagramId}`);
        setHasOfflineDraft(false);
        toast.success('Synced offline changes!');
      } catch (err) {
        console.error('Failed to sync offline draft', err);
        toast.error('Sync failed. Please check internet connection.');
      }
    }
  }, [diagramId, saveNow]);

  const handleDiscardOfflineDraft = useCallback(async () => {
    if (!diagramId) return;
    await clearOfflineDraft(diagramId);
    localStorage.removeItem(`offline_draft:${diagramId}`);
    setHasOfflineDraft(false);
    toast.success('Discarded local changes.');
  }, [diagramId]);

  // Collaboration / Socket.IO Integration
  useEffect(() => {
    if (!diagramId || !user) return;

    const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || '';
    const socket = socketClient.connect(token);

    if (socket) {
      socketClient.emit('join-diagram', { diagramId, username: user.name || user.email || 'Anonymous' });

      socketClient.on('participants-updated', (list: any[]) => {
        setParticipants(list.map(p => ({ socketId: p.socketId, username: p.username })));
      });

      socketClient.on('cursor-update', (data: { socketId: string; username: string; x: number; y: number }) => {
        setCursors((prev) => {
          const filtered = prev.filter((c) => c.socketId !== data.socketId);
          return [...filtered, data];
        });
      });

      socketClient.on('cursor-removed', (socketId: string) => {
        setCursors((prev) => prev.filter((c) => c.socketId !== socketId));
      });
    }

    return () => {
      socketClient.emit('leave-diagram', {});
      socketClient.disconnect();
    };
  }, [diagramId, user]);

  const handleMouseMoveCanvas = useCallback((pos: { x: number; y: number }) => {
    socketClient.emit('cursor-move', pos);
  }, []);

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
        const token = localStorage.getItem('token');
        // Strip callbacks — latestGraphRef is already clean (set to snapshot), but be safe
        const cleanNodes = latestGraphRef.current.nodes.map((n: any) => {
          const { onDimensionsChange: _dc, onLabelChange: _lc, ...restData } = (n.data || {}) as any;
          return { ...n, data: restData };
        });
        fetch(`/api/v1/diagrams/${diagramId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          },
          body: JSON.stringify({
            title,
            syntax: syntaxRef.current,
            nodes: cleanNodes,
            edges: latestGraphRef.current.edges,
          }),
          keepalive: true,
        }).catch(() => {});
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
        save({ syntax: newSyntax });
      } else {
        codeAuthoritativeRef.current = false
        setVisualOverride(true)
        // Strip callbacks before saving — JSON serialization drops functions but
        // having them in the saved payload caused type corruption on reload.
        const rawGraph = latestGraphRef.current;
        const cleanNodes = rawGraph?.nodes.map((n: any) => {
          const { onDimensionsChange: _dc, onLabelChange: _lc, ...restData } = (n.data || {}) as any;
          return { ...n, data: restData };
        });
        save({ 
          syntax: newSyntax,
          nodes: cleanNodes,
          edges: rawGraph?.edges,
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

  // Always use localGraph for selected node/edge to get fresh data (width/height/styles)
  // selectedNodeData can become stale after resize operations
  // Always get the node from localGraph or latestGraphRef to ensure we have the full node data including 'type'
  const selectedNode = selectedNodeId
    ? localGraph?.nodes?.find((n) => n.id === selectedNodeId) 
      ?? latestGraphRef.current?.nodes?.find((n) => n.id === selectedNodeId)
      ?? null
    : null;
  const selectedEdge = selectedEdgeId
    ? localGraph?.edges?.find((e) => e.id === selectedEdgeId) ?? selectedEdgeData ?? null
    : null;

  // Canonical graphToSyntax imported directly from '@/domain/diagramParser'

  const updateVisualGraph = useCallback(
    (updater: (prev: { nodes: Node[]; edges: Edge[] }) => { nodes: Node[]; edges: Edge[] }) => {
      // If we're currently in 'code mode' (localGraph is null), start from the latest auto-layout state.
      const raw = localGraph ?? latestGraphRef.current ?? { nodes: [], edges: [] };
      // Strip callbacks so graphToSyntax and save never see stale function refs
      const current = {
        nodes: raw.nodes.map((n: any) => {
          const { onDimensionsChange: _dc, onLabelChange: _lc, ...restData } = (n.data || {}) as any;
          return { ...n, data: restData };
        }),
        edges: raw.edges,
      };
      const next = updater(current);
      setLocalGraph(next);
      // CRITICAL: Also update latestGraphRef so saves get the latest data including styles
      latestGraphRef.current = next;
      const nextSyntax = graphToSyntax(next.nodes, next.edges);
      handleSyntaxChange(nextSyntax, 'visual');
    },
    [localGraph, handleSyntaxChange, graphToSyntax]
  );

  const handleRegisterPngExporter = useCallback((exporter: any) => {
    pngExporterRef.current = exporter;
  }, []);

  const handleRegisterSvgExporter = useCallback((exporter: any) => {
    svgExporterRef.current = exporter;
  }, []);

  const handleRegisterStylePatcher = useCallback((patcher: any) => {
    canvasStylePatcherRef.current = patcher;
  }, []);

  const handleSelectionChange = useCallback(({ nodeId, edgeId, nodeIds, edgeIds, selectedNode, selectedEdge }: any) => {
    setSelectedNodeId(nodeId);
    setSelectedEdgeId(edgeId);
    setSelectedNodeIds(nodeIds);
    setSelectedEdgeIds(edgeIds);
    setSelectedNodeData(selectedNode);
    setSelectedEdgeData(selectedEdge);
  }, [setSelectedNodeId, setSelectedEdgeId, setSelectedNodeIds, setSelectedEdgeIds, setSelectedNodeData, setSelectedEdgeData]);

  const handleGraphChange = useCallback((graph: any) => {
    latestGraphRef.current = graph;
    setCanvasStats({ nodes: graph.nodes.length, edges: graph.edges.length });
    if (codeAuthoritativeRef.current) {
      save({ 
        syntax: syntaxRef.current,
        nodes: graph.nodes,
        edges: graph.edges,
      });
    }
  }, [save]);

  const handleUserGraphChange = useCallback((graph: any) => {
    const snapshot = {
      nodes: graph.nodes.map((n: any) => {
        const originalData = n?.data || {}
        const { onDimensionsChange: _dc, onLabelChange: _lc, ...restData } = originalData
        const safeData = {
          label: originalData.label || 'Node',
          shape: originalData.shape,
          kind: originalData.kind || 'node',
          style: originalData.style,
          ...restData,
        }
        return { ...n, data: safeData };
      }),
      edges: graph.edges.map((e: any) => ({ ...e })),
    };
    latestGraphRef.current = snapshot;
    setLocalGraph(snapshot);
    if (codeAuthoritativeRef.current) {
      return;
    }
    const nextSyntax = graphToSyntax(snapshot.nodes, snapshot.edges);
    if (nextSyntax.trim() !== syntaxRef.current.trim()) {
      handleSyntaxChange(nextSyntax, 'visual');
    }
  }, [handleSyntaxChange, graphToSyntax]);

  const handleRenameSelectedNode = useCallback(
    (nextLabel: string) => {
      const label = nextLabel.trim();
      if (!selectedNodeId) return;
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
      borderRadius?: number;
      shape?: 'rectangle' | 'circle' | 'rounded';
    }) => {
      const ids = selectedNodeIds.length > 0 ? selectedNodeIds : selectedNodeId ? [selectedNodeId] : [];
      if (ids.length === 0) return;

      // Separate style-only fields from structural ones
      const { width, height, shape, borderRadius, ...stylePatch } = patch;
      if (stylePatch.fontFamily === 'inherit') delete (stylePatch as any).fontFamily;

      // ── STEP 1: Direct canvas patch for INSTANT visual feedback ──────────────
      // This directly mutates the canvas node state without going through the
      // lossy syntax-serialize → parse → visualData roundtrip that was silently
      // discarding color values (fillColor, strokeColor, color).
      if (canvasStylePatcherRef.current && Object.keys(stylePatch).length > 0) {
        canvasStylePatcherRef.current(ids, stylePatch as Record<string, unknown>);
      }

      // ── STEP 2: Persist via updateVisualGraph (syntax + save) ────────────────
      // This updates localGraph + serialises to syntax so the change survives
      // save/reload. We still run this even if the patcher fired so the code
      // editor and DB stay in sync.
      updateVisualGraph((prev) => ({
        nodes: prev.nodes.map((n) => {
          if (!ids.includes(n.id)) return n;
          const currentData = n.data as any;
          const currentStyle = currentData?.style || {};
          const newStyle = { ...currentStyle, ...stylePatch };
          const nodeType = n.type || (currentData?.shape || shape ? 'resizableShape' : 'diagramNode');
          return {
            ...n,
            type: nodeType,
            ...(width !== undefined && { width: Math.max(50, width) }),
            ...(height !== undefined && { height: Math.max(30, height) }),
            data: {
              ...currentData,
              style: newStyle,
              ...(shape !== undefined && { shape }),
              ...(borderRadius !== undefined && { borderRadius }),
            },
          };
        }),
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
  const handleAIAssist = useCallback(() => {
    setIsAIOpen(true);
  }, [setIsAIOpen]);

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
      const nextSyntax = await aiGenerate({
        prompt: aiPrompt.trim(),
        diagramType: currentDiagram?.type || 'flowchart',
        diagramId,
      });
      setAiOutput(nextSyntax);
      setAiOutputMode('syntax');
      toast.success('AI proposal ready. Review it before applying.');
    } catch (error: any) {
      if (error?.name !== 'AbortError') {
        toast.error(error?.response?.data?.error?.message || 'AI generation failed');
      }
    } finally {
      setIsAIBusy(false);
    }
  }, [aiPrompt, currentDiagram?.type, diagramId, aiGenerate, setAiOutput]);

  const runAIExplain = useCallback(async () => {
    if (!diagramId) return;
    setIsAIBusy(true);
    try {
      const nodeIds = selectedNodeIds.length > 0
        ? selectedNodeIds
        : selectedNodeId
          ? [selectedNodeId]
          : [];

      const res = await aiAPI.explain({ diagramId, nodeIds });
      setAiOutput(res.data?.data?.explanation || 'No explanation returned');
      setAiOutputMode('text');
      toast.success('Explanation ready');
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message || 'AI explain failed');
    } finally {
      setIsAIBusy(false);
    }
  }, [diagramId, selectedNodeId, selectedNodeIds]);

  const handleSaveRequirements = useCallback(async (nextReqs: any[]) => {
    if (!diagramId) return;
    try {
      await updateDiagram(diagramId, { requirements: nextReqs });
      toast.success('Requirements updated');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to update requirements');
    }
  }, [diagramId, updateDiagram]);

  const handleLinkRequirement = useCallback((nodeId: string, reqId: string, linked: boolean) => {
    updateVisualGraph((prev) => {
      const nextNodes = prev.nodes.map((n) => {
        if (n.id !== nodeId) return n;
        const currentReqs: string[] = n.data?.requirements || [];
        const nextReqs = linked
          ? [...currentReqs.filter((id) => id !== reqId), reqId]
          : currentReqs.filter((id) => id !== reqId);
        return {
          ...n,
          data: {
            ...n.data,
            requirements: nextReqs,
          },
        };
      });
      return {
        ...prev,
        nodes: nextNodes,
      };
    });
  }, [updateVisualGraph]);

  const handleToggleNodeView = useCallback((nodeId: string, viewId: string, visible: boolean) => {
    updateVisualGraph((prev) => {
      const nextNodes = prev.nodes.map((n) => {
        if (n.id !== nodeId) return n;
        const currentViews: string[] = n.data?.views || [];
        const nextViews = visible
          ? [...currentViews.filter((v) => v !== viewId), viewId]
          : currentViews.filter((v) => v !== viewId);
        return {
          ...n,
          data: {
            ...n.data,
            views: nextViews,
          },
        };
      });
      return {
        ...prev,
        nodes: nextNodes,
      };
    });
  }, [updateVisualGraph]);

  const applyAiOutputToCode = useCallback(
    (mode: 'replace' | 'append') => {
      const text = aiOutput.trim();
      if (!text || aiOutputMode !== 'syntax') {
        toast.error('There is no diagram syntax to apply');
        return;
      }
      if (mode === 'replace') {
        const currentGraph = localGraph?.nodes?.length ? localGraph : latestGraphRef.current;
        const nextGraph = currentGraph?.nodes?.length
          ? mergeAIGraphUpdate(currentGraph, text)
          : parseSyntaxToGraph(text);
        latestGraphRef.current = nextGraph;
        setLocalGraph(nextGraph);
        setVisualOverride(true);
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
    [aiOutput, aiOutputMode, handleSyntaxChange, localGraph, setIsAIOpen, setLocalGraph, setVisualOverride]
  );

  const runAIImprove = useCallback(async () => {
    if (!diagramId) return;
    setIsAIBusy(true);
    try {
      const res = await aiAPI.improve(diagramId);
      const improved = res.data?.data?.improvedSyntax || res.data?.data?.syntax || '';
      const suggestions = res.data?.data?.suggestions || [];
      const textSuggestions = Array.isArray(suggestions)
        ? suggestions.map((s: any) => (typeof s === 'string' ? s : JSON.stringify(s))).join('\n')
        : '';
      if (improved) {
        setAiOutput(improved);
        setAiOutputMode('syntax');
        toast.success('Improved proposal ready to review.');
      } else if (textSuggestions) {
        setAiOutput(textSuggestions);
        setAiOutputMode('text');
        toast.success('Improvement suggestions are ready.');
      } else {
        setAiOutput('No improvements were returned. Try again with a more specific request.');
        setAiOutputMode('text');
        toast.error('No improvements were returned.');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message || 'AI improve failed');
    } finally {
      setIsAIBusy(false);
    }
  }, [diagramId, setAiOutput]);

  const aiProposalStats = useMemo(() => {
    if (aiOutputMode !== 'syntax' || !aiOutput.trim()) return null;
    const graph = parseSyntaxToGraph(aiOutput);
    return { nodes: graph.nodes.length, edges: graph.edges.length };
  }, [aiOutput, aiOutputMode]);

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

      if (key === 'i') {
        e.preventDefault();
        setIsAIOpen(true);
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
      <div className="h-screen flex flex-col bg-[#09090b]">
        {/* Skeleton Toolbar */}
        <div className="h-[52px] border-b border-white/[0.06] bg-[#0a0a0d] flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-lg bg-white/[0.03]" />
            <div className="h-4 w-px bg-white/[0.06]" />
            <Skeleton className="w-32 h-5 rounded bg-white/[0.03]" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="w-16 h-8 rounded-lg bg-white/[0.03]" />
            <Skeleton className="w-24 h-8 rounded-lg bg-white/[0.03]" />
          </div>
        </div>
        {/* Skeleton Editor Panes */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Code panel skeleton */}
          <div className="w-[28%] border-r border-white/[0.06] bg-[#0d0d10] p-4 space-y-4 shrink-0">
            <Skeleton className="h-5 w-24 rounded bg-white/[0.03]" />
            <Skeleton className="h-4 w-full rounded bg-white/[0.02]" />
            <Skeleton className="h-4 w-[90%] rounded bg-white/[0.02]" />
            <Skeleton className="h-4 w-[95%] rounded bg-white/[0.02]" />
            <Skeleton className="h-4 w-[60%] rounded bg-white/[0.02]" />
          </div>
          {/* Canvas skeleton */}
          <div className="flex-1 bg-[#09090b] relative flex items-center justify-center min-w-0">
            {/* Dot grid pattern mimic */}
            <div 
              className="absolute inset-0 opacity-15"
              style={{
                backgroundImage: 'radial-gradient(circle, #3f3f46 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />
            <div className="flex flex-col items-center gap-4 relative z-10">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border border-white/20 animate-ping absolute" />
                <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center bg-[#0d0d10]">
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                </div>
              </div>
              <span className="text-xs text-[#a1a1aa] font-medium tracking-wide animate-pulse">
                Initializing architectural canvas...
              </span>
            </div>
          </div>
          {/* Properties panel skeleton */}
          <div className="w-[22%] border-l border-white/[0.06] bg-[#0d0d10] p-4 space-y-6 shrink-0">
            <Skeleton className="h-5 w-32 rounded bg-white/[0.03]" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full rounded bg-white/[0.02]" />
              <Skeleton className="h-9 w-full rounded-lg bg-white/[0.03]" />
            </div>
            <div className="space-y-3 pt-4 border-t border-white/[0.06]">
              <Skeleton className="h-4 w-2/3 rounded bg-white/[0.02]" />
              <Skeleton className="h-24 w-full rounded-lg bg-white/[0.02]" />
            </div>
          </div>
        </div>
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
            className="px-4 py-2 bg-white text-black hover:bg-white/90 rounded-lg transition-colors font-medium"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={editorChromeRef} className="h-screen flex flex-col overflow-hidden bg-[#09090b] text-foreground">
      <div ref={toolbarShellRef} className="shrink-0 relative z-30">
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
          onReview={() => setIsReviewOpen(true)}
          onTradeoffs={() => setIsTradeoffsOpen(true)}
          onRequirements={() => setIsRequirementsOpen(true)}
          onInterview={() => setIsInterviewOpen(true)}
          participants={participants}
        />
      </div>

      {/* Offline sync / local drafts banner */}
      {!isOnline && (
        <div role="status" className="bg-amber-500/[0.08] border-b border-amber-500/20 px-4 py-2.5 text-xs flex items-center justify-between text-amber-200 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping shrink-0" />
            <span>You are offline. Diagram edits are being automatically saved locally to your browser database.</span>
          </div>
        </div>
      )}

      {hasOfflineDraft && (
        <div role="status" className="bg-primary/[0.08] border-b border-primary/20 px-4 py-2 text-xs flex items-center justify-between text-primary backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
            <span>Unsynced local changes found from an offline session.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncOfflineDraft}
              className="px-2.5 py-1 bg-primary/20 hover:bg-primary/45 border border-primary/40 rounded text-[10px] font-extrabold uppercase transition-all"
            >
              Sync Changes
            </button>
            <button
              onClick={handleDiscardOfflineDraft}
              className="px-2.5 py-1 bg-transparent hover:bg-background/20 text-muted-foreground hover:text-foreground rounded text-[10px] font-extrabold uppercase transition-all"
            >
              Discard Draft
            </button>
          </div>
        </div>
      )}

      <div ref={layoutRef} className="flex-1 flex overflow-hidden min-h-0">
        {/* Code Editor - Left */}
        <div
          ref={codeShellRef}
          style={{ width: `${leftPaneWidth}%` }}
          className="min-w-[260px] max-w-[680px] min-h-0 flex flex-col overflow-visible border-r border-white/[0.04] bg-[#0d0d10]"
        >
          <Suspense fallback={<div className="h-full w-full bg-[#09090b] flex items-center justify-center text-xs font-mono text-muted-foreground/60">Loading Code Editor…</div>}>
            <CodeEditor
              value={syntax}
              onChange={(v) => handleSyntaxChange(v, 'code')}
              editorApiRef={codeEditorApiRef}
            />
          </Suspense>
        </div>
        <div
          role="separator"
          aria-label="Resize code panel"
          aria-orientation="vertical"
          className={`w-1 shrink-0 cursor-col-resize transition-colors hover:bg-violet-400/60 ${isResizing === 'left' ? 'bg-violet-400/70' : 'bg-white/[0.06]'}`}
          onMouseDown={() => setIsResizing('left')}
        />

        {/* Canvas + Notes - Center */}
        <div ref={centerColumnRef} className="flex-1 flex flex-col min-w-[280px] min-h-0 bg-[#09090b]">
          {/* Canvas toolbar strip */}
          <div className="shrink-0 h-10 border-b border-white/[0.06] bg-[#101014]/90 backdrop-blur flex items-center px-3 gap-2">
            {/* Palette toggle */}
            <button
              type="button"
              onClick={() => setIsPaletteVisible(!isPaletteVisible)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
                isPaletteVisible
                  ? 'bg-violet-400/10 text-violet-200 border border-violet-300/20'
                  : 'text-muted-foreground/70 hover:text-foreground hover:bg-white/[0.05] border border-transparent'
              }`}
              title="Toggle shape palette (P)"
            >
              <LayoutGrid className="w-3 h-3" />
              Shapes
            </button>

            {/* Divider */}
            <div className="h-4 w-px bg-white/[0.08]" />

            {/* Stats */}
            {canvasStats.nodes > 0 && (
              <span className="rounded-md border border-white/[0.06] bg-white/[0.025] px-2 py-1 text-[10px] text-muted-foreground/70 font-mono tabular-nums">
                {canvasStats.nodes} nodes · {canvasStats.edges} edges
              </span>
            )}

            {/* Spacer */}
            <div className="flex-1" />
          </div>
          <div className="flex-1 flex overflow-hidden">
            {/* inline palette when visible */}
            {isPaletteVisible && (
              <div className="w-[200px] min-w-[170px] max-w-[230px] shrink-0 h-full border-r border-white/[0.06] bg-[#0d0d10]">
                <ShapePalette onInsert={handlePaletteInsert} />
              </div>
            )}
            <div className="flex-1 flex flex-col overflow-hidden">
              <DiagramCanvas
                syntax={syntax}
                currentView={currentView}
                onViewChange={setCurrentView as any}
                cursors={cursors}
                onMouseMoveCanvas={handleMouseMoveCanvas}
                visualData={visualOverride && localGraph ? localGraph : undefined}
                paperColor={canvasPaper}
                showGrid={canvasShowGrid}
                showRuler={canvasShowRuler}
                onRegisterPngExporter={handleRegisterPngExporter}
                onRegisterSvgExporter={handleRegisterSvgExporter}
                onRegisterStylePatcher={handleRegisterStylePatcher}
                onSelectionChange={handleSelectionChange}
                onGraphChange={handleGraphChange}
                onCanvasUserGesture={onCanvasUserGesture}
                onUserGraphChange={handleUserGraphChange}
              />
            </div>
          </div>
          <NotesEditor value={notes} onChange={handleNotesChange} />
        </div>
        <div
          role="separator"
          aria-label="Resize properties panel"
          aria-orientation="vertical"
          className={`w-1 shrink-0 cursor-col-resize transition-colors hover:bg-violet-400/60 ${isResizing === 'right' ? 'bg-violet-400/70' : 'bg-white/[0.06]'}`}
          onMouseDown={() => setIsResizing('right')}
        />

        {/* Properties Panel - Right */}
        <div
          ref={inspectorShellRef}
          style={{ width: `${rightPaneWidth}%` }}
          className="min-w-[240px] max-w-[440px] min-h-0 flex flex-col border-l border-white/[0.04] bg-[#0d0d10]"
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
            requirements={currentDiagram?.requirements || []}
            onLinkRequirement={handleLinkRequirement}
            onToggleNodeView={handleToggleNodeView}
          />
        </div>
      </div>


      <ArchitectureReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        diagramId={diagramId || ''}
      />

      <TradeoffAnalysisModal
        isOpen={isTradeoffsOpen}
        onClose={() => setIsTradeoffsOpen(false)}
        diagramId={diagramId || ''}
      />

      <RequirementsTraceabilityModal
        isOpen={isRequirementsOpen}
        onClose={() => setIsRequirementsOpen(false)}
        requirements={currentDiagram?.requirements || []}
        onSaveRequirements={handleSaveRequirements}
        nodes={localGraph?.nodes || []}
      />

      <InterviewModeModal
        isOpen={isInterviewOpen}
        onClose={() => setIsInterviewOpen(false)}
        diagramType={currentDiagram?.type || 'flowchart'}
        diagramId={diagramId || ''}
        onGenerate={(syntax) => handleSyntaxChange(syntax, 'code')}
      />

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

      <ExportPanel
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        diagramTitle={title}
        diagramCode={syntax}
        hasSelection={selectedNodeIds.length > 0}
        onExport={async (options) => {
          if (!pngExporterRef.current) throw new Error('Canvas exporter not ready');
          const dataUrl = await pngExporterRef.current(options);
          setLastExportUrl(dataUrl);
          return dataUrl;
        }}
        onExportSVG={async (options) => {
          if (!svgExporterRef.current) throw new Error('SVG exporter not ready');
          return await svgExporterRef.current(options);
        }}
        onCopyLink={currentDiagram?.isPublic && currentDiagram?.publicLinkToken ? async () => {
          await navigator.clipboard.writeText(shareUrl || `${window.location.origin}/public/${currentDiagram.publicLinkToken}`);
          toast.success('Share link copied');
        } : undefined}
      />
      <VersionConflictModal
        isOpen={conflictState?.isOpen || false}
        onClose={closeConflictModal}
        serverVersion={conflictState?.serverVersion}
        clientVersion={conflictState?.clientVersion}
        onKeepChanges={async () => {
          if (diagramId) await resolveConflictKeepChanges(diagramId);
        }}
        onLoadServerVersion={async () => {
          if (diagramId) await resolveConflictLoadServer(diagramId);
        }}
        onExportLocalBackup={() => {
          const backupData = {
            timestamp: new Date().toISOString(),
            diagramId,
            syntax,
            nodes: localGraph?.nodes || [],
            edges: localGraph?.edges || [],
          };
          const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `schemely-backup-${diagramId || 'draft'}.json`;
          a.click();
          URL.revokeObjectURL(url);
          toast.success('Local backup downloaded');
        }}
      />
      <Modal
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        title="AI architecture assistant"
        description="Generate, improve, or explain this architecture. Diagram changes are only applied when you confirm them."
        size="xl"
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-violet-300/15 bg-violet-300/[0.04] px-4 py-3 text-xs leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">How syntax works:</span>{' '}
            <code className="rounded bg-background/80 px-1 py-0.5 text-[10px]">--&gt;</code>,{' '}
            <code className="rounded bg-background/80 px-1 py-0.5 text-[10px]">-&gt;</code>, or{' '}
            <code className="rounded bg-background/80 px-1 py-0.5 text-[10px]">=&gt;</code>{' '}
            between nodes. One connection per line works best.
          </div>

          <div className="relative">
            <label htmlFor="editor-ai-prompt" className="mb-2 block text-xs font-semibold text-foreground/80">
              Describe the change or system
            </label>
            <textarea
              id="editor-ai-prompt"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="E.g. Create a microservices architecture for an e-commerce platform with Redis cache and PostgreSQL..."
              rows={4}
              className="w-full rounded-xl border border-border/60 bg-background/50 px-4 py-3.5 text-sm focus:bg-background focus:ring-2 focus:ring-violet-400/15 focus:border-violet-400/40 outline-none transition-all placeholder:text-muted-foreground/50 leading-relaxed scrollbar-hide"
            />
            <div className="absolute right-3 bottom-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary/5 text-primary/40">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={isAIStreaming ? cancelAIGenerate : runAIGenerate}
                disabled={isAIBusy && !isAIStreaming}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold shadow-lg transition-all hover:translate-y-[-1px] active:scale-95 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400",
                  isAIStreaming
                    ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 shadow-none"
                    : "bg-primary text-primary-foreground shadow-primary/20 hover:opacity-90"
                )}
              >
                {isAIStreaming ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    Generate code
                  </>
                )}
              </button>
              {isAIStreaming && aiStatusLabel && (
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground self-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  {aiStatusLabel}
                </div>
              )}
              <button
                onClick={runAIImprove}
                disabled={isAIBusy}
                className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/50 px-4 py-2.5 text-xs font-semibold text-foreground/80 transition-all hover:bg-background hover:border-violet-400/40 hover:text-violet-200 active:scale-95 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                <Zap className="w-3.5 h-3.5" />
                Improve
              </button>
              <button
                onClick={runAIExplain}
                disabled={isAIBusy}
                className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/50 px-4 py-2.5 text-xs font-semibold text-foreground/80 transition-all hover:bg-background hover:border-violet-400/40 hover:text-violet-200 active:scale-95 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
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
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-violet-300" />
                  {aiOutputMode === 'syntax' ? 'Proposed diagram' : 'AI response'}
                </div>
                {aiProposalStats && (
                  <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
                    {aiProposalStats.nodes} nodes <span className="px-1 text-muted-foreground/40">·</span> {aiProposalStats.edges} connections
                    <span className="ml-2 text-violet-200">Not applied</span>
                  </span>
                )}
              </div>
              <div className="relative group overflow-hidden rounded-xl border border-border/50 bg-[#101014]">
                <pre id="editor-ai-output" className="max-h-72 overflow-auto p-4 text-xs font-mono leading-relaxed text-foreground/85 scrollbar-hide whitespace-pre-wrap">
                  {aiOutput}
                </pre>
              </div>
              {aiOutputMode === 'syntax' && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="primary"
                    className="rounded-lg text-xs font-semibold"
                    onClick={() => applyAiOutputToCode('replace')}
                  >
                    Apply proposal
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-lg text-xs font-semibold"
                    onClick={() => applyAiOutputToCode('append')}
                  >
                    Append to diagram
                  </Button>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-lg text-xs font-semibold gap-2"
                  onClick={() => {
                    void navigator.clipboard.writeText(aiOutput).then(() => toast.success('Copied'));
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </Button>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground/70">
                {aiOutputMode === 'syntax'
                  ? 'Your canvas is unchanged until you choose an apply action. Review the proposed syntax first.'
                  : 'This response is informational and will not change the diagram.'}
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
