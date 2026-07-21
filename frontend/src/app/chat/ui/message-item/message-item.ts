import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Avatar } from '../avatar/avatar';
import { ChatMessage } from '../../data/chat-api.models';

@Component({
  selector: 'app-message-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, Avatar],
  templateUrl: './message-item.html',
  styleUrl: './message-item.css',
})
export class MessageItem {
  readonly message = input.required<ChatMessage>();
  readonly isRead = input(false);
}
