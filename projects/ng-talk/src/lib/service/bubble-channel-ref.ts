import type { OverlayRef } from '@angular/cdk/overlay';
import type { ComponentRef } from '@angular/core';
import type { NgTalkBubbleChannelComponent } from '../components/bubble/ng-talk-bubble-channel.component';
import type { ChatChannel } from '../models/chat-channel';

export class BubbleChannelRef {
  public overlayRef: OverlayRef;

  private _destroyed = false;
  private readonly _destroyCallbacks: Array<(ref: BubbleChannelRef) => void> = [];

  constructor(
    public channel: ChatChannel,
    public componentRef: ComponentRef<NgTalkBubbleChannelComponent>
  ) {}

  /**
   * Registra un callback que se ejecuta una sola vez al destruir la referencia
   */
  public onDestroy(callback: (ref: BubbleChannelRef) => void) {
    if (this._destroyed) {
      callback(this);
    } else {
      this._destroyCallbacks.push(callback);
    }
  }

  public destroy() {
    if (this._destroyed) {
      return;
    }
    this._destroyed = true;

    this.componentRef.destroy();
    this.overlayRef.detach();
    this.overlayRef.dispose();

    this._destroyCallbacks.splice(0).forEach(callback => callback(this));
  }
}
