import { useState } from 'react';
import { Badge } from './ui/badge';
import { Bell, Check, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Welcome to Schemely AI',
      message: 'Start creating your first system architecture diagram',
      type: 'info',
      read: false,
      createdAt: new Date().toISOString(),
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2 rounded-lg transition-colors duration-150 focus:outline-none",
          isOpen ? "bg-white/[0.08] text-white" : "text-[#52525b] hover:text-white hover:bg-white/[0.05]"
        )}
        aria-label="Open notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#4ade80] rounded-full" />
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 mt-2 w-80 rounded-xl border border-white/[0.08] bg-[#0d0d10] shadow-2xl shadow-black/80 z-50 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-white/[0.05] bg-[#0a0a0d] flex items-center justify-between">
              <span className="text-[12px] font-semibold text-white tracking-wide">Notifications</span>
              {unreadCount > 0 && (
                <Badge variant="success" size="sm">
                  {unreadCount} new
                </Badge>
              )}
            </div>
            
            {/* List */}
            <div className="max-h-80 overflow-y-auto custom-scrollbar bg-[#0d0d10] divide-y divide-white/[0.04]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center justify-center">
                  <Inbox className="w-5 h-5 text-[#52525b] mb-2" />
                  <span className="text-xs text-[#52525b]">No notifications</span>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-3.5 hover:bg-white/[0.02] cursor-pointer transition-colors relative",
                      !notification.read && "bg-white/[0.01]"
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-white truncate">
                          {notification.title}
                        </p>
                        <p className="text-[11px] text-[#52525b] mt-0.5 leading-relaxed">
                          {notification.message}
                        </p>
                        <p className="text-[9px] text-[#3f3f46] mt-2 font-mono">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-1.5 h-1.5 bg-white rounded-full mt-1.5 shrink-0" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Actions */}
            {notifications.length > 0 && unreadCount > 0 && (
              <div className="p-2.5 border-t border-white/[0.05] bg-[#0a0a0d]">
                <button
                  onClick={handleMarkAllRead}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-white/[0.04] text-[11px] text-[#a1a1aa] font-medium hover:text-white hover:bg-white/[0.08] transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  Mark all as read
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
