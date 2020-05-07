import {Component, ElementRef, EventEmitter, HostBinding, HostListener, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges} from '@angular/core';
import {ChatAdapter} from '../../models/chat-adapter';
import {ChatUser} from '../../models/chat-user';
import {ChannelMessagesLoading, NgTalkSettings} from '../ng-talk-settings';
import {ChatChannel, ChatChannelType} from '../../models/chat-channel';
import {Subscription} from 'rxjs';
import {nameof} from '../../utils/utils';
import {ChatMessage} from '../../models/chat-message';

@Component({
  selector: 'ng-talk-channels',
  templateUrl: './ng-talk-channels.component.html',
  styleUrls: [
    './ng-talk-channels.component.less'
  ]
})
export class NgTalkChannelsComponent implements OnInit, OnChanges, OnDestroy {

  @Input() public user: ChatUser;
  @Input() public adapter: ChatAdapter;
  @Input() public settings = new NgTalkSettings();
  @Output() public channelChanged: EventEmitter<ChatChannel> = new EventEmitter();

  // Forwarded events from single channel
  @Output() public messageSent: EventEmitter<ChatMessage> = new EventEmitter();
  @Output() public userClicked: EventEmitter<ChatUser> = new EventEmitter();

  @HostBinding('class')
  public displayMode: 'desktop' | 'mobile';

  public activeChannel: ChatChannel;
  private _channelsSubscription: Subscription;
  public channels: ChatChannel[];

  private _channelMessagesSubscriptions: { [key: string]: Subscription } = {};

  public filterQuery: string;

  // Import types
  public readonly ChannelType = ChatChannelType;
  public readonly MessagesLoading = ChannelMessagesLoading;

  constructor(private _host: ElementRef<HTMLElement>) {
  }

  public ngOnInit() {
    // Choose initial displayMode
    this.onResized();
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes[nameof<NgTalkChannelsComponent>('adapter')]) {
      Object.values(this._channelMessagesSubscriptions).forEach(s => s.unsubscribe());
      this._channelMessagesSubscriptions = {};
    }

    if (changes[nameof<NgTalkChannelsComponent>('adapter')] || changes[nameof<NgTalkChannelsComponent>('user')]) {
      if (this._channelsSubscription) {
        this._channelsSubscription.unsubscribe();
      }

      this._channelsSubscription = this.adapter.getChannels(this.user).subscribe(channels => {
        this.channels = channels;

        if (this.settings.channelMessagesLoading == ChannelMessagesLoading.all) {
          for (const channel of channels) {
            if (!this._channelMessagesSubscriptions[channel.id]) {
              this._channelMessagesSubscriptions[channel.id] = this.adapter.getMessages(channel, 0, this.settings.pageSize).subscribe();
            }
          }
        }

        // Select current channel (when a message to a new channel is sent, the new channel is selected automatically)
        if (this.activeChannel) {
          const activeChannel = this.channels.find(c => c.id == this.activeChannel.id);
          if (activeChannel && activeChannel != this.activeChannel) {
            this.selectChannel(activeChannel);
          }
        }
      });
    }
  }

  public trackChannel(i: number, channel: ChatChannel) {
    return channel.id;
  }

  public selectChannel(channel: ChatChannel) {
    this.activeChannel = channel;
    this.filterQuery = '';

    this.channelChanged.emit(channel);
  }

  @HostListener('window:resize')
  @HostListener('window:deviceorientation')
  @HostListener('window:scroll')
  public onResized() {
    this.displayMode = this._host.nativeElement.clientWidth < this.settings.mobileBreakpoint ? 'mobile' : 'desktop';
  }

  public ngOnDestroy() {
    if (this._channelsSubscription) {
      this._channelsSubscription.unsubscribe();
    }

    Object.values(this._channelMessagesSubscriptions).forEach(s => s.unsubscribe());
  }

  public inViewportChangedChannel(channel: ChatChannel, isVisible: boolean) {
    if (isVisible && this.settings.channelMessagesLoading == ChannelMessagesLoading.lazy) {
      this.adapter.getMessages(channel, 0, this.settings.pageSize);
    }
  }
}
