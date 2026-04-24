import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface UserPresence {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  isActive: boolean;
  lastSeen: Date;
  cursor?: { x: number; y: number } | null;
  selectedNode?: string | null;
}

interface PresenceIndicatorProps {
  users: UserPresence[];
  maxShown?: number;
  showTooltips?: boolean;
}

const PRESENCE_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#84cc16', // lime
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#d946ef', // fuchsia
  '#f43f5e', // rose
];

export function getPresenceColor(index: number): string {
  return PRESENCE_COLORS[index % PRESENCE_COLORS.length];
}

export function PresenceIndicator({ users, maxShown = 4, showTooltips = true }: PresenceIndicatorProps) {
  const activeUsers = users.filter(u => u.isActive);
  const displayedUsers = activeUsers.slice(0, maxShown);
  const remainingCount = activeUsers.length - maxShown;

  return (
    <div className="flex items-center -space-x-2">
      <AnimatePresence>
        {displayedUsers.map((user, index) => (
          <motion.div
            key={user.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ delay: index * 0.05, type: 'spring', stiffness: 400 }}
            className={cn(
              'relative flex items-center justify-center w-8 h-8 rounded-full',
              'border-2 border-[#18181b]',
              showTooltips && 'group cursor-pointer'
            )}
            style={{ backgroundColor: user.color, zIndex: maxShown - index }}
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-[10px] font-bold text-white">
                {user.name.slice(0, 2).toUpperCase()}
              </span>
            )}

            {/* Online indicator */}
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-[#18181b]" />

            {/* Tooltip */}
            {showTooltips && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#27272a] border border-[#3f3f46] rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                {user.name}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#27272a]" />
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {remainingCount > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="relative flex items-center justify-center w-8 h-8 rounded-full bg-[#27272a] border-2 border-[#18181b] text-[10px] font-bold text-[#a1a1aa] z-0"
        >
          +{remainingCount}
        </motion.div>
      )}
    </div>
  );
}

interface CollaboratorCursorProps {
  user: UserPresence;
  containerRef: React.RefObject<HTMLElement>;
}

export function CollaboratorCursor({ user }: CollaboratorCursorProps) {
  if (!user.cursor) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        x: user.cursor.x,
        y: user.cursor.y,
      }}
      transition={{ type: 'spring', damping: 30, stiffness: 200 }}
      className="fixed pointer-events-none z-50"
      style={{ left: 0, top: 0 }}
    >
      {/* Cursor arrow */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        style={{ 
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
          color: user.color,
        }}
      >
        <path
          d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
          fill={user.color}
          stroke="white"
          strokeWidth="1"
        />
      </svg>

      {/* Name label */}
      <div
        className="absolute left-4 top-4 px-2 py-1 rounded-md text-[10px] font-bold text-white whitespace-nowrap"
        style={{ backgroundColor: user.color }}
      >
        {user.name}
      </div>
    </motion.div>
  );
}

interface ActivityFeedProps {
  activities: Array<{
    id: string;
    user: UserPresence;
    action: string;
    target?: string;
    timestamp: Date;
  }>;
  maxItems?: number;
}

export function ActivityFeed({ activities, maxItems = 5 }: ActivityFeedProps) {
  const recentActivities = activities.slice(0, maxItems);

  return (
    <div className="space-y-2">
      <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Recent Activity</h4>
      <div className="space-y-1.5">
        <AnimatePresence initial={false}>
          {recentActivities.map((activity) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[#27272a]/50"
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                style={{ backgroundColor: activity.user.color }}
              >
                {activity.user.name.slice(0, 2).toUpperCase()}
              </div>
              <span className="text-xs text-[#a1a1aa] truncate flex-1">
                <span className="text-white font-medium">{activity.user.name}</span>
                {' '}{activity.action}
                {activity.target && (
                  <span className="text-white"> {activity.target}</span>
                )}
              </span>
              <span className="text-[10px] text-[#71717a] flex-shrink-0">
                {formatTimeAgo(activity.timestamp)}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        {activities.length === 0 && (
          <p className="text-xs text-[#71717a] text-center py-4">No recent activity</p>
        )}
      </div>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface WorkspaceStatusProps {
  isConnected: boolean;
  lastSyncTime?: Date;
  pendingChanges?: number;
}

export function WorkspaceStatus({ isConnected, lastSyncTime, pendingChanges = 0 }: WorkspaceStatusProps) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#27272a] border border-[#3f3f46]">
      <div className="flex items-center gap-1.5">
        <span className={cn(
          'w-2 h-2 rounded-full',
          isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
        )} />
        <span className="text-[10px] font-medium text-[#a1a1aa] uppercase tracking-wider">
          {isConnected ? 'Connected' : 'Offline'}
        </span>
      </div>

      {lastSyncTime && (
        <div className="h-3 w-px bg-[#3f3f46]" />
      )}

      {lastSyncTime && (
        <span className="text-[10px] text-[#71717a]">
          Synced {formatTimeAgo(lastSyncTime)}
        </span>
      )}

      {pendingChanges > 0 && (
        <>
          <div className="h-3 w-px bg-[#3f3f46]" />
          <span className="text-[10px] font-medium text-amber-400">
            {pendingChanges} pending
          </span>
        </>
      )}
    </div>
  );
}
