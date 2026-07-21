/** Adds the authenticated user id set by the identifyUser middleware. */
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export {};