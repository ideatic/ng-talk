import {Component, Input} from '@angular/core';
import {ChatChannel, ChatChannelType} from '../../../models/chat-channel';
import {NgTalkChannelsComponent} from '../ng-talk-channels.component';
import {ChatMessageType} from '../../../models/chat-message';

@Component({
  selector: 'ng-talk-channel-preview',
  template: `
    <img *ngIf="channels.settings.showChannelsIcons" [src]="channel.icon || channels.settings.defaultChannelIcon"  [attr.aria-label]="channel.name">
    <div>
      <div class="channel-name">{{ channel.name }}</div>
      <div class="channel-status">
        <div class="last-message">
          <ng-container *ngIf="channel.lastMessage?.from && channel.type == ChannelType.Group">{{ channel.lastMessage.from.name }}:</ng-container>
          <ng-container *ngIf="channel.lastMessage?.type == MessageType.Image; else renderText">
            <svg viewBox="0 0 13 20" width="13" height="20" class=""><path fill="currentColor" d="M10.2 3H2.5C1.7 3 1 3.7 1 4.5v10.1c0 .7.7 1.4 1.5 1.4h7.7c.8 0 1.5-.7 1.5-1.5v-10C11.6 3.7 11 3 10.2 3zm-2.6 9.7H3.5v-1.3h4.1v1.3zM9.3 10H3.5V8.7h5.8V10zm0-2.7H3.5V6h5.8v1.3z"></path></svg>
          </ng-container>
          <ng-template #renderText>{{ channel.lastMessage?.content }}</ng-template>
        </div>

        <div *ngIf="channel.unread > 0 && !(channels.activeChannel && channel.id == channels.activeChannel.id)" class="unread-badge">
          {{ channel.unread }}
        </div>
      </div>
    </div>`,
  styleUrls: ['./ng-talk-channel-preview.component.less']
})
export class NgTalkChannelPreviewComponent {

  @Input() public channel: ChatChannel;

  // Import types
  protected readonly ChannelType = ChatChannelType;
  protected readonly MessageType = ChatMessageType;

  constructor(public channels: NgTalkChannelsComponent) {
  }
}
