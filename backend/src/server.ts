import { loadConfig } from './config';
import { connectMongo } from './shared/database/mongo-client';
import { createChatIdentityIndexes } from './shared/database/chat-identity/indexes';
import { createAcsClient } from './shared/acs/acs-client';
import { createApp } from './app';

async function main(): Promise<void> {
  const config = loadConfig();

  const db = await connectMongo(config.mongo.uri, config.mongo.dbName);
  await createChatIdentityIndexes(db);
  const acs = createAcsClient(config.acs.connectionString, config.acs.endpoint);

  const app = createApp({ db, acs });
  app.listen(config.port, () => {
    console.log(`Chat backend listening on http://localhost:${config.port}`);
  });
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
