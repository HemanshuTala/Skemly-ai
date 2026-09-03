// E:\Skemly-ai\apps\frontend\src\stores\editorStore.ts
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

// ---------- Types ----------

export type CurrentView = 'all' | 'infrastructure' | 'data' | 'security';
export type ExportScale = 1 | 2 | 4;
export type ResizeSide = 'left' | 'right' | null;

export interface SelectionState {
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  selectedNodeIds: string[];
  selectedEdgeIds: string[];
}

export interface SaveState {
  isSaving: boolean;
  lastSaved: Date | undefined;
  isOnline: boolean;
  hasOfflineDraft: boolean;
}

export interface AIState {
  isAIOpen: boolean;
  isAIBusy: boolean;
  aiPrompt: string;
  aiOutput: string;
}

export interface UIState {
  isExportOpen: boolean;
  isShareOpen: boolean;
  isCommentsOpen: boolean;
  isVersionsOpen: boolean;
  isShortcutsOpen: boolean;
  isReviewOpen: boolean;
  isTradeoffsOpen: boolean;
  isRequirementsOpen: boolean;
  isInterviewOpen: boolean;
  isPaletteVisible: boolean;
  currentView: CurrentView;
}

export interface CommentsState {
  comments: any[];
  newComment: string;
  isCommentsBusy: boolean;
}

export interface VersionsState {
  versions: any[];
  versionName: string;
  isVersionsBusy: boolean;
}

export interface ShareState {
  shareUrl: string;
  sharePassword: string;
  shareExpiresAt: string;
  isShareBusy: boolean;
}

export interface CanvasSettingsState {
  canvasPaper: string;
  canvasShowGrid: boolean;
  canvasShowRuler: boolean;
  exportScale: ExportScale;
  isExportBusy: boolean;
  lastExportUrl: string;
}

export interface LayoutState {
  leftPaneWidth: number;
  rightPaneWidth: number;
  isResizing: ResizeSide;
}

export interface CanvasStatsState {
  canvasStats: { nodes: number; edges: number };
}

// ---------- Actions ----------

export interface SelectionActions {
  setSelectedNodeId: (id: string | null) => void;
  setSelectedEdgeId: (id: string | null) => void;
  setSelectedNodeIds: (ids: string[]) => void;
  setSelectedEdgeIds: (ids: string[]) => void;
  clearSelection: () => void;
}

export interface SaveActions {
  setIsSaving: (v: boolean) => void;
  setLastSaved: (d: Date | undefined) => void;
  setIsOnline: (v: boolean) => void;
  setHasOfflineDraft: (v: boolean) => void;
}

export interface AIActions {
  setIsAIOpen: (v: boolean) => void;
  setIsAIBusy: (v: boolean) => void;
  setAIPrompt: (s: string) => void;
  setAIOutput: (s: string) => void;
}

export interface UIActions {
  setIsExportOpen: (v: boolean) => void;
  setIsShareOpen: (v: boolean) => void;
  setIsCommentsOpen: (v: boolean) => void;
  setIsVersionsOpen: (v: boolean) => void;
  setIsShortcutsOpen: (v: boolean) => void;
  setIsReviewOpen: (v: boolean) => void;
  setIsTradeoffsOpen: (v: boolean) => void;
  setIsRequirementsOpen: (v: boolean) => void;
  setIsInterviewOpen: (v: boolean) => void;
  setIsPaletteVisible: (v: boolean) => void;
  setCurrentView: (v: CurrentView) => void;
  closeAllPanels: () => void;
}

export interface CommentsActions {
  setComments: (c: any[]) => void;
  setNewComment: (s: string) => void;
  setIsCommentsBusy: (v: boolean) => void;
}

export interface VersionsActions {
  setVersions: (v: any[]) => void;
  setVersionName: (s: string) => void;
  setIsVersionsBusy: (v: boolean) => void;
}

