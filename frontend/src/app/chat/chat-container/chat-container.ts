import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, input, signal } from '@angular/core';
import { ChatApiService } from '../data/chat-api.service';
import { ChatService } from '../data/chat.service';
import { MessageList } from '../ui/message-list/message-list';
import { MessageInput } from '../ui/message-input/message-input';
import { TypingIndicator } from '../ui/typing-indicator/typing-indicator';

@Component({
  selector: 'app-chat-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MessageList, MessageInput, TypingIndicator],
  providers: [ChatService],
  templateUrl: './chat-container.html',
  styleUrl: './chat-container.css',
})
export class ChatContainer implements OnInit {
  readonly appUserId = input.required<string>();
  readonly threadId = input.required<string>();

  protected readonly chatService = inject(ChatService);
  private readonly chatApi = inject(ChatApiService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly initError = signal<string | null>(null);

  ngOnInit(): void {
    this.destroyRef.onDestroy(() => void this.chatService.disconnect());
    void this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      const issued = await this.chatApi.fetchToken(this.appUserId());
      await this.chatService.connect(this.appUserId(), issued.acsUserId, issued.endpoint, issued.token);
      await this.chatService.openThread(this.threadId());
    } catch {
      this.initError.set('Could not connect to chat. Please try again.');
    }
  }

  protected onSend(content: string): void {
    void this.chatService.sendMessage(content);
  }

  protected onTyping(): void {
    void this.chatService.sendTypingNotification();
  }

  protected onLoadOlder(): void {
    void this.chatService.loadOlderMessages();
  }
}
