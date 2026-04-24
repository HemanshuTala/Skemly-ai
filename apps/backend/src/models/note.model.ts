import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * §7.6 Notes Collection
 * Represents rich-text notes attached to a diagram.
 */
export interface INote extends Document {
  diagramId: Types.ObjectId;
  workspaceId: Types.ObjectId;
  content: object;       // TipTap JSON format – §NOTE-02
  contentText: string;   // for search indexing – §7.6
  isPublic: boolean;     // published publicly – §NOTE-09
  version: number;       // for version history §NOTE-08
  createdBy: Types.ObjectId;
  lastEditedBy: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema = new Schema<INote>(
  {
    diagramId: { type: Schema.Types.ObjectId, ref: 'Diagram', required: true, unique: true, index: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    content: { type: Schema.Types.Mixed, default: {} },
    contentText: { type: String, default: '', index: 'text' }, // Full-text search §WS-06
    isPublic: { type: Boolean, default: false },
    version: { type: Number, default: 1 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    lastEditedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

NoteSchema.index({ workspaceId: 1, isPublic: 1 });

export const Note = mongoose.model<INote>('Note', NoteSchema);

/**
 * §NOTE-08: Notes version history.
 */
export interface INoteVersion extends Document {
    noteId: Types.ObjectId;
    version: number;
    content: object;
    savedBy: Types.ObjectId;
    createdAt: Date;
}

const NoteVersionSchema = new Schema<INoteVersion>(
    {
        noteId: { type: Schema.Types.ObjectId, ref: 'Note', required: true, index: true },
        version: { type: Number, required: true },
        content: { type: Schema.Types.Mixed, required: true },
        savedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

NoteVersionSchema.index({ noteId: 1, version: -1 });

export const NoteVersion = mongoose.model<INoteVersion>('NoteVersion', NoteVersionSchema);
