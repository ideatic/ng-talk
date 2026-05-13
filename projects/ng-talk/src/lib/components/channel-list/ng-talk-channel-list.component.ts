import type { OnDestroy, OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, DestroyRef, effect, ElementRef, forwardRef, inject, input, output, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import type { Subscription } from 'rxjs';
import { InViewportDirective } from '../../directives/in-viewport.directive';
import type { ChatAdapter } from '../../models/chat-adapter';
import type { ChatChannel } from '../../models/chat-channel';
import type { ChatMessage } from '../../models/chat-message';
import type { ChatUser } from '../../models/chat-user';
import { FnPipe } from '../../pipes/fn.pipe';
import { NG_TALK_CHANNEL_LIST_TOKEN } from '../../tokens';
import { NgTalkChannelComponent } from '../channel/ng-talk-channel.component';
import { NgTalkChannelPreviewComponent } from '../channel/preview/ng-talk-channel-preview.component';
import { MessageLoadingMethod, NgTalkSettings } from '../ng-talk-settings';

@Component({
  selector: 'ng-talk-channel-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NgTalkChannelComponent, NgTalkChannelPreviewComponent, FnPipe, InViewportDirective],
  templateUrl: './ng-talk-channel-list.component.html',
  styleUrl: './ng-talk-channel-list.component.less',
  host: {
    '[class]': 'displayMode()',
    '(window:resize)': 'onResized()',
    '(window:deviceorientation)': 'onResized()',
    '(window:scroll)': 'onResized()'
  },
  providers: [
    {
      provide: NG_TALK_CHANNEL_LIST_TOKEN,
      useExisting: forwardRef(() => NgTalkChannelListComponent)
    }
  ]
})
export class NgTalkChannelListComponent implements OnInit, OnDestroy {
  // Deps
  private readonly _host = inject(ElementRef<HTMLElement>);
  private readonly _destroyRef = inject(DestroyRef);

  // Bindings
  public readonly user = input<ChatUser>();
  public readonly adapter = input<ChatAdapter>();
  public readonly settings = input(new NgTalkSettings());
  public readonly searched = output<string>();
  public readonly channelChanged = output<ChatChannel | null>();
  // Forwarded events from single channel
  public readonly messageSent = output<ChatMessage>();
  public readonly userClicked = output<ChatUser>();

  // State
  public readonly displayMode = signal<'desktop' | 'mobile'>('desktop');
  public readonly activeChannel = signal<ChatChannel | null>(null);

  private _channelsSubscription: Subscription;
  protected readonly channels = signal<ChatChannel[]>(null);

  private readonly _channelMessagesSubscriptions = new Map<string, Subscription>();

  protected filterQuery: string;

  protected readonly MessagesLoading = MessageLoadingMethod;

  constructor() {
    // Clean subscriptions on adapter change
    effect(() => {
      this.adapter();
      untracked(() => {
        this._channelMessagesSubscriptions.forEach(s => s.unsubscribe());
        this._channelMessagesSubscriptions.clear();
      });
    });

    // Subscribe to channel list when adapter or user changes
    effect(() => {
      const adapter = this.adapter();
      const user = this.user();

      untracked(() => this._channelsSubscription?.unsubscribe());

      if (adapter && user) {
        untracked(() => this._getChannelList(adapter, user));
      }
    });
  }

  private _getChannelList(adapter: ChatAdapter, user: ChatUser<any>) {
    this._channelsSubscription = adapter
      .getChannels(user)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(channels => {
        this.channels.set(channels);

        const settings = this.settings();

        // Subscribe to messages for new channels
        if (settings.channelMessagesLoading === MessageLoadingMethod.allChannels) {
          channels
            .filter(channel => !this._channelMessagesSubscriptions.has(channel.id))
            .forEach(channel => this._channelMessagesSubscriptions.set(channel.id, adapter.getMessages(channel, 0, settings.pageSize).subscribe()));
        }

        // Select active channel
        const currentActive = this.activeChannel();
        if (currentActive) {
          const activeChannel = channels.find(c => c.id === currentActive.id);
          if (activeChannel) {
            if (activeChannel !== currentActive) {
              this.selectChannel(activeChannel);
            }
          } else {
            this.activeChannel.set(null);
          }
        } else if (settings.selectFirstChannelOnInit && channels.length > 0) {
          this.selectChannel(channels[0]);
        }
      });
  }

  public ngOnInit() {
    // Calculate initial display mode
    this.onResized();
  }

  public selectChannel(channel: ChatChannel | null) {
    this.activeChannel.set(channel);
    this.filterQuery = '';
    this.channelChanged.emit(channel);
  }

  protected onResized() {
    this.displayMode.set(this._host.nativeElement.clientWidth < this.settings().mobileBreakpoint ? 'mobile' : 'desktop');
  }

  protected inViewportChangedChannel(channel: ChatChannel, isVisible: boolean) {
    if (isVisible && this.settings().channelMessagesLoading === MessageLoadingMethod.lazy) {
      this.adapter().getMessages(channel, 0, this.settings().pageSize);
    }
  }

  protected filterChannels(channels: ChatChannel[], query: string): ChatChannel[] {
    if (!query || !channels) {
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
