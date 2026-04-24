import { Request, Response, NextFunction } from 'express';
import { Diagram } from '../models/diagram.model';
import { Note } from '../models/note.model';
import { workspaceService } from '../services/workspace.service';
import { ApiError } from '../middleware/errorHandler';

/**
 * §WS-06 Full-text search controller
 */
export const search = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { q, workspaceId, type = 'all', page = 1, limit = 20 } = req.query;
    
    if (!q || q.trim().length === 0) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Search query is required');
    }
    
    if (!workspaceId) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Workspace ID is required');
    }
    
    // Check workspace access
    const hasAccess = await workspaceService.checkAccess(workspaceId, req.userId);
    if (!hasAccess) {
      throw new ApiError(403, 'FORBIDDEN', 'Access denied to workspace');
    }
    
    const skip = (Number(page) - 1) * Number(limit);
    const results: any = {
      diagrams: [],
      notes: [],
    };
    
    // Search diagrams
    if (type === 'all' || type === 'diagrams') {
      const diagrams = await Diagram.find({
        workspaceId,
        isTrashed: false,
        $text: { $search: q },
      })
        .select('title type createdBy createdAt updatedAt')
        .populate('createdBy', 'name email avatar')
        .skip(skip)
        .limit(Number(limit))
        .sort({ score: { $meta: 'textScore' } });
      
      results.diagrams = diagrams;
    }
    
    // Search notes
    if (type === 'all' || type === 'notes') {
      const notes = await Note.find({
        workspaceId,
        $text: { $search: q },
      })
        .select('diagramId contentText createdBy createdAt')
        .populate('diagramId', 'title type')
        .populate('createdBy', 'name email avatar')
        .skip(skip)
        .limit(Number(limit))
        .sort({ score: { $meta: 'textScore' } });
      
      results.notes = notes;
    }
    
    const totalDiagrams = type === 'all' || type === 'diagrams'
      ? await Diagram.countDocuments({
          workspaceId,
          isTrashed: false,
          $text: { $search: q },
        })
      : 0;
    
    const totalNotes = type === 'all' || type === 'notes'
      ? await Note.countDocuments({
          workspaceId,
          $text: { $search: q },
        })
      : 0;
    
    res.json({
      success: true,
      data: results,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: totalDiagrams + totalNotes,
        totalDiagrams,
        totalNotes,
      },
    });
  } catch (err) {
    next(err);
  }
};
