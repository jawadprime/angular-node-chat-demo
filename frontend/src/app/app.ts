import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ChatApiService } from './chat/data/chat-api.service';
import { ChatContainer } from './chat/chat-container/chat-container';

// Hardcoded on purpose: this demo has no login system, so whoever opens a
// fresh link is always this one identity. Someone joining an existing thread
// via a shared link still types their own id below — ACS needs a distinct
// identity per participant.
const DEMO_HOST_USER_ID = 'demo-host';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ChatContainer],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly chatApi = inject(ChatApiService);

  protected readonly threadId = signal(new URLSearchParams(window.location.search).get('thread') ?? '');
  protected readonly isJoining = computed(() => this.threadId().length > 0);

  protected readonly appUserId = signal(this.isJoining() ? '' : DEMO_HOST_USER_ID);
  protected readonly participantIdsInput = signal('');
  protected readonly topic = signal('Demo chat');
  protected readonly starting = signal(false);
  protected readonly startError = signal<string | null>(null);

  // Only flips on an explicit form submit — never merely from typing. The
  // join case previously derived this from "is appUserId non-empty", which
  // meant the very first keystroke mounted the chat with a half-typed user
  // id, connecting as the wrong (usually nonexistent) identity.
  private readonly hasJoined = signal(false);

  protected readonly connected = computed(() => this.hasJoined() && this.threadId().length > 0);

  protected onUserIdInput(event: Event): void {
    this.appUserId.set((event.target as HTMLInputElement).value);
  }

  protected onParticipantIdsInput(event: Event): void {
    this.participantIdsInput.set((event.target as HTMLInputElement).value);
  }

  protected onTopicInput(event: Event): void {
    this.topic.set((event.target as HTMLInputElement).value);
  }

  protected async onStart(): Promise<void> {
    const userId = this.appUserId().trim();
    if (!userId) return;

    if (this.isJoining()) {
      this.hasJoined.set(true);
      return;
    }

    const participantAppUserIds = this.participantIdsInput()
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    if (participantAppUserIds.length === 0) {
      this.startError.set('Enter at least one participant user ID.');
      return;
    }

    this.starting.set(true);
    this.startError.set(null);

    try {
      const created = await this.chatApi.createThread(userId, participantAppUserIds, this.topic());

      const url = new URL(window.location.href);
      url.searchParams.set('thread', created.threadId);
      history.replaceState(null, '', url);
      this.threadId.set(created.threadId);
      this.hasJoined.set(true);
    } catch {
      this.startError.set('Could not start the chat. Is the backend running?');
    } finally {
      this.starting.set(false);
    }
  }
}
