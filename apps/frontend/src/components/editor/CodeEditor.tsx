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
  Terminal,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type EditorTheme = 'diagram-dark';

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
  { syntax: '[Node]', desc: 'Rectangle shape' },
  { syntax: '{Decision}', desc: 'Diamond shape' },
  { syntax: '(Start)', desc: 'Terminator shape' },
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
      fontSize: 12,
      lineHeight: 20,
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
        { token: 'comment', foreground: '52525b', fontStyle: 'italic' },
        { token: 'string', foreground: 'ffffff' },
        { token: 'keyword', foreground: 'a1a1aa' },
      ],
      colors: {
        'editor.background': '#09090b',
        'editor.foreground': '#ffffff',
        'editor.lineHighlightBackground': '#18181b',
        'editorCursor.foreground': '#ffffff',
        'editor.selectionBackground': '#27272a',
        'editorLineNumber.foreground': '#3f3f46',
        'editorLineNumber.activeForeground': '#ffffff',
        'scrollbar.shadow': '#00000000',
        'editorGutter.background': '#09090b',
        'editor.inactiveSelectionBackground': '#27272a',
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
        className="fixed rounded-xl border border-white/[0.08] bg-[#0d0d10] py-1 shadow-2xl overflow-hidden z-[2147483647] custom-scrollbar"
        style={{
          top: menuBox.top,
          left: menuBox.left,
          width: menuBox.width,
          maxHeight: menuBox.maxH,
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
              className="flex w-full items-center gap-3 px-3 py-2 text-left text-white transition-colors hover:bg-white/[0.04] focus:bg-white/[0.06] focus:outline-none"
              onClick={() => {
                onChange(ex.code);
                setExamplesOpen(false);
              }}
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] border border-white/[0.08]">
                <Icon className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white">{ex.label}</div>
                <div className="text-[10px] text-[#52525b] truncate">{ex.description}</div>
              </div>
            </button>
          );
        })}
      </div>,
      document.body
    );

  return (
    <div className="relative z-10 flex h-full w-full min-h-0 flex-col overflow-visible border-r border-white/[0.05] bg-[#09090b]">
      {/* Code Header */}
      <div className="relative z-30 shrink-0 border-b border-white/[0.05] bg-[#0a0a0d]/80 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-x-3 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] border border-white/[0.08]">
              <Terminal className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <span className="block font-bold text-xs text-white uppercase tracking-wider">
                Syntax Editor
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowHints((v) => !v)}
              className={cn(
                'flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all border',
                showHints
                  ? 'border-white/[0.15] bg-white/[0.08] text-white'
                  : 'border-transparent text-[#52525b] hover:text-white hover:bg-white/[0.05]'
              )}
            >
              <Lightbulb className="h-3.5 w-3.5 animate-pulse" />
              <span>Hints</span>
            </button>

            <button
              ref={examplesBtnRef}
              type="button"
              aria-expanded={examplesOpen}
              aria-haspopup="menu"
              className={cn(
                'flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all',
                examplesOpen
                  ? 'border-white/[0.15] bg-white/[0.08] text-white'
                  : 'border-white/[0.06] bg-white/[0.03] text-[#a1a1aa] hover:bg-white/[0.05]'
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
          <div className="border-t border-white/[0.05] px-4 py-2.5 bg-[#0d0d10]">
            <div className="flex flex-wrap gap-1.5">
              {HINTS.map((h) => (
                <div
                  key={h.syntax}
                  className="flex items-center gap-1.5 rounded-lg border border-white/[0.05] bg-white/[0.02] px-2.5 py-1"
                  title={h.desc}
                >
                  <code
                    className="text-[11px] text-white font-semibold font-mono"
                  >
                    {h.syntax}
                  </code>
                  <span className="text-[10px] text-[#52525b]">{h.desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="relative z-0 min-h-0 flex-1 isolate bg-[#09090b]">
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
            fontSize: 12,
            lineHeight: 20,
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

      {/* Code Status Bar */}
      <div className="relative z-30 shrink-0 border-t border-white/[0.05] bg-[#0a0a0d] h-7 px-4 flex items-center justify-between text-[10px] text-[#52525b] font-medium font-mono select-none">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[#4ade80]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80]" />
            IDE Synced
          </span>
          <div className="h-3 w-px bg-white/[0.06]" />
          <span>{value.split('\n').length} lines</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Tab Size: 2</span>
          <div className="h-3 w-px bg-white/[0.06]" />
          <span>Markdown DSL</span>
        </div>
      </div>
    </div>
  );
});
