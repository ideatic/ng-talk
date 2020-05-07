import {Component, Optional} from '@angular/core';
import {NgTalkChannelComponent} from '../ng-talk-channel.component';
import {ChatChannel} from '../../../models/chat-channel';
import {BubbleChannelRef, BubbleChannelService} from '../../../service/bubble-channel.service';
import {NgTalkChannelsComponent} from '../../ng-talk-channels/ng-talk-channels.component';

@Component({
  template: `
    <a *ngIf="channelList" class="go-back" (click)="channelList.selectChannel(null)"><i class="fas fa-arrow-left"></i></a>
    <img *ngIf="chat.channel.icon" [src]="chat.channel.icon">
    <span style="flex-grow: 1">{{ chat.channel.name }}</span>
    <a *ngIf="!bubbleChannelSvc.hasInstance(chat.channel)" class="open-bubble" (click)="openBubbleChat(chat.channel)"><i
      class="fas fa-external-link-square-alt"></i></a>`,
  styleUrls: [
    './ng-talk-channel-header.component.less'

  ]
})
export class NgTalkChannelHeaderComponent {
  constructor(public chat: NgTalkChannelComponent,
              public bubbleChannelSvc: BubbleChannelService,
              @Optional() public channelList: NgTalkChannelsComponent
  ) {

  }

  public openBubbleChat(channel: ChatChannel): BubbleChannelRef | void {
    if (channel && !this.bubbleChannelSvc.hasInstance(channel)) {
      const bubbleRef = this.bubbleChannelSvc.show(channel, this.chat.adapter, this.chat.user, this.chat.settings);

      return bubbleRef;
    }
  }
}
