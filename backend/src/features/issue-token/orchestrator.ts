import { Db } from 'mongodb';
import { AcsClient } from '../../shared/acs/acs-client';
import { createChatIdentity, findChatIdentity } from '../../shared/database/chat-identity/repository';
import { ok, unexpected, Result } from '../../shared/result';
import { IssuedToken } from './contracts';

export async function issueToken(db: Db, acs: AcsClient, appUserId: string): Promise<Result<IssuedToken>> {
  try {
    const existing = await findChatIdentity(db, appUserId);
    const acsUserId = existing ? existing.acsUserId : await createChatIdentity(db, acs, appUserId);

    const { token, expiresOn } = await acs.issueToken(acsUserId);

    return ok({ acsUserId, token, expiresOn, endpoint: acs.endpoint });
  } catch {
    return unexpected('Failed to issue chat token');
  }
}