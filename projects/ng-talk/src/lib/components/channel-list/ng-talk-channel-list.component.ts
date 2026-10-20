import type { OnInit } from '@angular/core';
import { Component, effect, ElementRef, forwardRef, inject, input, output, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
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
export class NgTalkChannelListComponent implements OnInit {
  // Deps
  private readonly _host = inject(ElementRef<HTMLElement>);

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

  protected readonly channels = signal<ChatChannel[]>(null);

  // Suscripciones de mensajes del adapter activo (se cierran solo al cambiar el adapter o al destruir)
  private _messageSubscriptions: Subscription | null = null;
  private readonly _subscribedChannelIds = new Set<string>();

  protected filterQuery: string;

  protected readonly MessagesLoading = MessageLoadingMethod;

  constructor() {
    // Las suscripciones a mensajes dependen solo del adapter, para no reiniciarlas cuando cambia el usuario
    effect(onCleanup => {
      const adapter = this.adapter();
      if (!adapter) {
        return;
      }

      const subscriptions = new Subscription();
      this._messageSubscriptions = subscriptions;
      this._subscribedChannelIds.clear();

      onCleanup(() => {
        subscriptions.unsubscribe();
        if (this._messageSubscriptions === subscriptions) {
          this._messageSubscriptions = null;
          this._subscribedChannelIds.clear();
        }
      });
    });

    // Suscribe a la lista de canales cuando cambia el adapter o el usuario
    effect(onCleanup => {
      const adapter = this.adapter();
      const user = this.user();

      if (!adapter || !user) {
        return;
      }

      const subscription = untracked(() => this._getChannelList(adapter, user));
      onCleanup(() => subscription.unsubscribe());
    });
  }

  private _getChannelList(adapter: ChatAdapter, user: ChatUser<any>): Subscription {
    return adapter.getChannels(user).subscribe(channels => {
      this.channels.set(channels);

      const settings = this.settings();

      // Subscribe to messages for new channels
      if (settings.channelMessagesLoading === MessageLoadingMethod.allChannels) {
        channels.forEach(channel => this._loadChannelMessages(adapter, channel));
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

  /**
   * Suscribe a los mensajes de un canal una sola vez por adapter; el adapter mantiene la caché
   */
  private _loadChannelMessages(adapter: ChatAdapter, channel: ChatChannel) {
    const subscriptions = this._messageSubscriptions;
    if (!subscriptions || adapter !== untracked(this.adapter) || this._subscribedChannelIds.has(channel.id)) {
      return;
    }
    this._subscribedChannelIds.add(channel.id);
    subscriptions.add(adapter.getMessages(channel, 0, this.settings().pageSize).subscribe());
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
      this._loadChannelMessages(this.adapter(), channel);
    }
  }

  protected filterChannels(channels: ChatChannel[], query: string): ChatChannel[] {
    if (!query || !channels) {
      return channels;
    }
    return channels.filter(c => c.name.toLocaleLowerCase().indexOf(query) >= 0);
  }
}