export interface ShareActions {
  setShareUrl: (s: string) => void;
  setSharePassword: (s: string) => void;
  setShareExpiresAt: (s: string) => void;
  setIsShareBusy: (v: boolean) => void;
}

export interface CanvasSettingsActions {
  setCanvasPaper: (s: string) => void;
  setCanvasShowGrid: (v: boolean) => void;
  setCanvasShowRuler: (v: boolean) => void;
  setExportScale: (s: ExportScale) => void;
  setIsExportBusy: (v: boolean) => void;
  setLastExportUrl: (s: string) => void;
}

export interface LayoutActions {
  setLeftPaneWidth: (n: number) => void;
  setRightPaneWidth: (n: number) => void;
  setIsResizing: (s: ResizeSide) => void;
}

export interface CanvasStatsActions {
  setCanvasStats: (s: { nodes: number; edges: number }) => void;
}

export interface GlobalActions {
  reset: () => void;
}

// ---------- Full Store Type ----------

export type EditorStore =
  SelectionState & SaveState & AIState & UIState &
  CommentsState & VersionsState & ShareState &
  CanvasSettingsState & LayoutState & CanvasStatsState &
  SelectionActions & SaveActions & AIActions & UIActions &
  CommentsActions & VersionsActions & ShareActions &
  CanvasSettingsActions & LayoutActions & CanvasStatsActions &
  GlobalActions;

// ---------- Defaults ----------

const DEFAULTS = {
  // Selection
  selectedNodeId: null,
  selectedEdgeId: null,
  selectedNodeIds: [],
  selectedEdgeIds: [],
  // Save
  isSaving: false,
  lastSaved: undefined,
  isOnline: true,
  hasOfflineDraft: false,
  // AI
  isAIOpen: false,
  isAIBusy: false,
  aiPrompt: '',
  aiOutput: '',
  // UI Panels
  isExportOpen: false,
  isShareOpen: false,
  isCommentsOpen: false,
  isVersionsOpen: false,
  isShortcutsOpen: false,
  isReviewOpen: false,
  isTradeoffsOpen: false,
  isRequirementsOpen: false,
  isInterviewOpen: false,
  isPaletteVisible: false,
  currentView: 'all' as CurrentView,
  // Comments
  comments: [],
  newComment: '',
  isCommentsBusy: false,
  // Versions
  versions: [],
  versionName: '',
  isVersionsBusy: false,
  // Share
  shareUrl: '',
  sharePassword: '',
  shareExpiresAt: '',
  isShareBusy: false,
  // Canvas settings
  canvasPaper: '#09090b',
  canvasShowGrid: true,
  canvasShowRuler: false,
  exportScale: 2 as ExportScale,
  isExportBusy: false,
  lastExportUrl: '',
  // Layout
  leftPaneWidth: 28,
  rightPaneWidth: 22,
  isResizing: null as ResizeSide,
  // Stats
  canvasStats: { nodes: 0, edges: 0 },
};

// ---------- Store ----------

