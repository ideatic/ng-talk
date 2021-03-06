import {ApplicationRef, ComponentFactoryResolver, ComponentRef, EmbeddedViewRef, EventEmitter, Injectable, Injector} from '@angular/core';
import {ChatChannel} from '../models/chat-channel';
import {NgTalkBubbleChannelComponent} from '../components/ng-talk-bubble-channel/ng-talk-bubble-channel.component';
import {ChatAdapter} from '../models/chat-adapter';
import {ChatUser} from '../models/chat-user';
import {NgTalkSettings} from '../components/ng-talk-settings';
import {first} from 'rxjs/operators';

@Injectable()
export class BubbleChannelService {
  private static _activeInstances = new Map<string, BubbleChannelRef>();

  constructor(private _componentFactoryResolver: ComponentFactoryResolver,
              private _appRef: ApplicationRef,
              private _injector: Injector) {
  }

  public get activeChannelIDs(): string[] {
    return Array.from(BubbleChannelService._activeInstances.keys());
  }

  public hasInstance(channel: ChatChannel) {
    return BubbleChannelService._activeInstances.has(channel.id);
  }

  public show(channel: ChatChannel, adapter: ChatAdapter, user: ChatUser, settings?: NgTalkSettings, initComponent?: (c: NgTalkBubbleChannelComponent) => void): BubbleChannelRef {
    if (BubbleChannelService._activeInstances.has(channel.id)) {
      BubbleChannelService._activeInstances.get(channel.id).componentRef.instance.open();
      return BubbleChannelService._activeInstances.get(channel.id);
    }

    // 1. Create a component reference from the component type
    const componentRef = this._componentFactoryResolver
      .resolveComponentFactory(NgTalkBubbleChannelComponent)
      .create(this._injector);

    const componentInstance = componentRef.instance as NgTalkBubbleChannelComponent;
    componentInstance.channel = channel;
    componentInstance.adapter = adapter;
    componentInstance.user = user;
    if (settings) {
      componentInstance.channelSettings = settings;
    }

    if (initComponent) {
      initComponent(componentInstance);
    }

    const bubbleRef = new BubbleChannelRef(this._appRef, componentRef);
    BubbleChannelService._activeInstances.set(channel.id, bubbleRef);
    componentInstance.selfRef = bubbleRef;

    bubbleRef.onDestroyed.pipe(first()).subscribe(() => BubbleChannelService._activeInstances.delete(channel.id));

    // 2. Attach component to the appRef so that it's inside the ng component tree
    this._appRef.attachView(componentRef.hostView);

    // 3. Get DOM element from component
    const domElem = (componentRef.hostView as EmbeddedViewRef<any>)
      .rootNodes[0] as HTMLElement;

    // 4. Append DOM element to the body
    document.body.appendChild(domElem);

    return bubbleRef;
  }

  public destroyAll() {
    BubbleChannelService._activeInstances.forEach(ref => ref.destroy());
  }
}

export class BubbleChannelRef {
  public onDestroyed = new EventEmitter<BubbleChannelRef>();

  constructor(private _appRef: ApplicationRef,
              public componentRef: ComponentRef<NgTalkBubbleChannelComponent>) {

  }

  public destroy() {
    this._appRef.detachView(this.componentRef.hostView);
    this.componentRef.destroy();

    this.onDestroyed.emit(this);
  }
}
