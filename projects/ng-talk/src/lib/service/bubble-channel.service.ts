import {ApplicationRef, createComponent, EmbeddedViewRef, EnvironmentInjector, Injectable} from '@angular/core';
import {ChatChannel} from '../models/chat-channel';
import {ChatAdapter} from '../models/chat-adapter';
import {ChatUser} from '../models/chat-user';
import {first} from 'rxjs/operators';
import {Overlay, OverlayConfig} from '@angular/cdk/overlay';
import {BubbleChannelRef} from "./bubble-channel-ref";
import {NgTalkSettings} from "../components/ng-talk-settings";
import {NgTalkBubbleChannelComponent} from "../components/bubble/ng-talk-bubble-channel.component";

@Injectable({
  providedIn: 'root'
})
export class BubbleChannelService {
  private static _activeInstances = new Map<string, BubbleChannelRef>();

  constructor(private _appRef: ApplicationRef,
              private _injector: EnvironmentInjector,
              private _overlaySvc: Overlay) {
  }

  public get activeChannelIDs(): string[] {
    return Array.from(BubbleChannelService._activeInstances.keys());
  }

  public hasInstance(channel: ChatChannel) {
    return BubbleChannelService._activeInstances.has(channel.id);
  }

  public getInstance(channel: ChatChannel) {
    return BubbleChannelService._activeInstances.get(channel.id);
  }

  public show(channel: ChatChannel, adapter: ChatAdapter, user: ChatUser, settings?: NgTalkSettings, initComponent?: (c: NgTalkBubbleChannelComponent) => void): BubbleChannelRef {
    if (BubbleChannelService._activeInstances.has(channel.id)) {
      BubbleChannelService._activeInstances.get(channel.id).componentRef.instance.open();
      return BubbleChannelService._activeInstances.get(channel.id);
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
    const bubbleRef = new BubbleChannelRef(this._appRef, componentRef);
    BubbleChannelService._activeInstances.set(channel.id, bubbleRef);
    componentRef.setInput('selfRef', bubbleRef);

    bubbleRef.onDestroyed.pipe(first()).subscribe(() => BubbleChannelService._activeInstances.delete(channel.id));

    // Attach component to the appRef so that it's inside the ng component tree
    this._appRef.attachView(componentRef.hostView);

    // Get DOM element from component
    const domElem = (componentRef.hostView as EmbeddedViewRef<any>)
      .rootNodes[0] as HTMLElement;

    // Append DOM element to the body
    const overlayConfig: OverlayConfig = {
      hasBackdrop: false,
      disposeOnNavigation: false,
      scrollStrategy: this._overlaySvc.scrollStrategies.noop()
    };

    bubbleRef.overlayRef = this._overlaySvc.create(overlayConfig);
    bubbleRef.overlayRef.overlayElement.appendChild(domElem);

    return bubbleRef;
  }

  public destroyAll() {
    BubbleChannelService._activeInstances.forEach(ref => ref.destroy());
  }
}

