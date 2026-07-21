import { Db } from 'mongodb';

export interface ChatIdentity {
  appUserId: string;
  acsUserId: string;
}

export function getChatIdentityCollection(db: Db) {
  return db.collection<ChatIdentity>('chat_identities');
}