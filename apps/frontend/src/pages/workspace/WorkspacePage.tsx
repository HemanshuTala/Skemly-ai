import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Users,
  Crown,
  Shield,
  Edit3,
  MessageSquare,
  Eye,
  MoreVertical,
  Trash2,
  Building2,
  UserPlus,
  ChevronDown,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

type Role = 'owner' | 'admin' | 'editor' | 'commenter' | 'viewer'

const ROLE_CONFIG: Record<Role, { icon: React.ElementType; label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' }> = {
  owner:     { icon: Crown,        label: 'Owner',     variant: 'warning' },
  admin:     { icon: Shield,       label: 'Admin',     variant: 'info'    },
  editor:    { icon: Edit3,        label: 'Editor',    variant: 'success' },
  commenter: { icon: MessageSquare,label: 'Commenter', variant: 'default' },
  viewer:    { icon: Eye,          label: 'Viewer',    variant: 'default' },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}
const item = {
  hidden: { opacity: 0, y: 8 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
}

export default function WorkspacePage() {
  const {
    currentWorkspace,
    members,
    fetchMembers,
    removeMember,
    updateMemberRole,
    isLoading,
  } = useWorkspaceStore()

  useEffect(() => {
    if (currentWorkspace) fetchMembers(currentWorkspace.id)
  }, [currentWorkspace])

  const handleRemoveMember = async (userId: string) => {
    if (!currentWorkspace) return
    if (confirm('Remove this member? They will lose access to the workspace.')) {
      await removeMember(currentWorkspace.id, userId)
      toast.success('Member removed')
    }
  }

  const handleUpdateRole = async (userId: string, newRole: string) => {
    if (!currentWorkspace) return
    await updateMemberRole(currentWorkspace.id, userId, newRole)
    toast.success(`Role updated to ${newRole}`)
  }

  /* ── No workspace ── */
  if (!currentWorkspace) {
    return (
      <div className="max-w-[900px] mx-auto px-6 py-20 flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-5">
          <Building2 className="w-6 h-6 text-[#52525b]" />
        </div>
        <h3 className="text-[15px] font-semibold text-white mb-1.5">No workspace selected</h3>
        <p className="text-[13px] text-[#52525b]">Select a workspace from the sidebar to manage members</p>
      </div>
    )
  }

  /* ── Loading ── */
  if (isLoading && members.length === 0) {
    return (
      <div className="max-w-[900px] mx-auto px-6 py-8 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32 rounded" />
          <Skeleton className="h-3.5 w-48 rounded" />
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-[#0d0d10] p-5 space-y-4">
          <Skeleton className="h-4 w-24 rounded" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3 rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
              </div>
              <Skeleton className="h-5 w-16 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[900px] mx-auto px-6 py-8 space-y-6">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h1 className="text-[22px] font-bold text-white tracking-[-0.02em]">Members</h1>
        <p className="text-[13px] text-[#52525b] mt-0.5">
          {members.length} member{members.length !== 1 ? 's' : ''} in{' '}
          <span className="text-[#a1a1aa]">{currentWorkspace.name}</span>
        </p>
      </motion.div>

      {/* ── Workspace info card ── */}
      <div className="rounded-xl border border-white/[0.06] bg-[#0d0d10] p-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-white/[0.07] border border-white/[0.10] flex items-center justify-center shrink-0">
          <Building2 className="w-5 h-5 text-[#a1a1aa]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-white">{currentWorkspace.name}</p>
          <p className="text-[12px] text-[#52525b]">
            {currentWorkspace.type === 'team' ? 'Team workspace' : 'Personal workspace'}
          </p>
        </div>
        <Badge variant={currentWorkspace.type === 'team' ? 'info' : 'default'}>
          {currentWorkspace.type === 'team' ? 'Team' : 'Personal'}
        </Badge>
      </div>

      {/* ── Members list ── */}
      <div className="rounded-xl border border-white/[0.06] bg-[#0d0d10] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#52525b]" />
            <h2 className="text-[13px] font-semibold text-white">Team Members</h2>
            <span className="text-[11px] text-[#52525b] ml-1">({members.length})</span>
          </div>
          {/* Invite button — navigates to workspace settings */}
          <button
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.07] bg-white/[0.04] text-[11px] text-[#a1a1aa] font-medium hover:bg-white/[0.08] hover:text-white transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Invite
          </button>
        </div>

        {members.length === 0 ? (
          <div className="py-14 text-center">
            <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mx-auto mb-4">
              <Users className="w-5 h-5 text-[#52525b]" />
            </div>
            <h3 className="text-[14px] font-semibold text-white mb-1.5">No members yet</h3>
            <p className="text-[12px] text-[#52525b]">Invite team members to start collaborating</p>
          </div>
        ) : (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="divide-y divide-white/[0.04]"
          >
            {members.map((member) => {
              const cfg = ROLE_CONFIG[member.role as Role] || ROLE_CONFIG.viewer
              const RoleIcon = cfg.icon
              const initials = member.name
                ? member.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                : '?'

              return (
                <motion.div
                  key={member.userId}
                  variants={item}
                  className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors group"
                >
                  {/* Avatar + info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-white/[0.08] border border-white/[0.10] flex items-center justify-center text-[12px] font-semibold text-white shrink-0 overflow-hidden">
                      {member.avatar
                        ? <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                        : initials
                      }
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-white truncate">{member.name}</span>
                        <RoleIcon className="w-3.5 h-3.5 text-[#52525b] shrink-0" />
                      </div>
                      <p className="text-[11px] text-[#52525b] truncate">{member.email}</p>
                    </div>
                  </div>

                  {/* Right: badge + menu */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={cfg.variant} size="sm">{cfg.label}</Badge>

                    {member.role !== 'owner' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.08] transition-all">
                            <MoreVertical className="w-3.5 h-3.5 text-[#71717a]" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleUpdateRole(member.userId, 'admin')}>
                            Change to Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateRole(member.userId, 'editor')}>
                            Change to Editor
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateRole(member.userId, 'commenter')}>
                            Change to Commenter
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateRole(member.userId, 'viewer')}>
                            Change to Viewer
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-[#f87171] focus:text-[#f87171]"
                            onClick={() => handleRemoveMember(member.userId)}
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-2" />
                            Remove Member
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>
    </div>
  )
}
