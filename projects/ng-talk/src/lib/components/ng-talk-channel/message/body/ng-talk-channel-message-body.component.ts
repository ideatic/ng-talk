import {Component, Input} from '@angular/core';
import {ChatMessage, ChatMessageType} from '../../../../models/chat-message';
import type Autolinker from 'autolinker';
import {NgTalkChannelComponent} from '../../ng-talk-channel.component';
import {AutoLinkerService} from '../../../../service/autolinker.service';

@Component({
  selector: 'ng-talk-channel-message-body',
  template: `
    <ng-container [ngSwitch]="message.type">
      <!-- Text message -->
      <div class="text-message" *ngSwitchCase="MessageType.Text" [innerHTML]="message | fn:transformContent:this"></div>

      <img *ngSwitchCase="MessageType.Image" [src]="message.content" loading="lazy" style="margin-bottom: 5px" />

      <!-- Writing animation -->
      <ng-talk-channel-message-writing *ngSwitchCase="MessageType.Writing"></ng-talk-channel-message-writing>
    </ng-container>
  `,
  styleUrls: ['ng-talk-channel-message-body.component.less']
})
export class NgTalkChannelMessageBodyComponent {
  @Input() public message: ChatMessage;

  // Import types and enums
  public readonly MessageType = ChatMessageType;

  constructor(protected chat: NgTalkChannelComponent,
              private _autoLinker: AutoLinkerService) {
  }

  protected transformContent(message: ChatMessage): string {
    let content = message.content;
    if (this.chat.settings.autoLinks) {
      if (typeof this.chat.settings.autoLinks === 'object') {
        content = (this.chat.settings.autoLinks as Autolinker).link(content);
      } else {
        content = this._autoLinker.link(content);
      }
    }

    return content;
  }
}
