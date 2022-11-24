import {ApplicationRef, ComponentRef, EventEmitter} from "@angular/core";
import {NgTalkBubbleChannelComponent} from "../components/ng-talk-bubble-channel/ng-talk-bubble-channel.component";

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
