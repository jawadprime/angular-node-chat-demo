import * as dotenv from 'dotenv';

dotenv.config();

export interface Config {
  port: number;
  acs: {
    connectionString: string;
    endpoint: string;
  };
  mongo: {
    uri: string;
    dbName: string;
  };
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parseEndpoint(connectionString: string): string {
  const match = connectionString.match(/endpoint=(.*?)(;|$)/i);
  if (!match) {
    throw new Error('ACS_CONNECTION_STRING is missing the "endpoint=" part');
  }
  return match[1];
}

export function loadConfig(): Config {
  const connectionString = required('ACS_CONNECTION_STRING');
  return {
    port: Number(process.env.PORT ?? 3000),
    acs: {
      connectionString,
      endpoint: parseEndpoint(connectionString),
    },
    mongo: {
      uri: process.env.MONGO_URI ?? 'mongodb://localhost:27017',
      dbName: process.env.MONGO_DB_NAME ?? 'viewdu_chat',
    },
  };
}
