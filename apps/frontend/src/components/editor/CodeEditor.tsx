import { memo, useRef, useState, useEffect, useLayoutEffect, useCallback, type MutableRefObject } from 'react';
import { createPortal } from 'react-dom';
import Editor, { OnMount } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import {
  Code2,
  ChevronDown,
  Lightbulb,
  GitBranch,
  Server,
  GitMerge,
  Map,
  Palette,
  Moon,
  Sun,
  Sparkles,
  Wand2,
  LayoutTemplate,
  RotateCcw,
  Maximize2,
  Type,
  Settings,
  Check,
  Keyboard,
  Command,
  Zap,
  FileJson,
  Save,
  History,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export type EditorTheme = 'diagram-dark' | 'diagram-light' | 'diagram-zinc' | 'diagram-ocean';

export interface EditorSettings {
  theme: EditorTheme;
  minimap: boolean;
  fontSize: number;
  lineNumbers: 'on' | 'off' | 'relative';
  wordWrap: 'on' | 'off';
  tabSize: number;
  showAutocomplete: boolean;
}

export type CodeEditorApi = {
  insertText: (text: string) => void;
};

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  editorApiRef?: MutableRefObject<CodeEditorApi | null>;
}

const JB_MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";

const EXAMPLES_MENU_ID = 'diagram-examples-menu-portal';

const EXAMPLES = [
  {
    label: 'Flowchart',
    icon: GitBranch,
    description: 'Decision workflow',
    code: `[Start] --> [Validate Input]
[Validate Input] --> {Input Valid?}
{Input Valid?} -- Yes --> [Process Data]
{Input Valid?} -- No --> [Show Error]
[Show Error] --> [Validate Input]
[Process Data] --> [Save Result]
[Save Result] --> (End)`,
  },
  {
    label: 'System',
    icon: Server,
    description: 'Architecture diagram',
    code: `[Client App] --> [API Gateway]
[API Gateway] --> [Auth Service]
[API Gateway] --> [Order Service]
[API Gateway] --> [Product Service]
[Order Service] --> [PostgreSQL]
[Product Service] --> [Redis Cache]
[Auth Service] --> [User DB]`,
  },
  {
    label: 'Pipeline',
    icon: GitMerge,
    description: 'CI/CD or data flow',
    code: `[Source Repo] --> [CI Build]
[CI Build] --> {Tests Pass?}
{Tests Pass?} -- Yes --> [Docker Build]
{Tests Pass?} -- No --> [Notify Dev]
[Docker Build] --> [Push Registry]
[Push Registry] --> [Deploy Staging]
[Deploy Staging] --> {Approved?}
{Approved?} -- Yes --> [Deploy Prod]`,
  },
] as const;

const HINTS = [
  { syntax: '[Node]', desc: 'Process / rectangle' },
  { syntax: '{Decision}', desc: 'Diamond shape' },
  { syntax: '(Start)', desc: 'Pill / terminator' },
  { syntax: 'A --> B', desc: 'Arrow connection' },
  { syntax: 'A -- label --> B', desc: 'Labeled edge' },
];

