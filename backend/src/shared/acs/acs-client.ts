import { CommunicationIdentityClient } from '@azure/communication-identity';
import { ChatClient } from '@azure/communication-chat';
import { AzureCommunicationTokenCredential } from '@azure/communication-common';

interface CreateThreadParams {
  topic: string;
  creatorAcsUserId: string;
  participantAcsUserIds: string[];
}

export function createAcsClient(connectionString: string, endpoint: string) {
  const identityClient = new CommunicationIdentityClient(connectionString);

  async function createUser() {
    const user = await identityClient.createUser();
    return user.communicationUserId;
  }

  async function issueToken(acsUserId: string) {
    const { token, expiresOn } = await identityClient.getToken({ communicationUserId: acsUserId }, ['chat']);
    return { token, expiresOn: expiresOn.toISOString() };
  }

  async function createThread(params: CreateThreadParams) {
      const { topic, creatorAcsUserId, participantAcsUserIds } = params;

      const { token } = await issueToken(creatorAcsUserId);
      const chatClient = new ChatClient(endpoint, new AzureCommunicationTokenCredential(token));

      const result = await chatClient.createChatThread(
        { topic },
        { participants: participantAcsUserIds.map((id) => ({ id: { communicationUserId: id } })) }
      );

      if (!result.chatThread?.id) {
        throw new Error('ACS did not return a thread id');
      }
      
      return result.chatThread.id;
    }

  return { createUser, issueToken, createThread, endpoint };
}

export type AcsClient = ReturnType<typeof createAcsClient>;