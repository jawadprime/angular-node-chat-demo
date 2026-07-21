import { Db } from 'mongodb';
import { AcsClient } from '../../acs/acs-client';
import { getChatIdentityCollection } from './collection';

export function findChatIdentity(db: Db, appUserId: string) {
  return getChatIdentityCollection(db).findOne({ appUserId });
}

// Creates an ACS identity for the user. If it already exists, returns the existing identity.
export async function createChatIdentity(db: Db, acs: AcsClient, appUserId: string): Promise<string> {
  const collection = getChatIdentityCollection(db);
  const acsUserId = await acs.createUser();

  try {
    await collection.insertOne({ appUserId, acsUserId });
    
    return acsUserId;
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;

    const existing = await collection.findOne({ appUserId });
    if (existing) return existing.acsUserId;

    throw error;
  }
}

function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: number }).code === 11000;
}