import { z } from 'zod';

export const createThreadSchema = z.object({
  participantAppUserIds: z.array(z.string().min(1)).min(1),
  topic: z.string().min(1).max(250).optional(),
});

export interface CreateThreadInput {
  creatorAppUserId: string;
  participantAppUserIds: string[];
  topic: string;
}

export interface CreatedThread {
  threadId: string;
}