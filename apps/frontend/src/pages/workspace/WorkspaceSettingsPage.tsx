import { useWorkspaceStore } from '@/stores/workspaceStore';
import {
  Users,
  Settings,
  Building2,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

export default function WorkspaceSettingsPage() {
  const { currentWorkspace } = useWorkspaceStore();

  if (!currentWorkspace) {
    return (
      <div className="mx-auto flex max-w-[900px] flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
        <div className="w-14 h-14 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-5">
          <Users className="w-6 h-6 text-[#52525b]" />
        </div>
        <h3 className="text-[15px] font-semibold text-white mb-1.5">No workspace selected</h3>
        <p className="text-[13px] text-[#52525b]">Select a workspace from the sidebar to view settings</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[960px] space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="space-y-1.5"
      >
        <div className="flex items-center gap-1.5 text-violet-300/80 font-semibold uppercase tracking-[0.16em] text-[11px]">
          <Settings className="h-3.5 w-3.5" />
          <span>Workspace settings</span>
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-white">
          {currentWorkspace.name}
        </h1>
        <p className="flex items-center gap-1.5 text-sm text-zinc-400">
          <Calendar className="w-3.5 h-3.5" />
          Created {format(new Date(currentWorkspace.createdAt || Date.now()), 'MMMM d, yyyy')}
        </p>
      </motion.div>

      {/* Workspace Overview */}
      <div className="rounded-xl border border-white/[0.06] bg-[#0d0d10] p-5 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-white/[0.04]">
          <Building2 className="w-4 h-4 text-[#52525b]" />
          <h3 className="text-[13px] font-semibold text-white">General Information</h3>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <div className="flex flex-col">
              <span className="text-[12px] font-semibold text-white">Workspace Type</span>
              <span className="text-[10px] text-[#52525b] mt-0.5">Defines collaboration capabilities</span>
            </div>
            <Badge variant={currentWorkspace.type === 'team' ? 'info' : 'default'} size="sm">
              {currentWorkspace.type === 'team' ? 'Team Workspace' : 'Personal Workspace'}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <div className="flex flex-col">
              <span className="text-[12px] font-semibold text-white">Workspace Name</span>
              <span className="text-[10px] text-[#52525b] mt-0.5">Display name for your workspace</span>
            </div>
            <span className="text-[12px] font-bold text-white">{currentWorkspace.name}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
