import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Users,
  Plus,
  Mail,
  MoreVertical,
  Crown,
  Shield,
  Edit3,
  MessageSquare,
  Eye,
  Loader2,
  Trash2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { formatDistanceToNow } from 'date-fns'

const roleIcons = {
  owner: Crown,
  admin: Shield,
  editor: Edit3,
  commenter: MessageSquare,
  viewer: Eye,
}

const roleColors = {
  owner: 'text-white',
  admin: 'text-zinc-200',
  editor: 'text-zinc-300',
  commenter: 'text-zinc-400',
  viewer: 'text-zinc-500',
}

const roleBadges = {
  owner: { variant: 'warning' as const, label: 'Owner' },
  admin: { variant: 'info' as const, label: 'Admin' },
  editor: { variant: 'success' as const, label: 'Editor' },
  commenter: { variant: 'primary' as const, label: 'Commenter' },
  viewer: { variant: 'default' as const, label: 'Viewer' },
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
    if (currentWorkspace) {
      fetchMembers(currentWorkspace.id)
    }
  }, [currentWorkspace])

  const handleRemoveMember = async (userId: string) => {
    if (!currentWorkspace) return
    if (confirm('Are you sure you want to remove this member?')) {
      await removeMember(currentWorkspace.id, userId)
    }
  }

  const handleUpdateRole = async (userId: string, newRole: string) => {
    if (!currentWorkspace) return
    await updateMemberRole(currentWorkspace.id, userId, newRole)
  }

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">No workspace selected</h3>
          <p className="text-muted-foreground">
            Please select a workspace from the sidebar
          </p>
        </div>
      </div>
    )
  }

  if (isLoading && members.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="text-white">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <h1 className="page-title mb-0 text-white">{currentWorkspace.name}</h1>
            </div>
            <p className="text-white/65">
              Manage workspace members and settings
            </p>
          </div>
        </div>
      </div>

      {/* Workspace Info */}
      <Card className="p-6 mb-8 bg-white/[0.04] border-white/12 shadow-md rounded-2xl">
        <h2 className="text-lg font-semibold mb-4 text-white">Workspace Information</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-white/80">Workspace Name</label>
            <Input value={currentWorkspace.name} readOnly />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-white/80">Type</label>
            <div className="flex items-center gap-3">
              <Badge
                variant={currentWorkspace.type === 'team' ? 'info' : 'default'}
                size="md"
              >
                {currentWorkspace.type === 'team' ? 'Team' : 'Personal'}
              </Badge>
              <Input
                value={currentWorkspace.type}
                readOnly
                className="capitalize"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Members */}
      <Card className="p-6 bg-white/[0.04] border-white/12 shadow-md rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Members ({members.length})</h2>
        </div>

        <div className="space-y-4">
          {members.map((member) => {
            const RoleIcon = roleIcons[member.role]
            const roleColor = roleColors[member.role]
            const badge = roleBadges[member.role]

            return (
              <motion.div
                key={member.userId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 rounded-xl border border-white/12 bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.name} />
                    ) : (
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </Avatar>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white">{member.name}</h3>
                      <RoleIcon className={`w-4 h-4 ${roleColor}`} />
                    </div>
                    <p className="text-sm text-white/65">{member.email}</p>
                    <p className="text-xs text-white/50 mt-1">
                      Joined {formatDistanceToNow(new Date(member.joinedAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={badge.variant} size="sm">
                    {badge.label}
                  </Badge>

                  {member.role !== 'owner' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
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
                          className="text-destructive"
                          onClick={() => handleRemoveMember(member.userId)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>

        {members.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2 text-white">No members yet</h3>
            <p className="text-white/65 mb-4">
              Invite team members to collaborate
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}
