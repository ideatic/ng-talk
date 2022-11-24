import {Component, Optional} from '@angular/core';
import {NgTalkChannelComponent} from '../ng-talk-channel.component';
import {ChatChannel} from '../../../models/chat-channel';
import {BubbleChannelService} from '../../../service/bubble-channel.service';
import {NgTalkChannelListComponent} from '../../ng-talk-channel-list/ng-talk-channel-list.component';
import {BubbleChannelRef} from "../../../service/bubble-channel-ref";

@Component({
  template: `
    <a *ngIf="channelList" class="go-back" (click)="channelList.selectChannel(null)"><i class="fas fa-arrow-left"></i></a>
    <img *ngIf="chat.channel.icon" [src]="chat.channel.icon">
    <span style="flex-grow: 1">{{ chat.channel.name }}</span>
    <a *ngIf="!bubbleChannelSvc.hasInstance(chat.channel)" class="tool" (click)="openBubbleChat(chat.channel)"><i class="fas fa-external-link-square-alt"></i></a>
    <a class="tool" (click)="toggleBlock()"><i class="fas" [ngClass]="chat.channel.blocked ? 'fa-unlock' : 'fa-ban'"></i></a>
    <a class="tool" (click)="deleteChannel()"><i class="fas fa-trash"></i></a>`,
  styleUrls: ['ng-talk-channel-header.component.less']
})
export class NgTalkChannelHeaderComponent {
  constructor(public chat: NgTalkChannelComponent,
              public bubbleChannelSvc: BubbleChannelService,
              @Optional() public channelList: NgTalkChannelListComponent) {

  }

  public openBubbleChat(channel: ChatChannel): BubbleChannelRef | void {
    if (channel && !this.bubbleChannelSvc.hasInstance(channel)) {
      const bubbleRef = this.bubbleChannelSvc.show(channel, this.chat.adapter, this.chat.user, this.chat.settings);

      return bubbleRef;
    }
  }

  public toggleBlock() {
    this.chat.adapter.toggleBlock(this.chat.channel)
      .then(() => this.chat.reloadMessages());
  }

  public deleteChannel() {
    this.chat.adapter.deleteChannel(this.chat.channel)
      .then(() => this.chat.deleted.emit());
  }
}
