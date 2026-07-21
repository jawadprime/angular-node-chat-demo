import express, { Express } from 'express';
import cors from 'cors';
import { Db } from 'mongodb';
import { AcsClient } from './shared/acs/acs-client';
import { identifyUser } from './shared/http/middleware/identify-user';
import { errorHandler } from './shared/http/middleware/error-handler';
import { issueTokenRoute } from './features/issue-token/route';
import { createThreadRoute } from './features/create-thread/route';

const API_VERSION = 'v1';

export interface AppDependencies {
  db: Db;
  acs: AcsClient;
}

export function createApp(dependencies: AppDependencies): Express {
  const { db, acs } = dependencies;

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.use(`/${API_VERSION}/chat/token`, identifyUser, issueTokenRoute(db, acs));
  app.use(`/${API_VERSION}/chat/threads`, identifyUser, createThreadRoute(db, acs));

  app.use(errorHandler);
  
  return app;
}