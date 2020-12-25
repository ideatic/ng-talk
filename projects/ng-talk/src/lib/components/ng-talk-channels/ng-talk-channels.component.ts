import {Component, ElementRef, EventEmitter, HostBinding, HostListener, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges} from '@angular/core';
import {ChatAdapter} from '../../models/chat-adapter';
import {ChatUser} from '../../models/chat-user';
import {MessageLoadingMethod, NgTalkSettings} from '../ng-talk-settings';
import {ChatChannel} from '../../models/chat-channel';
import {Subscription} from 'rxjs';
import {nameof} from '../../utils/utils';
import {ChatMessage} from '../../models/chat-message';

@Component({
  selector: 'ng-talk-channels',
  templateUrl: './ng-talk-channels.component.html',
  styleUrls: ['./ng-talk-channels.component.less']
})
export class NgTalkChannelsComponent implements OnInit, OnChanges, OnDestroy {

  @Input() public user: ChatUser;
  @Input() public adapter: ChatAdapter;
  @Input() public settings = new NgTalkSettings();
  @Output() public search = new EventEmitter<string>();
  @Output() public channelChanged = new EventEmitter<ChatChannel>();

  // Forwarded events from single channel
  @Output() public messageSent = new EventEmitter<ChatMessage>();
  @Output() public userClicked = new EventEmitter<ChatUser>();

  @HostBinding('class')
  public displayMode: 'desktop' | 'mobile';

  public activeChannel: ChatChannel;
  private _channelsSubscription: Subscription;
  public channels: ChatChannel[];

  private _channelMessagesSubscriptions = new Map<string, Subscription>();

  public filterQuery: string;

  // Import types
  public readonly MessagesLoading = MessageLoadingMethod;

  constructor(private _host: ElementRef<HTMLElement>) {
  }

  public ngOnInit() {
    // Choose initial displayMode
    this.onResized();
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes[nameof<NgTalkChannelsComponent>('adapter')]) {
      this._channelMessagesSubscriptions.forEach(s => s.unsubscribe());
      this._channelMessagesSubscriptions.clear();
    }

    if (changes[nameof<NgTalkChannelsComponent>('adapter')] || changes[nameof<NgTalkChannelsComponent>('user')]) {
      if (this._channelsSubscription) {
        this._channelsSubscription.unsubscribe();
      }

      this._channelsSubscription = this.adapter.getChannels(this.user).subscribe(channels => {
        this.channels = channels;

        if (this.settings.channelMessagesLoading == MessageLoadingMethod.allChannels) {
          channels
            .filter(channel => !this._channelMessagesSubscriptions.has(channel.id))
            .forEach(channel => this._channelMessagesSubscriptions.set(channel.id, this.adapter.getMessages(channel, 0, this.settings.pageSize).subscribe()));
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

    this._channelMessagesSubscriptions.forEach(s => s.unsubscribe());
    this._channelMessagesSubscriptions.clear();
  }

  public inViewportChangedChannel(channel: ChatChannel, isVisible: boolean) {
    if (isVisible && this.settings.channelMessagesLoading == MessageLoadingMethod.lazy) {
      this.adapter.getMessages(channel, 0, this.settings.pageSize);
    }
  }
}
