import { Db } from 'mongodb';
import { AcsClient } from '../../shared/acs/acs-client';
import { createChatIdentity, findChatIdentity } from '../../shared/database/chat-identity/repository';
import { ok, unexpected, Result } from '../../shared/result';
import { CreatedThread, CreateThreadInput } from './contracts';

async function resolveAcsUserId(db: Db, acs: AcsClient, appUserId: string): Promise<string> {
  const existing = await findChatIdentity(db, appUserId);
  return existing ? existing.acsUserId : createChatIdentity(db, acs, appUserId);
}

export async function createThread(
  db: Db,
  acs: AcsClient,
  input: CreateThreadInput,
): Promise<Result<CreatedThread>> {
  const appUserIds = [...new Set([input.creatorAppUserId, ...input.participantAppUserIds])];

  try {
    const acsUserIds = await Promise.all(appUserIds.map((id) => resolveAcsUserId(db, acs, id)));
    const threadId = await acs.createThread({
      topic: input.topic,
      creatorAcsUserId: acsUserIds[0],
      participantAcsUserIds: acsUserIds,
    });

    return ok({ threadId });
  } catch {
    return unexpected('Failed to create chat thread');
  }
}