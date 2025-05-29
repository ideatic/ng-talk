import {
  createNoopScrollStrategy,
  createOverlayRef
} from '@angular/cdk/overlay';
import {
  ApplicationRef,
  createComponent,
  EmbeddedViewRef,
  EnvironmentInjector,
  inject,
  Injectable,
  inputBinding,
  signal
} from '@angular/core';
import { NgTalkBubbleChannelComponent } from '../components/bubble/ng-talk-bubble-channel.component';
import { NgTalkSettings } from '../components/ng-talk-settings';
import { ChatAdapter } from '../models/chat-adapter';
import { ChatChannel } from '../models/chat-channel';
import { ChatUser } from '../models/chat-user';
import { BubbleChannelRef } from './bubble-channel-ref';

export const nameof = <T>(name: keyof T) => name;

@Injectable({
  providedIn: 'root'
})
export class BubbleChannelService {
  private static readonly _activeInstances = signal<BubbleChannelRef[]>([]);

  // Deps
  private _appRef = inject(ApplicationRef);
  private _injector = inject(EnvironmentInjector);

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

    // Create and configure component
    const selfRef = signal<BubbleChannelRef>(null);
    const bindings = [
      inputBinding(
        nameof<NgTalkBubbleChannelComponent>('channel'),
        () => channel
      ),
      inputBinding(
        nameof<NgTalkBubbleChannelComponent>('adapter'),
        () => adapter
      ),
      inputBinding(nameof<NgTalkBubbleChannelComponent>('user'), () => user),
      inputBinding(nameof<NgTalkBubbleChannelComponent>('selfRef'), selfRef)
    ];
    if (settings) {
      bindings.push(
        inputBinding(
          nameof<NgTalkBubbleChannelComponent>('channelSettings'),
          () => settings
        )
      );
    }
    const componentRef = createComponent(NgTalkBubbleChannelComponent, {
      environmentInjector: this._injector,
      bindings: bindings
    });

    if (initComponent) {
      initComponent(componentRef.instance);
    }

    // Create a reference
    const bubbleRef = new BubbleChannelRef(channel, componentRef);
    BubbleChannelService._activeInstances.update(active => [
      ...active,
      bubbleRef
    ]);
    selfRef.set(bubbleRef);

    bubbleRef.destroyed.subscribe(() => {
      this._appRef.detachView(componentRef.hostView);
      BubbleChannelService._activeInstances.update(active =>
        active.filter(ref => ref.channel.id != channel.id)
      );
    });

    // Attach component to the appRef so that it's inside the ng component tree
    this._appRef.attachView(componentRef.hostView);

    // Get DOM element from component
    const domElem = (componentRef.hostView as EmbeddedViewRef<any>)
      .rootNodes[0] as HTMLElement;

    // Append DOM element to the body
    bubbleRef.overlayRef = createOverlayRef(this._injector, {
      hasBackdrop: false,
      disposeOnNavigation: false,
      scrollStrategy: createNoopScrollStrategy()
    });
    bubbleRef.overlayRef.overlayElement.appendChild(domElem);

    return bubbleRef;
  }

  public destroyAll() {
    BubbleChannelService._activeInstances().forEach(ref => ref.destroy());
  }
}
