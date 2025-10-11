import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { ChatMessage } from '../../../../models/chat-message';
import { NgTalkChannelMessageBodyComponent } from '../body/ng-talk-channel-message-body.component';

@Component({
  selector: 'ng-talk-channel-message-ref',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTalkChannelMessageBodyComponent],
  template: `
    <strong>{{ message().from().name }}</strong>
    <ng-talk-channel-message-body [message]="message()" />
  `,
  styles: `
    :host {
      display: block;
      border-radius: 9px;
      border-inline-start: 5px solid #06cf9c;
      background-color: rgba(0, 0, 0, 0.05);
      padding: 7px 12px 10px 11px;
      text-align: start;
    }

    ng-talk-channel-message-body {
      display: block;
      max-height: 3em;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    ng-talk-channel-message-body ::ng-deep img {
      max-height: 3em;
      object-fit: contain;
    }
  `
})
export class NgTalkChannelMessageRefComponent {
  public readonly message = input<ChatMessage>();
}
