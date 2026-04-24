import { Response, NextFunction } from 'express';
import { Note, NoteVersion } from '../models/note.model';
import { Diagram } from '../models/diagram.model';
import { ApiError } from '../middleware/errorHandler';
import { workspaceService } from '../services/workspace.service';

/**
 * §4.3 Notes controller — tied to diagram workspace membership
 */
export const getNotes = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { diagramId } = req.params;
    const diagram = await Diagram.findById(diagramId);
    if (!diagram) throw new ApiError(404, 'NOT_FOUND', 'Diagram not found');
    await workspaceService.assertWorkspaceAccess(diagram.workspaceId.toString(), req.userId);

    let note = await Note.findOne({ diagramId });
    if (!note) {
      const newNote = new Note({
        diagramId,
        workspaceId: diagram.workspaceId,
        createdBy: req.userId,
      });
      await newNote.save();
      return res.json({ success: true, data: newNote });
    }
    res.json({ success: true, data: note });
  } catch (err) {
    next(err);
  }
};

export const updateNotes = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { diagramId } = req.params;
    const { content, contentText } = req.body;

    const diagram = await Diagram.findById(diagramId);
    if (!diagram) throw new ApiError(404, 'NOT_FOUND', 'Diagram not found');
    await workspaceService.assertWorkspaceEditor(diagram.workspaceId.toString(), req.userId);

    let note = await Note.findOne({ diagramId });
    if (!note) {
      note = await Note.create({
        diagramId,
        workspaceId: diagram.workspaceId,
        content: content ?? {},
        contentText: contentText ?? '',
        createdBy: req.userId,
        lastEditedBy: req.userId,
        version: 1,
      });
      return res.json({ success: true, data: note });
    }

    if (content !== undefined) note.content = content;
    if (contentText !== undefined) note.contentText = contentText;
    note.lastEditedBy = req.userId as any;
    note.version += 1;
    await note.save();

    if (note.version % 10 === 0) {
      await NoteVersion.create({
        noteId: note._id,
        version: note.version,
        content: note.content,
        savedBy: req.userId,
      });
    }

    res.json({ success: true, data: note });
  } catch (err) {
    next(err);
  }
};

export const getNoteVersions = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { diagramId } = req.params;
    const diagram = await Diagram.findById(diagramId);
    if (!diagram) throw new ApiError(404, 'NOT_FOUND', 'Diagram not found');
    await workspaceService.assertWorkspaceAccess(diagram.workspaceId.toString(), req.userId);

    const note = await Note.findOne({ diagramId });
    if (!note) throw new ApiError(404, 'NOT_FOUND', 'Note not found');

    const versions = await NoteVersion.find({ noteId: note._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: versions });
  } catch (err) {
    next(err);
  }
};

export const publishNotes = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { diagramId } = req.params;
    const diagram = await Diagram.findById(diagramId);
    if (!diagram) throw new ApiError(404, 'NOT_FOUND', 'Diagram not found');
    await workspaceService.assertWorkspaceEditor(diagram.workspaceId.toString(), req.userId);

    await Note.findOneAndUpdate({ diagramId }, { isPublic: true });
    res.json({ success: true, message: 'Notes published' });
  } catch (err) {
    next(err);
  }
};

export const unpublishNotes = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { diagramId } = req.params;
    const diagram = await Diagram.findById(diagramId);
    if (!diagram) throw new ApiError(404, 'NOT_FOUND', 'Diagram not found');
    await workspaceService.assertWorkspaceEditor(diagram.workspaceId.toString(), req.userId);

    await Note.findOneAndUpdate({ diagramId }, { isPublic: false });
    res.json({ success: true, message: 'Notes unpublished' });
  } catch (err) {
    next(err);
  }
};
