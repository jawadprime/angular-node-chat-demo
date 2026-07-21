import { Response } from 'express';
import { Failure, Result } from '../result';

const statusByFailureType: Record<Failure['type'], number> = {
  NotFound: 404,
  Unexpected: 500,
};

export function sendResult<T>(res: Response, result: Result<T>, successStatus = 200): void {
  if (result.ok) {
    res.status(successStatus).json(result.value);
    return;
  }
  res.status(statusByFailureType[result.failure.type]).json({ error: result.failure.message });
}