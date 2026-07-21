import { NextFunction, Request, Response } from 'express';

// Demo auth: trusts an x-user-id header. Replace with real JWT verification later.
export function identifyUser(req: Request, res: Response, next: NextFunction): void {
  const userId = req.header('x-user-id');

  if (!userId) {
    res.status(401).json({ error: 'Missing x-user-id header' });
    return;
  }

  req.userId = userId;

  next();
}