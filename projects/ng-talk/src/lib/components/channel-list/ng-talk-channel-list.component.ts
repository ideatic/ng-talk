import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  forwardRef,
  HostBinding,
  HostListener,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  output,
  signal,
  SimpleChanges
} from "@angular/core";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {FormsModule} from "@angular/forms";
import {Subscription} from 'rxjs';
import {InViewportDirective} from "../../directives/in-viewport.directive";
import {ChatAdapter} from '../../models/chat-adapter';
import {ChatChannel} from '../../models/chat-channel';
import {ChatMessage} from '../../models/chat-message';
import {ChatUser} from '../../models/chat-user';
import {FnPipe} from "../../pipes/fn.pipe";
import {nameof} from '../../utils/utils';
import {NgTalkChannelComponent} from "../channel/ng-talk-channel.component";
import {NgTalkChannelPreviewComponent} from "../channel/preview/ng-talk-channel-preview.component";
import {MessageLoadingMethod, NgTalkSettings} from '../ng-talk-settings';
import {NG_TALK_CHANNEL_LIST_TOKEN} from "../../tokens";

@Component({
    selector: 'ng-talk-channel-list',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, NgTalkChannelComponent, NgTalkChannelPreviewComponent, FnPipe, InViewportDirective],
    templateUrl: './ng-talk-channel-list.component.html',
    styleUrl: './ng-talk-channel-list.component.less',
    providers: [
        { provide: NG_TALK_CHANNEL_LIST_TOKEN, useExisting: forwardRef(() => NgTalkChannelListComponent) },
    ]
})
export class NgTalkChannelListComponent implements OnInit, OnChanges, OnDestroy {
  // Deps
  private _host = inject(ElementRef<HTMLElement>);
  private _destroyRef = inject(DestroyRef);

  // Bindings
  @Input() public user: ChatUser;
  @Input() public adapter: ChatAdapter;
  @Input() public settings = new NgTalkSettings();
  public readonly search = output<string>();
  public readonly channelChanged = output<ChatChannel | null>();
  // Forwarded events from single channel
  public readonly messageSent = output<ChatMessage>();
  public readonly userClicked = output<ChatUser>();

  @HostBinding('class')
  public displayMode: 'desktop' | 'mobile';

  // State
  public activeChannel: ChatChannel;
  private _channelsSubscription: Subscription;
  protected channels = signal<ChatChannel[]>(null);

  private _channelMessagesSubscriptions = new Map<string, Subscription>();

  protected filterQuery: string;

  // Import types
  protected readonly MessagesLoading = MessageLoadingMethod;

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
        .pipe(takeUntilDestroyed(this._destroyRef))
        .subscribe(channels => {
          this.channels.set(channels);

          // Subscribe to new received channels
          if (this.settings.channelMessagesLoading == MessageLoadingMethod.allChannels) {
            channels
              .filter(channel => !this._channelMessagesSubscriptions.has(channel.id))
              .forEach(channel => this._channelMessagesSubscriptions.set(channel.id, this.adapter.getMessages(channel, 0, this.settings.pageSize).subscribe()));
          }

          // Select current channel (when a message to a new channel is sent, the new channel is selected automatically)
          if (this.activeChannel) {
            const activeChannel = channels.find(c => c.id == this.activeChannel.id);
            if (activeChannel) {
              if (activeChannel != this.activeChannel) {
                this.selectChannel(activeChannel);
              }
            } else {
              this.activeChannel = null;
            }
          } else if (this.settings.selectFirstChannelOnInit && channels.length > 0) {
            this.selectChannel(channels[0]);
          }
        });
    }
  }

  public selectChannel(channel: ChatChannel | null) {
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

  protected filterChannels(channels: ChatChannel[], query: string): ChatChannel[] {
    if (!query || !channels) {
      return channels;
    }
    return channels.filter(c => c.name.toLocaleLowerCase().indexOf(query) >= 0);
  }

  public ngOnDestroy() {
    this._channelMessagesSubscriptions.forEach(s => s.unsubscribe());
    this._channelMessagesSubscriptions.clear();
  }
}
