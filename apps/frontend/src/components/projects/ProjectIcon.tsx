import { FolderOpen, FileText, Sparkles, Users, Settings } from 'lucide-react'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  folder: FolderOpen,
  file: FileText,
  sparkle: Sparkles,
  users: Users,
  settings: Settings,
}

export function ProjectIcon({ icon, className }: { icon?: string; className?: string }) {
  const Icon = (icon && ICON_MAP[icon]) || FolderOpen
  return <Icon className={className || 'w-5 h-5'} />
}

