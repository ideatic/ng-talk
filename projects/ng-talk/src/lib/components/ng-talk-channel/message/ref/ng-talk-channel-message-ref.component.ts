import {Component, Input} from '@angular/core';
import {ChatMessage} from '../../../../models/chat-message';

@Component({
  selector: 'ng-talk-channel-message-ref',
  template: `
    <strong>{{ message.from.name }}</strong>

  `,
  styles: [`
  `]
})
export class NgTalkChannelMessageRefComponent {
  @Input() public message: ChatMessage;
}