export const useEditorStore = create<EditorStore>((set) => ({
  ...DEFAULTS,

  // Selection actions
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setSelectedEdgeId: (id) => set({ selectedEdgeId: id }),
  setSelectedNodeIds: (ids) => set({ selectedNodeIds: ids }),
  setSelectedEdgeIds: (ids) => set({ selectedEdgeIds: ids }),
  clearSelection: () => set({
    selectedNodeId: null,
    selectedEdgeId: null,
    selectedNodeIds: [],
    selectedEdgeIds: [],
  }),

  // Save actions
  setIsSaving: (v) => set({ isSaving: v }),
  setLastSaved: (d) => set({ lastSaved: d }),
  setIsOnline: (v) => set({ isOnline: v }),
  setHasOfflineDraft: (v) => set({ hasOfflineDraft: v }),

  // AI actions
  setIsAIOpen: (v) => set({ isAIOpen: v }),
  setIsAIBusy: (v) => set({ isAIBusy: v }),
  setAIPrompt: (s) => set({ aiPrompt: s }),
  setAIOutput: (s) => set({ aiOutput: s }),

  // UI Panel actions
  setIsExportOpen: (v) => set({ isExportOpen: v }),
  setIsShareOpen: (v) => set({ isShareOpen: v }),
  setIsCommentsOpen: (v) => set({ isCommentsOpen: v }),
  setIsVersionsOpen: (v) => set({ isVersionsOpen: v }),
  setIsShortcutsOpen: (v) => set({ isShortcutsOpen: v }),
  setIsReviewOpen: (v) => set({ isReviewOpen: v }),
  setIsTradeoffsOpen: (v) => set({ isTradeoffsOpen: v }),
  setIsRequirementsOpen: (v) => set({ isRequirementsOpen: v }),
  setIsInterviewOpen: (v) => set({ isInterviewOpen: v }),
  setIsPaletteVisible: (v) => set({ isPaletteVisible: v }),
  setCurrentView: (v) => set({ currentView: v }),
  closeAllPanels: () => set({
    isExportOpen: false,
    isShareOpen: false,
    isCommentsOpen: false,
    isVersionsOpen: false,
    isShortcutsOpen: false,
    isReviewOpen: false,
    isTradeoffsOpen: false,
    isRequirementsOpen: false,
    isInterviewOpen: false,
  }),

  // Comments actions
  setComments: (c) => set({ comments: c }),
  setNewComment: (s) => set({ newComment: s }),
  setIsCommentsBusy: (v) => set({ isCommentsBusy: v }),

  // Versions actions
  setVersions: (v) => set({ versions: v }),
  setVersionName: (s) => set({ versionName: s }),
  setIsVersionsBusy: (v) => set({ isVersionsBusy: v }),

  // Share actions
  setShareUrl: (s) => set({ shareUrl: s }),
  setSharePassword: (s) => set({ sharePassword: s }),
  setShareExpiresAt: (s) => set({ shareExpiresAt: s }),
  setIsShareBusy: (v) => set({ isShareBusy: v }),

  // Canvas settings actions
  setCanvasPaper: (s) => set({ canvasPaper: s }),
  setCanvasShowGrid: (v) => set({ canvasShowGrid: v }),
  setCanvasShowRuler: (v) => set({ canvasShowRuler: v }),
  setExportScale: (s) => set({ exportScale: s }),
  setIsExportBusy: (v) => set({ isExportBusy: v }),
  setLastExportUrl: (s) => set({ lastExportUrl: s }),

  // Layout actions
  setLeftPaneWidth: (n) =>
    set({
      leftPaneWidth: typeof n === 'number' && !isNaN(n) && n >= 15 && n <= 50 ? n : 28,
    }),
  setRightPaneWidth: (n) =>
    set({
      rightPaneWidth: typeof n === 'number' && !isNaN(n) && n >= 15 && n <= 45 ? n : 22,
    }),
  setIsResizing: (s) => set({ isResizing: s }),

  // Stats actions
  setCanvasStats: (s) => set({ canvasStats: s }),

  // Global reset
  reset: () => set(DEFAULTS),
}));

// ---------- Convenience Selectors (narrow subscriptions) ----------

/**
 * Subscribe only to selection state.
 * Opening the AI panel will NOT re-render a component using this hook.
 */
export function useSelectionState() {
  return useEditorStore(
    useShallow((s) => ({
      selectedNodeId: s.selectedNodeId,
      selectedEdgeId: s.selectedEdgeId,
      selectedNodeIds: s.selectedNodeIds,
      selectedEdgeIds: s.selectedEdgeIds,
      setSelectedNodeId: s.setSelectedNodeId,
      setSelectedEdgeId: s.setSelectedEdgeId,
      setSelectedNodeIds: s.setSelectedNodeIds,
      setSelectedEdgeIds: s.setSelectedEdgeIds,
      clearSelection: s.clearSelection,
    }))
  );
}

