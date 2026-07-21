import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-typing-indicator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './typing-indicator.html',
  styleUrl: './typing-indicator.css',
})
export class TypingIndicator {
  readonly typingUsers = input.required<ReadonlySet<string>>();

  protected readonly label = computed(() => {
    const count = this.typingUsers().size;
    if (count === 0) return '';
    return count === 1 ? 'Someone is typing…' : `${count} people are typing…`;
  });
}
