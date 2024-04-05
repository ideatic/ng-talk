import {ChangeDetectionStrategy, Component, Inject, Input} from '@angular/core';
import {ChatChannel, ChatChannelType} from '../../../models/chat-channel';
import {ChatMessageType} from '../../../models/chat-message';
import type {NgTalkChannelListComponent} from '../../channel-list/ng-talk-channel-list.component';
import {NG_TALK_CHANNEL_LIST_TOKEN} from "../../../tokens";
import {DecimalPipe} from "@angular/common";

@Component({
  selector: 'ng-talk-channel-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  template: `
    @if (channels.settings.showChannelsIcons) {
      <img [src]="channel.icon || channels.settings.defaultChannelIcon" [attr.aria-label]="channel.name">
    }
    <div>
      <div class="channel-name">{{ channel.name }}</div>
      <div class="channel-status">
        <div class="last-message">
          @if (channel.lastMessage()?.from() && channel.type == ChannelType.Group) {
            {{ channel.lastMessage().from().name }}:&ngsp;
          }

          @switch (channel.lastMessage()?.type) {
            @case (MessageType.Gif) {
              <svg viewBox="0 0 20 20" width="20" height="20">
                <path fill="currentColor"
                      d="M4.878 3.9h10.285c1.334 0 1.818.139 2.306.4s.871.644 1.131 1.131c.261.488.4.972.4 2.306v4.351c0 1.334-.139 1.818-.4 2.306a2.717 2.717 0 0 1-1.131 1.131c-.488.261-.972.4-2.306.4H4.878c-1.334 0-1.818-.139-2.306-.4s-.871-.644-1.131-1.131-.4-.972-.4-2.306V7.737c0-1.334.139-1.818.4-2.306s.643-.87 1.131-1.131.972-.4 2.306-.4zm6.193 5.936c-.001-.783.002-1.567-.003-2.35a.597.597 0 0 0-.458-.577.59.59 0 0 0-.683.328.907.907 0 0 0-.062.352c-.004 1.492-.003 2.984-.002 4.476 0 .06.002.121.008.181a.592.592 0 0 0 .468.508c.397.076.728-.196.731-.611.004-.768.001-1.537.001-2.307zm-3.733.687c0 .274-.005.521.002.768.003.093-.031.144-.106.19a2.168 2.168 0 0 1-.905.292c-.819.097-1.572-.333-1.872-1.081a2.213 2.213 0 0 1-.125-1.14 1.76 1.76 0 0 1 1.984-1.513c.359.05.674.194.968.396a.616.616 0 0 0 .513.112.569.569 0 0 0 .448-.464c.055-.273-.055-.484-.278-.637-.791-.545-1.677-.659-2.583-.464-2.006.432-2.816 2.512-2.08 4.196.481 1.101 1.379 1.613 2.546 1.693.793.054 1.523-.148 2.2-.56.265-.161.438-.385.447-.698.014-.522.014-1.045.001-1.568-.007-.297-.235-.549-.51-.557a37.36 37.36 0 0 0-1.64-.001c-.21.004-.394.181-.446.385a.494.494 0 0 0 .217.559.714.714 0 0 0 .313.088c.296.011.592.004.906.004zm6.477-2.519h.171c.811 0 1.623.002 2.434-.001.383-.001.632-.286.577-.654-.041-.274-.281-.455-.611-.455h-3.074c-.474 0-.711.237-.711.713v4.479c0 .243.096.436.306.56.41.241.887-.046.896-.545.009-.504.002-1.008.002-1.511v-.177h.169c.7 0 1.4.001 2.1-.001a.543.543 0 0 0 .535-.388c.071-.235-.001-.488-.213-.611a.87.87 0 0 0-.407-.105c-.667-.01-1.335-.005-2.003-.005h-.172V8.004z"/>
              </svg>
            }
            @case (MessageType.Image) {
              <svg viewBox="0 0 20 20" width="20" height="20">
                <path fill="currentColor"
                      d="M4.878 3.9h10.285c1.334 0 1.818.139 2.306.4s.871.644 1.131 1.131c.261.488.4.972.4 2.306v4.351c0 1.334-.139 1.818-.4 2.306a2.717 2.717 0 0 1-1.131 1.131c-.488.261-.972.4-2.306.4H4.878c-1.334 0-1.818-.139-2.306-.4s-.871-.644-1.131-1.131-.4-.972-.4-2.306V7.737c0-1.334.139-1.818.4-2.306s.643-.87 1.131-1.131.972-.4 2.306-.4zm6.193 5.936c-.001-.783.002-1.567-.003-2.35a.597.597 0 0 0-.458-.577.59.59 0 0 0-.683.328.907.907 0 0 0-.062.352c-.004 1.492-.003 2.984-.002 4.476 0 .06.002.121.008.181a.592.592 0 0 0 .468.508c.397.076.728-.196.731-.611.004-.768.001-1.537.001-2.307zm-3.733.687c0 .274-.005.521.002.768.003.093-.031.144-.106.19a2.168 2.168 0 0 1-.905.292c-.819.097-1.572-.333-1.872-1.081a2.213 2.213 0 0 1-.125-1.14 1.76 1.76 0 0 1 1.984-1.513c.359.05.674.194.968.396a.616.616 0 0 0 .513.112.569.569 0 0 0 .448-.464c.055-.273-.055-.484-.278-.637-.791-.545-1.677-.659-2.583-.464-2.006.432-2.816 2.512-2.08 4.196.481 1.101 1.379 1.613 2.546 1.693.793.054 1.523-.148 2.2-.56.265-.161.438-.385.447-.698.014-.522.014-1.045.001-1.568-.007-.297-.235-.549-.51-.557a37.36 37.36 0 0 0-1.64-.001c-.21.004-.394.181-.446.385a.494.494 0 0 0 .217.559.714.714 0 0 0 .313.088c.296.011.592.004.906.004zm6.477-2.519h.171c.811 0 1.623.002 2.434-.001.383-.001.632-.286.577-.654-.041-.274-.281-.455-.611-.455h-3.074c-.474 0-.711.237-.711.713v4.479c0 .243.096.436.306.56.41.241.887-.046.896-.545.009-.504.002-1.008.002-1.511v-.177h.169c.7 0 1.4.001 2.1-.001a.543.543 0 0 0 .535-.388c.071-.235-.001-.488-.213-.611a.87.87 0 0 0-.407-.105c-.667-.01-1.335-.005-2.003-.005h-.172V8.004z"/>
              </svg>
            }
            @default {
              {{ channel.lastMessage()?.content }}
            }
          }
        </div>

        @if (channel.unread() > 0 && !(channels.activeChannel && channel.id == channels.activeChannel.id)) {
          <div class="unread-badge">{{ channel.unread() | number }}</div>
        }
      </div>
    </div>`,
  styleUrl: './ng-talk-channel-preview.component.less'
})
export class NgTalkChannelPreviewComponent {
  @Input() public channel: ChatChannel;

  // Import types
  protected readonly ChannelType = ChatChannelType;
  protected readonly MessageType = ChatMessageType;

  constructor(@Inject(NG_TALK_CHANNEL_LIST_TOKEN) protected channels: NgTalkChannelListComponent) {
  }
}
