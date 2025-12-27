import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').optional(),
  description: z.string().optional(),
});

export const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Workspace name is required'),
  projectId: z.string().min(1, 'Project ID is required'),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1, 'Workspace name is required').optional(),
});
