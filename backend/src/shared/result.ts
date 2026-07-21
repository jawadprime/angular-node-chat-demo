export type Failure =
  | { type: 'NotFound'; message: string }
  | { type: 'Unexpected'; message: string };

export type Result<T> = { ok: true; value: T } | { ok: false; failure: Failure };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });
export const notFound = (message: string): Result<never> => ({ ok: false, failure: { type: 'NotFound', message } });
export const unexpected = (message: string): Result<never> => ({ ok: false, failure: { type: 'Unexpected', message } });