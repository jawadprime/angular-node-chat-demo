import { Router } from 'express';
import { Db } from 'mongodb';
import { AcsClient } from '../../shared/acs/acs-client';
import { sendResult } from '../../shared/http/send-result';
import { issueToken } from './orchestrator';

export function issueTokenRoute(db: Db, acs: AcsClient): Router {
  const router = Router();

  router.get('/', async (req, res) => {
    const result = await issueToken(db, acs, req.userId!);
    sendResult(res, result);
  });

  return router;
}