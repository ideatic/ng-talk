import {Component, Optional} from '@angular/core';
import {ChatChannel} from '../../../models/chat-channel';
import {BubbleChannelRef} from "../../../service/bubble-channel-ref";
import {BubbleChannelService} from '../../../service/bubble-channel.service';
import {NgTalkChannelListComponent} from '../../channel-list/ng-talk-channel-list.component';
import {NgTalkChannelComponent} from '../ng-talk-channel.component';

@Component({
  standalone: true,
  template: `
      @if (channelList) {
          <a class="go-back" (click)="channelList.selectChannel(null)"><i class="fas fa-arrow-left"></i></a>
      }
      @if (chat.channel.icon) {
          <img [src]="chat.channel.icon">
      }
      <span style="flex-grow: 1">{{ chat.channel.name }}</span>
      @if (!bubbleChannelSvc.hasInstance(chat.channel)) {
          <a class="tool" (click)="openBubbleChat(chat.channel)"><i class="fas fa-external-link-square-alt"></i></a>
      }
      <a class="tool" (click)="toggleBlock()"><i class="fas" [class]="chat.channel.blocked ? 'fa-unlock' : 'fa-ban'"></i></a>
      <a class="tool" (click)="deleteChannel()"><i class="fas fa-trash"></i></a>`,
  styleUrl: 'ng-talk-channel-header.component.less'
})
export class NgTalkChannelHeaderComponent {
  constructor(protected chat: NgTalkChannelComponent,
              protected bubbleChannelSvc: BubbleChannelService,
              @Optional() public channelList: NgTalkChannelListComponent) {

  }

  protected openBubbleChat(channel: ChatChannel): BubbleChannelRef | void {
    if (channel && !this.bubbleChannelSvc.hasInstance(channel)) {
      const bubbleRef = this.bubbleChannelSvc.show(channel, this.chat.adapter, this.chat.user, this.chat.settings);

      return bubbleRef;
    }
  }

  protected toggleBlock() {
    this.chat.adapter.toggleBlock(this.chat.channel)
      .then(() => this.chat.reloadMessages());
  }

  protected deleteChannel() {
    this.chat.adapter.deleteChannel(this.chat.channel)
      .then(() => this.chat.deleted.emit());
  }
}
