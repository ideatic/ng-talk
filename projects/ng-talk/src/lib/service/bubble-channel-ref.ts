import {OverlayRef} from "@angular/cdk/overlay";
import {ApplicationRef, ComponentRef, EventEmitter} from "@angular/core";
import type {NgTalkBubbleChannelComponent} from "../components/bubble/ng-talk-bubble-channel.component";

export class BubbleChannelRef {
  public onDestroyed = new EventEmitter<BubbleChannelRef>();
  public overlayRef: OverlayRef;

  constructor(private _appRef: ApplicationRef,
              public componentRef: ComponentRef<NgTalkBubbleChannelComponent>) {

  }

  public destroy() {
    this._appRef.detachView(this.componentRef.hostView);
    this.componentRef.destroy();
    this.overlayRef.detach();
    this.overlayRef.dispose();

    this.onDestroyed.emit(this);
  }
}
