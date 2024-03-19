import {Component, Input} from '@angular/core';
import type Autolinker from 'autolinker';
import {ChatMessage, ChatMessageType} from '../../../../models/chat-message';
import {FnPipe} from "../../../../pipes/fn.pipe";
import {AutoLinkerService} from '../../../../service/autolinker.service';
import {NgTalkChannelComponent} from '../../ng-talk-channel.component';
import {NgTalkChannelMessageWritingComponent} from "./ng-talk-channel-message-writing.component";

@Component({
  selector: 'ng-talk-channel-message-body',
  standalone: true,
  imports: [FnPipe, NgTalkChannelMessageWritingComponent],
  template: `
    @switch (message.type) {
      <!-- Text message -->
      @case (MessageType.Text) {
        <div class="text-message" [innerHTML]="message | fn:transformContent:this"></div>
      }
      @case (MessageType.Image) {
        <img loading="lazy" style="margin-bottom: 8px" [src]="message.content"/>
      }
      @case (MessageType.Gif) {
        <img loading="lazy" style="margin-bottom: 8px" [src]="message.content"/>
      }

      <!-- Writing animation -->
      @case (MessageType.Writing) {
        <ng-talk-channel-message-writing/>
      }
    }
  `,
  styleUrl: 'ng-talk-channel-message-body.component.less'
})
export class NgTalkChannelMessageBodyComponent {
  @Input() public message: ChatMessage;

  // Import types and enums
  protected readonly MessageType = ChatMessageType;

  constructor(private _chat: NgTalkChannelComponent,
              private _autoLinker: AutoLinkerService) {
  }

  protected transformContent(message: ChatMessage): string {
    let content = message.content;
    if (this._chat.settings.autoLinks) {
      if (typeof this._chat.settings.autoLinks === 'object') {
        content = (this._chat.settings.autoLinks as Autolinker).link(content);
      } else {
        content = this._autoLinker.link(content);
      }
    }

    return content;
  }
}
