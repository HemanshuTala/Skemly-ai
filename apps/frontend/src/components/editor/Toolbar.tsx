import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '../ui/tooltip';
import {
  Download,
  Sparkles,
  ArrowLeft,
  Clock,
  MessageSquare,
  History,
  HelpCircle,
  CheckCircle2,
  Pencil,
  X,
  ChevronRight,
  Loader2,
  ShieldAlert,
  Scale,
  ClipboardList,
  ChevronDown,
  Layers,
  Check,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import skemlyLogo from '@/assets/Skemly.png';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../ui/dropdown-menu';

function getUsernameColor(username: string): string {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360);
  return `hsl(${h}, 80%, 65%)`;
}

export interface ToolbarProps {
  title: string;
  onTitleChange: (title: string) => void;
  isSaving: boolean;
  lastSaved?: Date;
  onShare?: () => void;
  onExport: () => void;
  onAIAssist: () => void;
  onComments: () => void;
  onVersions: () => void;
  onShortcuts?: () => void;
  onSave?: () => void;
  onReview?: () => void;
  onTradeoffs?: () => void;
  onRequirements?: () => void;
  onInterview?: () => void;
  participants?: { socketId: string; username: string }[];
}

export function Toolbar({
  title,
  onTitleChange,
  isSaving,
  lastSaved,
  onShare,
  onExport,
  onAIAssist,
  onComments,
  onVersions,
  onShortcuts,
  onReview,
  onTradeoffs,
  onRequirements,
  onInterview,
  participants = [],
}: ToolbarProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);
  const [justSaved, setJustSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditedTitle(title);
  }, [title]);

  useEffect(() => {
    if (!isSaving && lastSaved) {
      setJustSaved(true);
      const t = setTimeout(() => setJustSaved(false), 2500);
      return () => clearTimeout(t);
    }
  }, [isSaving, lastSaved]);

  useEffect(() => {
    if (isEditingTitle) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditingTitle]);

  const handleTitleSave = () => {
    if (editedTitle.trim()) {
      onTitleChange(editedTitle.trim());
    } else {
      setEditedTitle(title);
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleTitleSave();
    if (e.key === 'Escape') {
      setEditedTitle(title);
      setIsEditingTitle(false);
    }
  };

  return (
    <div className="relative z-20 shrink-0 border-b border-white/[0.07] bg-[#0b0b0f]/95 shadow-[0_8px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl">
      <div className="h-14 flex items-center justify-between px-3 sm:px-4 gap-2">

        {/* ── LEFT ── */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Back to dashboard */}
          <TooltipProvider delayDuration={500}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link to="/dashboard">
                  <button
                    type="button"
                    className="flex items-center justify-center h-8 w-8 rounded-lg text-[#71717a] hover:text-white hover:bg-white/[0.07] transition-all active:scale-95 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs bg-white text-black font-semibold">
                Back to Dashboard
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <ChevronRight className="w-3.5 h-3.5 text-white/[0.08] shrink-0" />

          {/* Logo mark */}
          <div className="w-6 h-6 flex items-center justify-center shrink-0">
            <img src={skemlyLogo} alt="Schemely AI" className="w-full h-full object-contain" />
          </div>

          <ChevronRight className="w-3.5 h-3.5 text-white/[0.08] shrink-0" />

          {/* Edit title inline */}
          <div className="flex items-center gap-1.5 min-w-0">
            {isEditingTitle ? (
              <div className="flex items-center gap-1.5 shrink-0">
                <input
                  ref={inputRef}
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={handleTitleKeyDown}
                  className="px-2.5 py-1 text-xs font-bold bg-[#0d0d10] border border-white/[0.15] rounded-lg focus:outline-none focus:ring-1 focus:ring-white/20 w-[180px] transition-all text-white"
                />
                <button
                  type="button"
                  onClick={handleTitleSave}
                  className="p-1 rounded-lg text-white hover:bg-white/[0.06] transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => { setEditedTitle(title); setIsEditingTitle(false); }}
                  className="p-1 rounded-lg text-[#52525b] hover:bg-white/[0.06] transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingTitle(true)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg max-w-[200px] hover:bg-white/[0.04] transition-all cursor-text group/btn"
                title="Click to rename"
              >
                <h1 className="font-bold text-[13px] tracking-tight truncate text-white/90">
                  {title || 'Untitled Diagram'}
                </h1>
                <Pencil className="w-3 h-3 text-[#52525b] opacity-0 group-hover/btn:opacity-100 transition-opacity shrink-0" />
              </button>
            )}
          </div>

          {/* Sync save badge */}
          <div className="shrink-0 ml-1">
            {isSaving ? (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#fbbf24]/10 border border-[#fbbf24]/20">
                <Loader2 className="w-2.5 h-2.5 animate-spin text-[#fbbf24]" />
                <span className="text-[9px] font-bold text-[#fbbf24] uppercase tracking-wide">Saving</span>
              </div>
            ) : justSaved ? (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#4ade80]/10 border border-[#4ade80]/20">
                <Check className="w-2.5 h-2.5 text-[#4ade80]" />
                <span className="text-[9px] font-bold text-[#4ade80] uppercase tracking-wide">Saved</span>
              </div>
            ) : lastSaved ? (
              <div className="flex items-center gap-1 text-[10px] text-[#52525b]">
                <Clock className="w-3 h-3" />
                <span className="hidden sm:inline font-medium">
                  {new Date(lastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Shortcuts info */}
          {onShortcuts && (
            <TooltipProvider delayDuration={400}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={onShortcuts}
                    className="h-8 w-8 flex items-center justify-center rounded-lg text-[#52525b] hover:text-white hover:bg-white/[0.06] transition-all"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs bg-white text-black font-semibold">
                  Keyboard Shortcuts (?)
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Collab cursors info */}
          {participants && participants.length > 0 && (
            <div className="flex items-center -space-x-1.5 mr-1.5">
              {participants.map((p) => {
                const initial = p.username.charAt(0).toUpperCase();
                const color = getUsernameColor(p.username);
                return (
                  <TooltipProvider key={p.socketId} delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          style={{
                            backgroundColor: color,
                            border: '1.5px solid #09090b',
                          }}
                          className="h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-black text-[#09090b] uppercase select-none shadow-md"
                        >
                          {initial}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs bg-white text-black font-semibold">
                        {p.username}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          )}

          <div className="h-4 w-px bg-white/[0.08] mx-1" />

          {/* Comments trigger */}
          <TooltipProvider delayDuration={400}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onComments}
                  className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-[#a1a1aa] hover:text-white hover:bg-white/[0.06] transition-all text-[12px] font-medium"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Comments</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs bg-white text-black font-semibold">
                Discussion thread
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Version history trigger */}
          <TooltipProvider delayDuration={400}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onVersions}
                  className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-[#a1a1aa] hover:text-white hover:bg-white/[0.06] transition-all text-[12px] font-medium"
                >
                  <History className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">History</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs bg-white text-black font-semibold">
                Version History (Ctrl+H)
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="h-4 w-px bg-white/[0.08] mx-1" />

          {/* AI Copilot toggle */}
          <TooltipProvider delayDuration={400}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onAIAssist();
                  }}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all text-[11px] font-semibold shadow-[0_0_18px_rgba(124,58,237,0.18)] border border-violet-300/20 active:scale-95 duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Copilot</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs bg-white text-black font-semibold">
                AI diagram assistant (Ctrl+I)
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Architectural insights dropdown */}
          {(onReview || onTradeoffs || onRequirements || onInterview) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1 h-8 px-2.5 rounded-lg text-[#a1a1aa] hover:text-white hover:bg-white/[0.06] transition-all text-[12px] font-medium"
                >
                  <Layers className="w-3.5 h-3.5 text-white/70" />
                  <span className="hidden sm:inline">Insights</span>
                  <ChevronDown className="w-3 h-3 text-[#52525b]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[180px] p-1">
                {onReview && (
                  <DropdownMenuItem onClick={onReview} className="flex items-center gap-2 cursor-pointer text-xs">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Review Scorecard
                  </DropdownMenuItem>
                )}
                {onTradeoffs && (
                  <DropdownMenuItem onClick={onTradeoffs} className="flex items-center gap-2 cursor-pointer text-xs">
                    <Scale className="w-3.5 h-3.5" />
                    Tradeoffs Analysis
                  </DropdownMenuItem>
                )}
                {onRequirements && (
                  <DropdownMenuItem onClick={onRequirements} className="flex items-center gap-2 cursor-pointer text-xs">
                    <ClipboardList className="w-3.5 h-3.5" />
                    Requirements Map
                  </DropdownMenuItem>
                )}
                {onInterview && (
                  <DropdownMenuItem onClick={onInterview} className="flex items-center gap-2 cursor-pointer text-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                    Interactive Interview
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Export triggers */}
          <TooltipProvider delayDuration={400}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onExport}
                  className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-[#a1a1aa] hover:text-white hover:bg-white/[0.06] transition-all text-[12px] font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Export</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs bg-white text-black font-semibold">
                Export Options (Ctrl+E)
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
