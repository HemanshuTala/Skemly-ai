import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useAuthStore } from '@/stores/authStore';
import {
  Users,
  Settings,
  Building2,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';

export default function WorkspaceSettingsPage() {
  const { user } = useAuthStore();
  const { currentWorkspace } = useWorkspaceStore();

  if (!currentWorkspace) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-muted/20 flex items-center justify-center">
          <Users className="w-8 h-8 text-muted-foreground/40" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground/80">No Workspace Selected</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Please select a workspace from the dashboard to manage its settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 px-4 pt-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.2em] text-[10px]">
            <Settings className="w-3 h-3" />
            Workspace Administration
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground/90">
            {currentWorkspace.name}
          </h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" />
            Created {format(new Date(currentWorkspace.createdAt || Date.now()), 'MMMM d, yyyy')}
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Workspace Overview */}
        <Card className="p-6 rounded-3xl border-border/40 bg-card/30 backdrop-blur-sm">
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 px-1">Workspace Overview</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/10 border border-border/20">
                <div className="flex items-center gap-3 text-sm font-bold text-foreground/70">
                  <Building2 className="w-4 h-4 text-primary/60" />
                  Type
                </div>
                <Badge variant={currentWorkspace.type === 'team' ? 'info' : 'default'} className="uppercase text-[9px] font-black">
                  {currentWorkspace.type}
                </Badge>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
