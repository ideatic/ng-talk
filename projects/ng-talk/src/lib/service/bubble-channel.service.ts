import {
  createNoopScrollStrategy,
  createOverlayRef
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { inject, Injectable, Injector, signal } from '@angular/core';
import type { BubbleChannelConfig } from '../components/bubble/ng-talk-bubble-channel.component';
import {
  BUBBLE_CHANNEL_CONFIG,
  NgTalkBubbleChannelComponent
} from '../components/bubble/ng-talk-bubble-channel.component';
import type { NgTalkSettings } from '../components/ng-talk-settings';
import type { ChatAdapter } from '../models/chat-adapter';
import type { ChatChannel } from '../models/chat-channel';
import type { ChatUser } from '../models/chat-user';
import { BubbleChannelRef } from './bubble-channel-ref';

@Injectable({
  providedIn: 'root'
})
export class BubbleChannelService {
  private static readonly _activeInstances = signal<BubbleChannelRef[]>([]);

  // Deps
  private _injector = inject(Injector);

  public get activeChannels(): ChatChannel[] {
    return BubbleChannelService._activeInstances().map(ref => ref.channel);
  }

  public hasInstance(channel: ChatChannel) {
    return BubbleChannelService._activeInstances().some(
      ref => ref.channel.id == channel.id
    );
  }

  public getInstance(channel: ChatChannel) {
    return BubbleChannelService._activeInstances().find(
      ref => ref.channel.id == channel.id
    );
  }

  public show(
    channel: ChatChannel,
    adapter: ChatAdapter,
    user: ChatUser,
    settings?: NgTalkSettings,
    initComponent?: (c: NgTalkBubbleChannelComponent) => void
  ): BubbleChannelRef {
    const alreadyOpened = this.getInstance(channel);
    if (alreadyOpened) {
      alreadyOpened.componentRef.instance.open();
      return alreadyOpened;
    }

    // Crear referencia para inyectar en el componente
    const selfRef = signal<BubbleChannelRef>(null);

    // Crear overlay primero
    const overlayRef = createOverlayRef(this._injector, {
      hasBackdrop: false,
      disposeOnNavigation: false,
      scrollStrategy: createNoopScrollStrategy()
    });

    // Crear injector personalizado con los datos del componente
    const portalInjector = Injector.create({
      providers: [
        {
          provide: BUBBLE_CHANNEL_CONFIG,
          useValue: {
            channel,
            adapter,
            user,
            settings,
            selfRef
          } as BubbleChannelConfig
        }
      ],
      parent: this._injector
    });

    // Crear y adjuntar el componente usando ComponentPortal
    const portal = new ComponentPortal(
      NgTalkBubbleChannelComponent,
      null,
      portalInjector
    );
    const componentRef = overlayRef.attach(portal);

    if (initComponent) {
      initComponent(componentRef.instance);
    }

    // Create the BubbleChannelRef
    const bubbleRef = new BubbleChannelRef(channel, componentRef);
    bubbleRef.overlayRef = overlayRef;
    BubbleChannelService._activeInstances.update(active => [
      ...active,
      bubbleRef
    ]);
    selfRef.set(bubbleRef);

    bubbleRef.destroyed.subscribe(() => {
      BubbleChannelService._activeInstances.update(active =>
        active.filter(ref => ref.channel.id != channel.id)
      );
    });

    return bubbleRef;
  }

  public destroyAll() {
    BubbleChannelService._activeInstances().forEach(ref => ref.destroy());
  }
}
