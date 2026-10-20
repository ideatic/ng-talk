import type { OnInit } from '@angular/core';
import { Component, effect, ElementRef, forwardRef, inject, input, output, resource, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
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

  protected readonly channelsResource = resource({
    params: () => {
      const adapter = this.adapter();
      const user = this.user();
      return adapter && user ? { adapter, user } : undefined;
    },
    stream: ({ params, abortSignal }) => params.adapter.getChannels({ user: params.user, abortSignal })
  });

  // Cargas de mensajes del adapter activo (se cancelan solo al cambiar el adapter o al destruir)
  private _messageLoads: AbortController | null = null;
  private readonly _loadedChannelIds = new Set<string>();

  protected filterQuery: string;

  protected readonly MessagesLoading = MessageLoadingMethod;

  constructor() {
    // Las cargas de mensajes dependen solo del adapter, para no reiniciarlas cuando cambia el usuario
    effect(onCleanup => {
      const adapter = this.adapter();
      if (!adapter) {
        return;
      }

      const loads = new AbortController();
      this._messageLoads = loads;
      this._loadedChannelIds.clear();

      onCleanup(() => {
        loads.abort();
        if (this._messageLoads === loads) {
          this._messageLoads = null;
          this._loadedChannelIds.clear();
        }
      });
    });

    // Al recibir la lista de canales, cargar sus mensajes (según los ajustes) y mantener el canal activo
    effect(() => {
      if (!this.channelsResource.hasValue()) {
        return;
      }

      const channels = this.channelsResource.value();
      untracked(() => {
        const settings = this.settings();

        // Subscribe to messages for new channels
        if (settings.channelMessagesLoading === MessageLoadingMethod.allChannels) {
          channels.forEach(channel => this._loadChannelMessages(channel));
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
    });
  }

  /**
   * Carga los mensajes de un canal una sola vez por adapter, para que rellene su último mensaje y los no leídos;
   * el adapter mantiene la caché y el resultado no se usa aquí
   */
  private _loadChannelMessages(channel: ChatChannel) {
    const loads = this._messageLoads;
    if (!loads || this._loadedChannelIds.has(channel.id)) {
      return;
    }
    this._loadedChannelIds.add(channel.id);
    this.adapter().getMessages({ channel, offset: 0, count: this.settings().pageSize, abortSignal: loads.signal });
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
      this._loadChannelMessages(channel);
    }
  }

  protected filterChannels(channels: ChatChannel[], query: string): ChatChannel[] {
    if (!query || !channels) {
      return channels;
    }
    return channels.filter(c => c.name.toLocaleLowerCase().indexOf(query) >= 0);
  }
}
