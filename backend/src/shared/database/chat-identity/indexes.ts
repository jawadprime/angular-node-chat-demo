import { Db } from 'mongodb';
import { getChatIdentityCollection } from './collection';

export async function createChatIdentityIndexes(db: Db): Promise<void> {
  await getChatIdentityCollection(db).createIndex({ appUserId: 1 }, { unique: true });
}