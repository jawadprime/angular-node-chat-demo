export interface IssuedToken {
  acsUserId: string;
  token: string;
  endpoint: string;
}

export interface CreatedThread {
  threadId: string;
}

export interface ChatMessage {
  id: string;
  senderAcsUserId: string;
  senderDisplayName: string;
  content: string;
  createdOn: Date;
  isOwnMessage: boolean;
}

export type ConnectionState = 'idle' | 'connecting' | 'connected' | 'error';
