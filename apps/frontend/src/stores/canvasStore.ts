// E:\Skemly-ai\apps\frontend\src\stores\canvasStore.ts
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type { Node, Edge } from 'reactflow';

const MAX_HISTORY = 50;

export interface HistoryEntry {
  nodes: Node[];
  edges: Edge[];
  syntax: string;
}

export interface CanvasState {
  nodes: Node[];
  edges: Edge[];
  syntax: string;
  /** When true, the code editor owns the source of truth. When false, the visual canvas does. */
  codeAuthoritative: boolean;
  history: HistoryEntry[];
  historyIndex: number; // points to the current entry in history
}

export interface CanvasActions {
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  setGraph: (graph: { nodes: Node[]; edges: Edge[] }) => void;
  setSyntax: (syntax: string) => void;
  setCodeAuthoritative: (v: boolean) => void;
  /**
   * Push a meaningful snapshot to history (call on drag end, connection, delete, AI apply, etc.).
   * Does NOT automatically push on every keystroke.
   */
  pushHistory: (entry: HistoryEntry) => void;
  undo: () => HistoryEntry | null;
  redo: () => HistoryEntry | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  resetCanvas: () => void;
}

export type CanvasStore = CanvasState & CanvasActions;

const DEFAULTS: CanvasState = {
  nodes: [],
  edges: [],
  syntax: '',
  codeAuthoritative: true,
  history: [],
  historyIndex: -1,
};

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  ...DEFAULTS,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setGraph: (graph) => set({ nodes: graph.nodes, edges: graph.edges }),
  setSyntax: (syntax) => set({ syntax }),
  setCodeAuthoritative: (v) => set({ codeAuthoritative: v }),

  pushHistory: (entry) => {
    const { history, historyIndex } = get();
    // Trim any forward history (user made a new edit after undoing)
    const trimmed = history.slice(0, historyIndex + 1);
    const next = [...trimmed, entry].slice(-MAX_HISTORY);
    set({ history: next, historyIndex: next.length - 1 });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return null;
    const prevIndex = historyIndex - 1;
    const entry = history[prevIndex];
    set({
      historyIndex: prevIndex,
      nodes: entry.nodes,
      edges: entry.edges,
      syntax: entry.syntax,
    });
    return entry;
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return null;
    const nextIndex = historyIndex + 1;
    const entry = history[nextIndex];
    set({
      historyIndex: nextIndex,
      nodes: entry.nodes,
      edges: entry.edges,
      syntax: entry.syntax,
    });
    return entry;
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  resetCanvas: () => set(DEFAULTS),
}));

// ---------- Convenience Selectors ----------

/** Subscribe only to nodes/edges for canvas rendering. */
export function useCanvasGraph() {
  return useCanvasStore(
    useShallow((s) => ({
      nodes: s.nodes,
      edges: s.edges,
      setNodes: s.setNodes,
      setEdges: s.setEdges,
      setGraph: s.setGraph,
    }))
  );
}

/** Subscribe only to syntax for the code editor. */
export function useCanvasSyntax() {
  return useCanvasStore(
    useShallow((s) => ({
      syntax: s.syntax,
      setSyntax: s.setSyntax,
      codeAuthoritative: s.codeAuthoritative,
      setCodeAuthoritative: s.setCodeAuthoritative,
    }))
  );
}

/** Subscribe only to history state for undo/redo buttons. */
export function useCanvasHistory() {
  return useCanvasStore(
    useShallow((s) => ({
      canUndo: s.canUndo,
      canRedo: s.canRedo,
      undo: s.undo,
      redo: s.redo,
      pushHistory: s.pushHistory,
    }))
  );
}
