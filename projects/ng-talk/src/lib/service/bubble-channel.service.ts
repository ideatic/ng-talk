import {ApplicationRef, createComponent, EmbeddedViewRef, EnvironmentInjector, Injectable, signal} from '@angular/core';
import {ChatChannel} from '../models/chat-channel';
import {ChatAdapter} from '../models/chat-adapter';
import {ChatUser} from '../models/chat-user';
import {Overlay} from '@angular/cdk/overlay';
import {BubbleChannelRef} from "./bubble-channel-ref";
import {NgTalkSettings} from "../components/ng-talk-settings";
import {NgTalkBubbleChannelComponent} from "../components/bubble/ng-talk-bubble-channel.component";


@Injectable({
  providedIn: 'root'
})
export class BubbleChannelService {
  private static _activeInstances = signal<BubbleChannelRef[]>([]);

  constructor(private _appRef: ApplicationRef,
              private _injector: EnvironmentInjector,
              private _overlaySvc: Overlay) {
  }

  public get activeChannels(): ChatChannel[] {
    return BubbleChannelService._activeInstances().map(ref => ref.channel);
  }

  public hasInstance(channel: ChatChannel) {
    return BubbleChannelService._activeInstances().some(ref => ref.channel.id == channel.id);
  }

  public getInstance(channel: ChatChannel) {
    return BubbleChannelService._activeInstances().find(ref => ref.channel.id == channel.id);
  }

  public show(channel: ChatChannel, adapter: ChatAdapter, user: ChatUser, settings?: NgTalkSettings, initComponent?: (c: NgTalkBubbleChannelComponent) => void): BubbleChannelRef {
    const alreadyOpened = this.getInstance(channel);
    if (alreadyOpened) {
      alreadyOpened.componentRef.instance.open();
      return alreadyOpened;
    }

    // Create and configure component
    const componentRef = createComponent(NgTalkBubbleChannelComponent, {environmentInjector: this._injector});

    componentRef.setInput('channel', channel);
    componentRef.setInput('adapter', adapter);
    componentRef.setInput('user', user);
    if (settings) {
      componentRef.setInput('channelSettings', settings);
    }
    if (initComponent) {
      initComponent(componentRef.instance);
    }

    // Create a reference
    const bubbleRef = new BubbleChannelRef(channel, componentRef);
    BubbleChannelService._activeInstances.update(active => [...active, bubbleRef]);
    componentRef.setInput('selfRef', bubbleRef);

    bubbleRef.destroyed.subscribe(() => {
      this._appRef.detachView(componentRef.hostView);
      BubbleChannelService._activeInstances.update(active => active.filter(ref => ref.channel.id != channel.id));
    });

    // Attach component to the appRef so that it's inside the ng component tree
    this._appRef.attachView(componentRef.hostView);

    // Get DOM element from component
    const domElem = (componentRef.hostView as EmbeddedViewRef<any>)
      .rootNodes[0] as HTMLElement;

    // Append DOM element to the body
    bubbleRef.overlayRef = this._overlaySvc.create({
      hasBackdrop: false,
      disposeOnNavigation: false,
      scrollStrategy: this._overlaySvc.scrollStrategies.noop()
    });
    bubbleRef.overlayRef.overlayElement.appendChild(domElem);

    return bubbleRef;
  }

  public destroyAll() {
    BubbleChannelService._activeInstances().forEach(ref => ref.destroy());
  }
}

