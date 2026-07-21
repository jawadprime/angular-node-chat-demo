import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  effect,
  inject,
  input,
  output,
  untracked,
  viewChildren,
} from '@angular/core';
import { MessageItem } from '../message-item/message-item';
import { ChatMessage } from '../../data/chat-api.models';
import { VirtualScrollService } from './virtual-scroll/virtual-scroll.service';
import { VirtualScrollViewportDirective } from './virtual-scroll/virtual-scroll-viewport.directive';

@Component({
  selector: 'app-message-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MessageItem, VirtualScrollViewportDirective],
  providers: [VirtualScrollService],
  templateUrl: './message-list.html',
  styleUrl: './message-list.css',
})
export class MessageList {
  readonly messages = input.required<ChatMessage[]>();
  readonly readMessageIds = input<ReadonlySet<string>>(new Set());
  readonly loadingOlder = input(false);
  readonly loadOlder = output<void>();

  protected readonly virtualScroll = inject(VirtualScrollService);

  private readonly rowRefs = viewChildren<ElementRef<HTMLDivElement>>('rowEl');

  constructor() {
    effect(() => this.virtualScroll.setItems(this.messages()));
    this.measureRenderedRows();
  }

  // Needs viewChildren to read real row heights, which only sees this
  // component's own template — the viewport directive can't reach it.
  private measureRenderedRows(): void {
    afterRenderEffect(() => {
      const rows = this.rowRefs();
      const msgs = untracked(() => this.virtualScroll.visibleMessages());

      rows.forEach((rowRef, i) => {
        const message = msgs[i];
        if (!message) return;
        this.virtualScroll.recordRowMeasurement(message.id, rowRef.nativeElement.getBoundingClientRect().height);
      });
    });
  }
}
