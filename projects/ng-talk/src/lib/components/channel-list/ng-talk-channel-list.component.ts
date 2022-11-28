import {Component, ElementRef, EventEmitter, forwardRef, HostBinding, HostListener, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges} from '@angular/core';
import {ChatAdapter} from '../../models/chat-adapter';
import {ChatUser} from '../../models/chat-user';
import {MessageLoadingMethod, NgTalkSettings} from '../ng-talk-settings';
import {ChatChannel} from '../../models/chat-channel';
import {Subscription} from 'rxjs';
import {nameof} from '../../utils/utils';
import {ChatMessage} from '../../models/chat-message';
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {NgTalkChannelComponent} from "../channel/ng-talk-channel.component";
import {NgTalkChannelPreviewComponent} from "../channel/preview/ng-talk-channel-preview.component";
import {FnPipe} from "../../pipes/fn.pipe";
import {InViewportDirective} from "../../directives/in-viewport.directive";
import {NG_TALK_CHANNEL_LIST_TOKEN} from "./ng-talk-channel-list-token";

@Component({
  selector: 'ng-talk-channel-list',
  standalone: true,
  imports: [CommonModule, FormsModule, NgTalkChannelComponent, NgTalkChannelPreviewComponent, FnPipe, InViewportDirective],
  templateUrl: './ng-talk-channel-list.component.html',
  styleUrls: ['./ng-talk-channel-list.component.less'],
  providers: [
    {provide: NG_TALK_CHANNEL_LIST_TOKEN, useExisting: forwardRef(() => NgTalkChannelListComponent)},
  ]
})
export class NgTalkChannelListComponent implements OnInit, OnChanges, OnDestroy {

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
  protected readonly MessagesLoading = MessageLoadingMethod;

  constructor(private _host: ElementRef<HTMLElement>) {
  }

  public ngOnInit() {
    // Choose initial displayMode
    this._onResized();
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes[nameof<NgTalkChannelListComponent>('adapter')]) {
      this._channelMessagesSubscriptions.forEach(s => s.unsubscribe());
      this._channelMessagesSubscriptions.clear();
    }

    if (changes[nameof<NgTalkChannelListComponent>('adapter')] || changes[nameof<NgTalkChannelListComponent>('user')]) {
      this._channelsSubscription?.unsubscribe();

      this._channelsSubscription = this.adapter.getChannels(this.user)
        .subscribe(channels => {
          this.channels = channels;

          // Subscribe to new received channels
          if (this.settings.channelMessagesLoading == MessageLoadingMethod.allChannels) {
            channels
              .filter(channel => !this._channelMessagesSubscriptions.has(channel.id))
              .forEach(channel => this._channelMessagesSubscriptions.set(channel.id, this.adapter.getMessages(channel, 0, this.settings.pageSize).subscribe()));
          }

          // Select current channel (when a message to a new channel is sent, the new channel is selected automatically)
          if (this.activeChannel) {
            const activeChannel = this.channels.find(c => c.id == this.activeChannel.id);
            if (activeChannel) {
              if (activeChannel != this.activeChannel) {
                this.selectChannel(activeChannel);
              }
            } else {
              this.activeChannel = null;
            }
          } else if (this.settings.selectFirstChannelOnInit && this.channels.length > 0) {
            this.selectChannel(this.channels[0]);
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
  private _onResized() {
    this.displayMode = this._host.nativeElement.clientWidth < this.settings.mobileBreakpoint ? 'mobile' : 'desktop';
  }

  protected inViewportChangedChannel(channel: ChatChannel, isVisible: boolean) {
    if (isVisible && this.settings.channelMessagesLoading == MessageLoadingMethod.lazy) {
      this.adapter.getMessages(channel, 0, this.settings.pageSize);
    }
  }

  public filterChannels(channels: ChatChannel[], query: string): ChatChannel[] {
    if (!query) {
      return channels;
    }
    return channels.filter(c => c.name.toLocaleLowerCase().indexOf(query) >= 0);
  }

  public ngOnDestroy() {
    this._channelsSubscription?.unsubscribe();

    this._channelMessagesSubscriptions.forEach(s => s.unsubscribe());
    this._channelMessagesSubscriptions.clear();
  }
}
