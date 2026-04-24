import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
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
  Wifi,
  WifiOff,
  Loader2,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { cn } from '@/lib/utils';
import gsap from 'gsap';
import skemlyLogo from '@/assets/Skemly.png'
export interface ToolbarProps {
  title: string;
  onTitleChange: (title: string) => void;
  isSaving: boolean;
  lastSaved?: Date;
  onExport: () => void;
  onAIAssist: () => void;
  onComments: () => void;
  onVersions: () => void;
  onShortcuts?: () => void;
  onSave?: () => void;
}

export function Toolbar({
  title,
  onTitleChange,
  isSaving,
  lastSaved,
  onExport,
  onAIAssist,
  onComments,
  onVersions,
  onShortcuts,
  onSave,
}: ToolbarProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);
  const [justSaved, setJustSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const saveRef = useRef<HTMLDivElement>(null);

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

  // GSAP entrance
  useLayoutEffect(() => {
    if (!toolbarRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(toolbarRef.current!,
        { y: -56, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55, ease: 'power3.out' }
      );
      gsap.fromTo('.toolbar-action',
        { opacity: 0, scale: 0.85 },
        { opacity: 1, scale: 1, stagger: 0.04, duration: 0.35, ease: 'back.out(1.7)', delay: 0.2 }
      );
    }, toolbarRef.current);
    return () => ctx.revert();
  }, []);

  // Animate save badge
  useEffect(() => {
    if (!saveRef.current) return;
    if (justSaved) {
      gsap.fromTo(saveRef.current,
        { scale: 0.7, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(2)' }
      );
    }
  }, [justSaved]);

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
    <div
      ref={toolbarRef}
      className="shrink-0 border-b border-[#27272a] bg-[#18181b]/95 backdrop-blur-2xl"
      style={{ boxShadow: '0 1px 0 rgba(255,255,255,0.02), 0 4px 24px rgba(0,0,0,0.2)' }}
    >
      <div className="h-[52px] flex items-center justify-between px-4 gap-2">

        {/* ── LEFT ───────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 min-w-0">
          {/* Back */}
          <TooltipProvider delayDuration={500}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link to="/dashboard" className="toolbar-action">
                  <button
                    type="button"
                    className="flex items-center justify-center h-8 w-8 rounded-lg text-[#71717a] hover:text-white hover:bg-[#27272a] transition-all active:scale-95 shrink-0"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs bg-[#27272a] border-[#3f3f46] text-white">Back to Dashboard</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <ChevronRight className="w-3.5 h-3.5 text-[#3f3f46] shrink-0" />

          {/* Logo mark */}
          <div className="w-7 h-7 flex items-center justify-center shrink-0">
            <img src={skemlyLogo} alt="Skemly" className="w-full h-full object-contain" />
          </div>

          <ChevronRight className="w-3.5 h-3.5 text-[#3f3f46] shrink-0" />

          {/* Title */}
          <div className="flex items-center gap-1.5 min-w-0 group/title toolbar-action">
            {isEditingTitle ? (
              <div className="flex items-center gap-1.5">
                <input
                  ref={inputRef}
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={handleTitleKeyDown}
                  className="px-3 py-1.5 text-sm font-bold bg-[#27272a] border border-[#3f3f46] rounded-lg focus:outline-none focus:border-white focus:ring-1 focus:ring-white/20 w-[220px] transition-all text-white"
                />
                <button
                  type="button"
                  onClick={handleTitleSave}
                  className="p-1.5 rounded-lg text-white hover:bg-[#3f3f46] transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => { setEditedTitle(title); setIsEditingTitle(false); }}
                  className="p-1.5 rounded-lg text-[#71717a] hover:bg-[#27272a] transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingTitle(true)}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg max-w-[200px] hover:bg-[#27272a] transition-all cursor-text group/btn"
                title="Click to rename"
              >
                <h1 className="font-bold text-sm tracking-tight truncate text-white/90">
                  {title || 'Untitled Diagram'}
                </h1>
                <Pencil className="w-3 h-3 text-[#71717a]/0 group-hover/btn:text-[#71717a] transition-all shrink-0" />
              </button>
            )}
          </div>

          {/* Save status */}
          <div ref={saveRef} className="shrink-0 ml-2 toolbar-action">
            {isSaving ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#78350f]/30 border border-[#fbbf24]/20">
                <Loader2 className="w-3 h-3 animate-spin text-[#fbbf24]" />
                <span className="text-[10px] font-bold text-[#fbbf24] tracking-wide">Saving</span>
              </div>
            ) : justSaved ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#14532d]/30 border border-[#4ade80]/20">
                <CheckCircle2 className="w-3 h-3 text-[#4ade80]" />
                <span className="text-[10px] font-bold text-[#4ade80] tracking-wide">Saved</span>
              </div>
            ) : lastSaved ? (
              <div className="flex items-center gap-1 text-[10px] text-[#71717a]">
                <Clock className="w-3 h-3" />
                <span className="hidden sm:inline font-medium">
                  {new Date(lastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        {/* ── RIGHT ───────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Shortcuts */}
          {onShortcuts && (
            <TooltipProvider delayDuration={400}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={onShortcuts}
                    className="toolbar-action h-8 w-8 flex items-center justify-center rounded-lg text-[#71717a] hover:text-white hover:bg-[#27272a] transition-all"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs bg-[#27272a] border-[#3f3f46] text-white">Shortcuts (?)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <div className="h-5 w-px bg-[#27272a] mx-1" />

          {/* Comments */}
          <TooltipProvider delayDuration={400}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onComments}
                  className="toolbar-action flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-[#a1a1aa] hover:text-white hover:bg-[#27272a] transition-all text-xs font-medium"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Comments</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs bg-[#27272a] border-[#3f3f46] text-white">Comments</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* History */}
          <TooltipProvider delayDuration={400}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onVersions}
                  className="toolbar-action flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-[#a1a1aa] hover:text-white hover:bg-[#27272a] transition-all text-xs font-medium"
                >
                  <History className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">History</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs bg-[#27272a] border-[#3f3f46] text-white">Version History (Ctrl+H)</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="h-5 w-px bg-[#27272a] mx-1" />

          {/* AI Assist */}
          <TooltipProvider delayDuration={400}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onAIAssist}
                  className="toolbar-action flex items-center gap-1.5 h-8 px-3 rounded-lg text-[#18181b] bg-white hover:bg-[#e4e4e7] border border-white transition-all text-xs font-bold"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">AI</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs bg-[#27272a] border-[#3f3f46] text-white">AI Diagram Assistant (Ctrl+I)</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Export */}
          <TooltipProvider delayDuration={400}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onExport}
                  className="toolbar-action flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-[#a1a1aa] hover:text-white hover:bg-[#27272a] transition-all text-xs font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Export</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs bg-[#27272a] border-[#3f3f46] text-white">Export Assets (Ctrl+E)</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
