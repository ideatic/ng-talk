import {ChangeDetectionStrategy, Component, inject} from "@angular/core";
import {ChatChannel} from '../../../models/chat-channel';
import type {BubbleChannelRef} from "../../../service/bubble-channel-ref";
import {BubbleChannelService} from '../../../service/bubble-channel.service';
import {NgTalkChannelComponent} from '../ng-talk-channel.component';
import {NG_TALK_CHANNEL_LIST_TOKEN} from "../../../tokens";

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    <a class="tool" (click)="deleteChannel()"><i class="fas fa-trash"></i></a>
  `,
  styleUrl: 'ng-talk-channel-header.component.less'
})
export class NgTalkChannelHeaderComponent {
  // Deps
  protected readonly chat = inject(NgTalkChannelComponent);
  protected readonly bubbleChannelSvc = inject(BubbleChannelService);
  protected readonly channelList = inject(NG_TALK_CHANNEL_LIST_TOKEN, {optional: true});

  protected openBubbleChat(channel: ChatChannel): BubbleChannelRef | void {
    if (channel && !this.bubbleChannelSvc.hasInstance(channel)) {
      return this.bubbleChannelSvc.show(channel, this.chat.adapter, this.chat.user, this.chat.settings);
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
