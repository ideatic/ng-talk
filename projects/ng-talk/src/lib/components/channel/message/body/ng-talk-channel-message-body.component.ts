import {Component, Input} from '@angular/core';
import {ChatMessage, ChatMessageType} from '../../../../models/chat-message';
import type Autolinker from 'autolinker';
import {NgTalkChannelComponent} from '../../ng-talk-channel.component';
import {AutoLinkerService} from '../../../../service/autolinker.service';
import {NgSwitch, NgSwitchCase} from "@angular/common";
import {FnPipe} from "../../../../pipes/fn.pipe";
import {NgTalkChannelMessageWritingComponent} from "./ng-talk-channel-message-writing.component";

@Component({
  selector: 'ng-talk-channel-message-body',
  standalone: true,
  imports: [NgSwitch, NgSwitchCase, FnPipe, NgTalkChannelMessageWritingComponent],
  template: `
    <ng-container [ngSwitch]="message.type">
      <!-- Text message -->
      <div class="text-message" *ngSwitchCase="MessageType.Text" [innerHTML]="message | fn:transformContent:this"></div>

      <img *ngSwitchCase="MessageType.Image" [src]="message.content" loading="lazy" style="margin-bottom: 8px"/>
      <img *ngSwitchCase="MessageType.Gif" [src]="message.content" loading="lazy" style="margin-bottom: 8px"/>

      <!-- Writing animation -->
      <ng-talk-channel-message-writing *ngSwitchCase="MessageType.Writing"/>
    </ng-container>
  `,
  styleUrls: ['ng-talk-channel-message-body.component.less']
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
