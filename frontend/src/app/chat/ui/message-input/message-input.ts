import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';

// Throttled, not debounced: we want the other participant to keep seeing
// "typing…" while typing continues, not only once they pause.
const TYPING_THROTTLE_MS = 2000;

@Component({
  selector: 'app-message-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './message-input.html',
  styleUrl: './message-input.css',
})
export class MessageInput {
  readonly send = output<string>();
  readonly typing = output<void>();

  protected readonly draft = signal('');
  private lastTypingEmitAt = 0;

  protected onDraftInput(event: Event): void {
    this.draft.set((event.target as HTMLTextAreaElement).value);

    const now = Date.now();
    if (now - this.lastTypingEmitAt < TYPING_THROTTLE_MS) return;
    this.lastTypingEmitAt = now;
    this.typing.emit();
  }

  protected onSubmit(): void {
    const content = this.draft().trim();
    if (!content) return;

    this.send.emit(content);
    this.draft.set('');
  }
}
