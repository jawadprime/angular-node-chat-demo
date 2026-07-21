import { Db, MongoClient } from 'mongodb';

export async function connectMongo(uri: string, dbName: string): Promise<Db> {
  const client = new MongoClient(uri);
  await client.connect();
  
  return client.db(dbName);
}