/**
 * Subscribe only to save/sync state.
 */
export function useSaveState() {
  return useEditorStore(
    useShallow((s) => ({
      isSaving: s.isSaving,
      lastSaved: s.lastSaved,
      isOnline: s.isOnline,
      hasOfflineDraft: s.hasOfflineDraft,
      setIsSaving: s.setIsSaving,
      setLastSaved: s.setLastSaved,
      setIsOnline: s.setIsOnline,
      setHasOfflineDraft: s.setHasOfflineDraft,
    }))
  );
}

/**
 * Subscribe only to AI state.
 */
export function useAIState() {
  return useEditorStore(
    useShallow((s) => ({
      isAIOpen: s.isAIOpen,
      isAIBusy: s.isAIBusy,
      aiPrompt: s.aiPrompt,
      aiOutput: s.aiOutput,
      setIsAIOpen: s.setIsAIOpen,
      setIsAIBusy: s.setIsAIBusy,
      setAIPrompt: s.setAIPrompt,
      setAIOutput: s.setAIOutput,
    }))
  );
}

/**
 * Subscribe only to UI panel open/close state.
 */
export function useUIState() {
  return useEditorStore(
    useShallow((s) => ({
      isExportOpen: s.isExportOpen,
      isAIOpen: s.isAIOpen,
      isShareOpen: s.isShareOpen,
      isCommentsOpen: s.isCommentsOpen,
      isVersionsOpen: s.isVersionsOpen,
      isShortcutsOpen: s.isShortcutsOpen,
      isReviewOpen: s.isReviewOpen,
      isTradeoffsOpen: s.isTradeoffsOpen,
      isRequirementsOpen: s.isRequirementsOpen,
      isInterviewOpen: s.isInterviewOpen,
      isPaletteVisible: s.isPaletteVisible,
      currentView: s.currentView,
      setIsExportOpen: s.setIsExportOpen,
      setIsAIOpen: s.setIsAIOpen,
      setIsShareOpen: s.setIsShareOpen,
      setIsCommentsOpen: s.setIsCommentsOpen,
      setIsVersionsOpen: s.setIsVersionsOpen,
      setIsShortcutsOpen: s.setIsShortcutsOpen,
      setIsReviewOpen: s.setIsReviewOpen,
      setIsTradeoffsOpen: s.setIsTradeoffsOpen,
      setIsRequirementsOpen: s.setIsRequirementsOpen,
      setIsInterviewOpen: s.setIsInterviewOpen,
      setIsPaletteVisible: s.setIsPaletteVisible,
      setCurrentView: s.setCurrentView,
      closeAllPanels: s.closeAllPanels,
    }))
  );
}

/**
 * Subscribe only to canvas settings.
 */
export function useCanvasSettings() {
  return useEditorStore(
    useShallow((s) => ({
      canvasPaper: s.canvasPaper,
      canvasShowGrid: s.canvasShowGrid,
      canvasShowRuler: s.canvasShowRuler,
      exportScale: s.exportScale,
      isExportBusy: s.isExportBusy,
      lastExportUrl: s.lastExportUrl,
      setCanvasPaper: s.setCanvasPaper,
      setCanvasShowGrid: s.setCanvasShowGrid,
      setCanvasShowRuler: s.setCanvasShowRuler,
      setExportScale: s.setExportScale,
      setIsExportBusy: s.setIsExportBusy,
      setLastExportUrl: s.setLastExportUrl,
    }))
  );
}

/**
 * Subscribe only to layout/pane sizing.
 */
export function useLayoutState() {
  return useEditorStore(
    useShallow((s) => ({
      leftPaneWidth: s.leftPaneWidth,
      rightPaneWidth: s.rightPaneWidth,
      isResizing: s.isResizing,
      setLeftPaneWidth: s.setLeftPaneWidth,
      setRightPaneWidth: s.setRightPaneWidth,
      setIsResizing: s.setIsResizing,
    }))
  );
}
