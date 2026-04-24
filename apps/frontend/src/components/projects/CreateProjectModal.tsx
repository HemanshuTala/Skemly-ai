import { useState } from 'react';
import { Modal } from '../ui/modal';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { FileText, FolderOpen, Settings, Sparkles, Users } from 'lucide-react';
import { ProjectIcon } from './ProjectIcon';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; description?: string; icon?: string; color?: string }) => Promise<void>;
}

const COLORS = [
  '#09090b', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f59e0b', '#10b981', '#06b6d4', '#3b82f6',
];

const ICONS = [
  { key: 'folder', label: 'Folder', Icon: FolderOpen },
  { key: 'file', label: 'File', Icon: FileText },
  { key: 'sparkle', label: 'Sparkles', Icon: Sparkles },
  { key: 'users', label: 'Team', Icon: Users },
  { key: 'settings', label: 'Settings', Icon: Settings },
];

export function CreateProjectModal({ isOpen, onClose, onCreate }: CreateProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('folder');
  const [selectedColor, setSelectedColor] = useState('#09090b');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      await onCreate({
        name: name.trim(),
        description: description.trim() || undefined,
        icon: selectedIcon,
        color: selectedColor,
      });
      // Reset form
      setName('');
      setDescription('');
      setSelectedIcon('folder');
      setSelectedColor('#09090b');
      onClose();
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Project"
      description="Organize your diagrams into projects"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Project Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Awesome Project"
          required
          autoFocus
          maxLength={60}
          helperText="Up to 60 characters"
        />

        <div>
          <label className="block text-sm font-medium mb-2">Description (optional)</label>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Max 240 characters</span>
            <span className="text-xs text-muted-foreground">{description.length}/240</span>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this project about?"
            className="w-full px-3 py-2 rounded-xl border border-input bg-background/80 text-foreground backdrop-blur-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/35 focus:border-primary/40 hover:border-border/90 transition-colors"
            rows={3}
            maxLength={240}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-3">Icon</label>
          <div className="grid grid-cols-8 gap-2">
            {ICONS.map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedIcon(key)}
                aria-label={label}
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-colors ${
                  selectedIcon === key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
                disabled={isLoading}
              >
                <Icon className="w-5 h-5" />
              </button>
            ))}
          </div>

          <div className="mt-3 text-xs text-muted-foreground flex items-center gap-2">
            <span>Selected:</span>
            <span className="inline-flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-muted flex items-center justify-center">
                <ProjectIcon icon={selectedIcon} className="w-4 h-4" />
              </span>
              <span className="capitalize">{selectedIcon}</span>
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-3">Color</label>
          <div className="grid grid-cols-8 gap-2">
            {COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(color)}
                className={`w-10 h-10 rounded-lg transition-all ${
                  selectedColor === color ? 'ring-2 ring-offset-2 ring-primary-500' : ''
                }`}
                style={{ backgroundColor: color }}
                disabled={isLoading}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-4">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Create Project
          </Button>
        </div>
      </form>
    </Modal>
  );
}
