import { Router } from 'express';
import { Db } from 'mongodb';
import { AcsClient } from '../../shared/acs/acs-client';
import { sendResult } from '../../shared/http/send-result';
import { createThread } from './orchestrator';
import { createThreadSchema } from './contracts';

export function createThreadRoute(db: Db, acs: AcsClient): Router {
  const router = Router();

  router.post('/', async (req, res) => {
    const parsed = createThreadSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid request body' });
      return;
    }

    const result = await createThread(db, acs, {
      creatorAppUserId: req.userId!,
      participantAppUserIds: parsed.data.participantAppUserIds,
      topic: parsed.data.topic ?? 'New chat',
    });

    sendResult(res, result, 201);
  });

  return router;
}