export const CodeEditor = memo(function CodeEditor({
  value,
  onChange,
  language = 'markdown',
  readOnly = false,
  editorApiRef,
}: CodeEditorProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [showHints, setShowHints] = useState(false);
  const [examplesOpen, setExamplesOpen] = useState(false);
  const examplesBtnRef = useRef<HTMLButtonElement>(null);
  const [menuBox, setMenuBox] = useState({ top: 0, left: 0, width: 280, maxH: 400 });

  const updateMenuPosition = useCallback(() => {
    const btn = examplesBtnRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const width = Math.min(280, Math.max(220, window.innerWidth - 24));
    let left = r.right - width;
    left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
    const gap = 6;
    const belowTop = r.bottom + gap;
    const spaceBelow = window.innerHeight - belowTop - 12;
    const spaceAbove = r.top - 12;
    const preferBelow = spaceBelow >= 180 || spaceBelow >= spaceAbove;
    let top: number;
    let maxH: number;
    if (preferBelow) {
      top = belowTop;
      maxH = Math.max(120, Math.min(420, spaceBelow));
    } else {
      maxH = Math.max(120, Math.min(420, spaceAbove - gap));
      top = Math.max(8, r.top - gap - maxH);
    }
    setMenuBox({ top, left, width, maxH });
  }, []);

  useLayoutEffect(() => {
    if (!examplesOpen) return;
    updateMenuPosition();
  }, [examplesOpen, updateMenuPosition]);

  useEffect(() => {
    if (!examplesOpen) return;
    const onResize = () => updateMenuPosition();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [examplesOpen, updateMenuPosition]);

  // Defer outside-close so the same click that opened the menu doesn't hit capture-phase handlers first on the next frame in some browsers.
  useEffect(() => {
    if (!examplesOpen) return;
    let detached: (() => void) | null = null;
    const arm = window.setTimeout(() => {
      const onPointerDown = (e: PointerEvent) => {
        const t = e.target as Node;
        if (examplesBtnRef.current?.contains(t)) return;
        const menu = document.getElementById(EXAMPLES_MENU_ID);
        if (menu?.contains(t)) return;
        setExamplesOpen(false);
      };
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setExamplesOpen(false);
      };
      document.addEventListener('pointerdown', onPointerDown, true);
      document.addEventListener('keydown', onKey, true);
      detached = () => {
        document.removeEventListener('pointerdown', onPointerDown, true);
        document.removeEventListener('keydown', onKey, true);
      };
    }, 0);
    return () => {
      clearTimeout(arm);
      detached?.();
    };
  }, [examplesOpen]);

  const handleEditorDidMount: OnMount = useCallback((editor, monacoInstance) => {
    editorRef.current = editor;

    if (editorApiRef) {
      editorApiRef.current = {
        insertText: (text: string) => {
          const model = editor.getModel();
          const sel = editor.getSelection();
          if (!model || !sel) return;
          editor.executeEdits('shape-palette', [
            {
              range: sel,
              text,
              forceMoveMarkers: true,
            },
          ]);
          editor.focus();
        },
      };
    }

    editor.updateOptions({
      minimap: { enabled: false },
      fontFamily: JB_MONO,
      fontSize: 13,
      lineHeight: 22,
      lineNumbers: 'on',
      roundedSelection: true,
      scrollBeyondLastLine: false,
      readOnly,
      automaticLayout: true,
      tabSize: 2,
      wordWrap: 'on',
      padding: { top: 12, bottom: 12 },
      renderLineHighlight: 'gutter',
      smoothScrolling: true,
      cursorSmoothCaretAnimation: 'on',
      bracketPairColorization: { enabled: true },
      overviewRulerBorder: false,
    });

    monacoInstance.editor.defineTheme('diagram-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6B7280', fontStyle: 'italic' },
        { token: 'string', foreground: 'c99367' },
        { token: 'keyword', foreground: 'a78bfa' },
      ],
      colors: {
        'editor.background': '#0f0b09',
        'editor.foreground': '#f4e7db',
        'editor.lineHighlightBackground': '#1c150f',
        'editorCursor.foreground': '#c99367',
        'editor.selectionBackground': '#3d2914',
        'editorLineNumber.foreground': '#3d3028',
        'editorLineNumber.activeForeground': '#c99367',
        'scrollbar.shadow': '#00000000',
        'editorGutter.background': '#0f0b09',
        'editor.inactiveSelectionBackground': '#2d1f12',
      },
    });

    monacoInstance.editor.setTheme('diagram-dark');
  }, [editorApiRef, readOnly]);

  const handleChange = useCallback((val: string | undefined) => {
    if (val !== undefined) onChange(val);
  }, [onChange]);

  const examplesPortal =
    examplesOpen &&
    createPortal(
      <div
        id={EXAMPLES_MENU_ID}
        role="menu"
        aria-label="Diagram examples"
        className="fixed rounded-xl border border-primary/40 bg-[#27272a] py-1 shadow-[0_24px_80px_rgba(0,0,0,0.85)] outline-none ring-1 ring-white/10"
        style={{
          top: menuBox.top,
          left: menuBox.left,
          width: menuBox.width,
          maxHeight: menuBox.maxH,
          zIndex: 2147483647,
          overflowY: 'auto',
        }}
      >
        {EXAMPLES.map((ex) => {
          const Icon = ex.icon;
          return (
            <button
              key={ex.label}
              type="button"
              role="menuitem"
              className="flex w-full cursor-pointer items-center gap-3 px-2.5 py-2.5 text-left text-[#f4e7db] transition-colors hover:bg-primary/20 focus:bg-primary/25 focus:outline-none"
              onClick={() => {
                onChange(ex.code);
                setExamplesOpen(false);
              }}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/20">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold">{ex.label}</div>
                <div className="text-[11px] text-[#bba08c]">{ex.description}</div>
              </div>
            </button>
          );
        })}
      </div>,
      document.body
    );

  return (
    <div className="relative z-10 flex h-full w-full min-h-0 flex-col overflow-visible border-r border-border/60 bg-[#0f0b09]">
      <div className="relative z-30 shrink-0 overflow-visible border-b border-white/[0.08] bg-[#130e0a]/95 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-3 py-2 sm:px-4 sm:py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/15">
              <Code2 className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <span className="block font-display text-xs font-semibold tracking-tight text-foreground/90">
                Diagram code
              </span>
              <span className="hidden text-[10px] text-muted-foreground/50 sm:block">
                Syntax canvas
              </span>
            </div>
          </div>

          <div className="relative z-40 flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowHints((v) => !v)}
              className={cn(
                'flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide transition-all',
                showHints
                  ? 'border border-amber-500/35 bg-amber-500/12 text-amber-300'
                  : 'border border-transparent text-muted-foreground/70 hover:bg-white/[0.06] hover:text-foreground'
              )}
            >
              <Lightbulb className="h-3.5 w-3.5" />
              <span>Hints</span>
            </button>

            <button
              ref={examplesBtnRef}
              type="button"
              aria-expanded={examplesOpen}
              aria-haspopup="menu"
              className={cn(
                'flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#f4e7db] outline-none transition-all hover:bg-white/[0.1]',
                examplesOpen
                  ? 'border-primary/40 bg-primary/15'
                  : 'border-white/[0.12] bg-white/[0.06]'
              )}
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                setExamplesOpen((o) => !o);
              }}
            >
              Examples
              <ChevronDown
                className={cn(
                  'h-3.5 w-3.5 opacity-80 transition-transform duration-200',
                  examplesOpen && 'rotate-180'
                )}
              />
            </button>
            {examplesPortal}
          </div>
        </div>

        {showHints && (
          <div className="border-t border-white/[0.06] px-3 py-2 sm:px-4">
            <div className="flex flex-wrap gap-1.5">
              {HINTS.map((h) => (
                <div
                  key={h.syntax}
                  className="flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-1"
                  title={h.desc}
                >
                  <code
                    className="text-[11px] text-primary"
                    style={{ fontFamily: JB_MONO }}
                  >
                    {h.syntax}
                  </code>
                  <span className="hidden text-[10px] text-muted-foreground/50 lg:inline">{h.desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="relative z-0 min-h-0 flex-1 isolate">
        <Editor
          height="100%"
          defaultLanguage={language}
          value={value}
          onChange={handleChange}
          onMount={handleEditorDidMount}
          theme="diagram-dark"
          options={{
            readOnly,
            minimap: { enabled: false },
            fontFamily: JB_MONO,
            fontSize: 13,
            lineHeight: 22,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            padding: { top: 12, bottom: 12 },
            renderLineHighlight: 'gutter',
            smoothScrolling: true,
            overviewRulerBorder: false,
          }}
        />
      </div>
    </div>
  );
});
