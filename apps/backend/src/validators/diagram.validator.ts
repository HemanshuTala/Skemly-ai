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
    ]).optional(),
    workspaceId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid workspace ID').optional(),
    projectId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid project ID')
      .optional()
      .nullable(),
    syntax: z.string().max(200000).optional(),
  }).passthrough(),
});

export const updateDiagramSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    syntax: z.string().max(200000).optional(),
    nodes: z.array(z.any()).optional(),
    edges: z.array(z.any()).optional(),
    viewport: z
      .object({
        x: z.number().optional(),
        y: z.number().optional(),
        zoom: z.number().min(0.01).max(20).optional(),
      })
      .optional(),
    projectId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .optional()
      .nullable(),
    createVersion: z.boolean().optional(),
    isPublic: z.boolean().optional(),
    theme: z.string().optional(),
    backgroundColor: z.string().optional(),
    description: z.string().max(1000).optional(),
  }).passthrough(),
});

export const createShareLinkSchema = z.object({
  body: z.object({
    expiresAt: z.string().datetime().optional().nullable(),
    password: z.string().min(4).max(50).optional().nullable(),
  }).passthrough(),
});

export const saveVersionSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
  }).passthrough(),
});

export const listDiagramsSchema = z.object({
  query: z.object({
    workspaceId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    projectId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    search: z.string().max(200).optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }).passthrough(),
});
