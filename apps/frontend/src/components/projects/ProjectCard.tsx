import { Link } from 'react-router-dom';
import { Card } from '../ui/card';
import { MoreVertical, FolderOpen, Trash2, Edit2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { ProjectIcon } from './ProjectIcon';

interface Project {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  diagramCount?: number;
  updatedAt: string;
}

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  return (
    <Card className="p-6 card-hover group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
            style={{ backgroundColor: project.color || '#09090b' }}
          >
            <ProjectIcon icon={project.icon} className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <Link to={`/projects/${project.id}`}>
              <h3 className="font-semibold text-lg group-hover:text-primary-600 transition-colors">
                {project.name}
              </h3>
            </Link>
            {project.description && (
              <p className="text-sm text-muted-foreground line-clamp-1">
                {project.description}
              </p>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 hover:bg-muted rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(project)}>
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(project)}
              className="text-error-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4" />
          <span>{project.diagramCount || 0} diagrams</span>
        </div>
        <span>
          Updated {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
        </span>
      </div>
    </Card>
  );
}
