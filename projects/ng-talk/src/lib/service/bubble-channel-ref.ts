import {OverlayRef} from "@angular/cdk/overlay";
import {ComponentRef} from "@angular/core";
import type {NgTalkBubbleChannelComponent} from "../components/bubble/ng-talk-bubble-channel.component";
import {Subject} from "rxjs";
import {ChatChannel} from "../models/chat-channel";

export class BubbleChannelRef {
  public destroyed = new Subject<BubbleChannelRef>();
  public overlayRef: OverlayRef;

  constructor(public channel: ChatChannel, public componentRef: ComponentRef<NgTalkBubbleChannelComponent>) {

  }

  public destroy() {
    this.componentRef.destroy();
    this.overlayRef.detach();
    this.overlayRef.dispose();

    this.destroyed.next(this);
    this.destroyed.complete();
  }
}
