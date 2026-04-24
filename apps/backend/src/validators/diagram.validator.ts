import { z } from 'zod';

/**
 * §14.1 Diagram Input Validation
 */

export const createDiagramSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200),
    type: z.enum([
      'flowchart',
      'sequence',
      'uml',
      'erd',
      'mindmap',
      'system',
      'gantt',
      'state',
      'network',
      'orgchart',
    ]),
    workspaceId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid workspace ID'),
    projectId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid project ID')
      .optional()
      .nullable(),
  }),
});

export const updateDiagramSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    syntax: z.string().max(100000).optional(), // 100KB max
    nodes: z.array(z.any()).optional(),
    edges: z.array(z.any()).optional(),
    viewport: z
      .object({
        x: z.number(),
        y: z.number(),
        zoom: z.number().min(0.1).max(10),
      })
      .optional(),
    projectId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .optional()
      .nullable(),
    createVersion: z.boolean().optional(),
  }),
});

export const createShareLinkSchema = z.object({
  body: z.object({
    expiresAt: z.string().datetime().optional(),
    password: z.string().min(4).max(50).optional(),
  }),
});

export const saveVersionSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
  }),
});

export const listDiagramsSchema = z.object({
  query: z.object({
    workspaceId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    projectId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    search: z.string().max(200).optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }),
});
