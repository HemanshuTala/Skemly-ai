import { z } from 'zod';

/**
 * §14.1 Workspace Input Validation
 */

export const createWorkspaceSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100),
    type: z.enum(['personal', 'team']).optional(),
  }),
});

export const updateWorkspaceSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    settings: z
      .object({
        defaultMemberRole: z.enum(['editor', 'commenter', 'viewer']).optional(),
        allowPublicLinks: z.boolean().optional(),
        allowGuestComments: z.boolean().optional(),
      })
      .optional(),
  }),
});

export const inviteMemberSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    role: z.enum(['admin', 'editor', 'commenter', 'viewer']),
  }),
});

export const updateMemberRoleSchema = z.object({
  body: z.object({
    role: z.enum(['admin', 'editor', 'commenter', 'viewer']),
  }),
});

export const transferOwnershipSchema = z.object({
  body: z.object({
    newOwnerId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
  }),
});
