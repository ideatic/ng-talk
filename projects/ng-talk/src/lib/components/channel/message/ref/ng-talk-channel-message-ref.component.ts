import {Component, Input} from '@angular/core';
import {ChatMessage} from '../../../../models/chat-message';
import {NgTalkChannelMessageBodyComponent} from "../body/ng-talk-channel-message-body.component";

@Component({
  selector: 'ng-talk-channel-message-ref',
  standalone: true,
  imports: [NgTalkChannelMessageBodyComponent],
  template: `
    <strong>{{ message.from.name }}</strong>
    <ng-talk-channel-message-body [message]="message"/>
  `,
  styles: `
      :host {
          display: block;
          text-align: start;
          background-color: rgba(0, 0, 0, .05);
          border-radius: 9px;
          padding: 7px 12px 10px 11px;
          border-inline-start: 5px solid #06cf9c;
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
  @Input() public message: ChatMessage;
}
