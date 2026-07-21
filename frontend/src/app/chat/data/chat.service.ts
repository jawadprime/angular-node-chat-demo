import { Injectable, inject, signal } from '@angular/core';
import {
  ChatClient,
  ChatThreadClient,
  ChatMessage as AcsChatMessage,
  ChatMessageReceivedEvent,
  TypingIndicatorReceivedEvent,
  ReadReceiptReceivedEvent,
} from '@azure/communication-chat';
import {
  AzureCommunicationTokenCredential,
  CommunicationIdentifierKind,
  isCommunicationUserIdentifier,
} from '@azure/communication-common';
import { ChatMessage, ConnectionState } from './chat-api.models';
import { ChatApiService } from './chat-api.service';

const TYPING_INDICATOR_TIMEOUT_MS = 8000;

function extractAcsUserId(identifier?: CommunicationIdentifierKind): string {
  return identifier && isCommunicationUserIdentifier(identifier) ? identifier.communicationUserId : 'unknown';
}

// The REST history API returns message type as lowercase ("text"), but the
// realtime signaling event returns it capitalized ("Text") — compare
// case-insensitively so both paths recognize the same message type.
function isTextMessage(type: string): boolean {
  return type.toLowerCase() === 'text';
}

// Scoped per chat-container instance (not providedIn: 'root') — the state
// here belongs to one open thread, so two chat panels must not share it.
@Injectable()
export class ChatService {
  private readonly chatApi = inject(ChatApiService);

  private chatClient?: ChatClient;
  private threadClient?: ChatThreadClient;
  private ownAcsUserId = '';
  private readonly typingTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
  private historyPages?: AsyncIterableIterator<AcsChatMessage[]>;

  readonly messages = signal<ChatMessage[]>([]);
  readonly typingUsers = signal<ReadonlySet<string>>(new Set());
  readonly readMessageIds = signal<ReadonlySet<string>>(new Set());
  readonly connectionState = signal<ConnectionState>('idle');
  readonly loadingOlderMessages = signal(false);
  readonly hasMoreHistory = signal(true);

  async connect(appUserId: string, acsUserId: string, endpoint: string, initialToken: string): Promise<void> {
    this.ownAcsUserId = acsUserId;
    this.connectionState.set('connecting');

    try {
      const credential = new AzureCommunicationTokenCredential({
        token: initialToken,
        refreshProactively: true,
        tokenRefresher: this.chatApi.createTokenRefresher(appUserId),
      });

      this.chatClient = new ChatClient(endpoint, credential);
      await this.chatClient.startRealtimeNotifications();

      this.chatClient.on('chatMessageReceived', this.handleMessageReceived);
      this.chatClient.on('typingIndicatorReceived', this.handleTypingIndicator);
      this.chatClient.on('readReceiptReceived', this.handleReadReceipt);

      this.connectionState.set('connected');
    } catch {
      this.connectionState.set('error');
    }
  }

  // Loads only the most recent page of history. Older messages are fetched
  // on demand via loadOlderMessages() as the user scrolls up, rather than
  // eagerly loading the entire thread up front.
  async openThread(threadId: string): Promise<void> {
    if (!this.chatClient) return;
    this.threadClient = this.chatClient.getChatThreadClient(threadId);
    this.historyPages = this.threadClient.listMessages().byPage();
    this.messages.set([]);
    this.hasMoreHistory.set(true);

    await this.loadNextHistoryPage();
  }

  async loadOlderMessages(): Promise<void> {
    if (this.loadingOlderMessages() || !this.hasMoreHistory()) return;

    this.loadingOlderMessages.set(true);
    try {
      await this.loadNextHistoryPage();
    } finally {
      this.loadingOlderMessages.set(false);
    }
  }

  private async loadNextHistoryPage(): Promise<void> {
    if (!this.historyPages) return;

    const result = await this.historyPages.next();
    if (result.done || !result.value) {
      this.hasMoreHistory.set(false);
      return;
    }

    // Each page arrives newest-first; reverse it so the page itself reads
    // oldest-first, then prepend — older pages always end up before what's
    // already loaded.
    const page = result.value
      .filter((message) => isTextMessage(message.type) && message.content?.message)
      .map((message) =>
        this.toChatMessage(
          message.id,
          message.sender,
          message.senderDisplayName,
          message.content!.message!,
          message.createdOn,
        ),
      )
      .reverse();

    this.messages.update((current) => [...page, ...current]);
  }

  async sendMessage(content: string): Promise<void> {
    await this.threadClient?.sendMessage({ content });
  }

  async sendTypingNotification(): Promise<void> {
    await this.threadClient?.sendTypingNotification();
  }

  async markAsRead(messageId: string): Promise<void> {
    await this.threadClient?.sendReadReceipt({ chatMessageId: messageId });
  }

  async disconnect(): Promise<void> {
    this.typingTimeouts.forEach(clearTimeout);
    this.typingTimeouts.clear();

    if (!this.chatClient) return;
    this.chatClient.off('chatMessageReceived', this.handleMessageReceived);
    this.chatClient.off('typingIndicatorReceived', this.handleTypingIndicator);
    this.chatClient.off('readReceiptReceived', this.handleReadReceipt);
    await this.chatClient.stopRealtimeNotifications();
  }

  private readonly handleMessageReceived = (event: ChatMessageReceivedEvent): void => {
    if (!isTextMessage(event.type)) return;

    const chatMessage = this.toChatMessage(event.id, event.sender, event.senderDisplayName, event.message, event.createdOn);
    this.messages.update((current) => [...current, chatMessage]);

    // First-pass simplification: mark as read the instant it arrives, rather
    // than tracking scroll position or tab visibility.
    if (!chatMessage.isOwnMessage) {
      void this.markAsRead(event.id);
    }
  };

  private readonly handleTypingIndicator = (event: TypingIndicatorReceivedEvent): void => {
    const acsUserId = extractAcsUserId(event.sender);
    if (acsUserId === this.ownAcsUserId) return;

    this.typingUsers.update((current) => new Set(current).add(acsUserId));

    clearTimeout(this.typingTimeouts.get(acsUserId));
    
    this.typingTimeouts.set(
      acsUserId,
      setTimeout(() => {
        this.typingUsers.update((current) => {
          const next = new Set(current);
          next.delete(acsUserId);
          return next;
        });
        this.typingTimeouts.delete(acsUserId);
      }, TYPING_INDICATOR_TIMEOUT_MS),
    );
  };

  private readonly handleReadReceipt = (event: ReadReceiptReceivedEvent): void => {
    const readerAcsUserId = extractAcsUserId(event.sender);
    if (readerAcsUserId === this.ownAcsUserId) return;

    this.readMessageIds.update((current) => new Set(current).add(event.chatMessageId));
  };

  private toChatMessage(
    id: string,
    sender: CommunicationIdentifierKind | undefined,
    senderDisplayName: string | undefined,
    content: string,
    createdOn: Date,
  ): ChatMessage {
    const senderAcsUserId = extractAcsUserId(sender);
    return {
      id,
      senderAcsUserId,
      senderDisplayName: senderDisplayName || 'Unknown',
      content,
      createdOn,
      isOwnMessage: senderAcsUserId === this.ownAcsUserId,
    };
  }
}
