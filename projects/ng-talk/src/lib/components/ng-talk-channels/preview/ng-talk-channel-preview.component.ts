import {Component, Input} from '@angular/core';
import {ChatChannel, ChatChannelType} from '../../../models/chat-channel';
import {NgTalkChannelsComponent} from '../ng-talk-channels.component';

@Component({
  selector: 'ng-talk-channel-preview',
  template: `
    <img *ngIf="channels.settings.showChannelsIcons" [src]="channel.icon || channels.settings.defaultChannelIcon"  [attr.aria-label]="channel.name">
    <div>
      <div class="channel-name">{{ channel.name }}</div>
      <div class="channel-status">
        <div class="last-message">
          <ng-container *ngIf="channel.lastMessage?.from && channel.type == ChannelType.Group">{{ channel.lastMessage.from.name }}:</ng-container>
          {{ channel.lastMessage?.content }}
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
  public readonly ChannelType = ChatChannelType;

  constructor(public channels: NgTalkChannelsComponent) {
  }
}
