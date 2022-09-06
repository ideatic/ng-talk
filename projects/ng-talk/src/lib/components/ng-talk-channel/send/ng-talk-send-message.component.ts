import {Component, ElementRef, OnDestroy, Optional, ViewChild} from '@angular/core';
import {NgTalkChannelComponent} from '../ng-talk-channel.component';
import {ChatMessage, ChatMessageType} from '../../../models/chat-message';
import {Subscription} from 'rxjs';
import {NgTalkChannelsComponent} from '../../ng-talk-channels/ng-talk-channels.component';
import {ChatChannel} from '../../../models/chat-channel';
import {growAnimation} from './grow-animation';


@Component({
  template: `
    <p *ngIf="chat.channel?.blocked; else sendMessageForm" style="margin: 1em 0; text-align: center">{{ chat.settings.disabledMessage }}</p>
    <ng-template #sendMessageForm>
      <!-- Reply to message -->
      <div *ngIf="chat.replyingTo" style="display: flex; align-items: center" [@grow]>
        <ng-talk-channel-message-ref [message]="chat.replyingTo"></ng-talk-channel-message-ref>
        <span style="cursor: pointer; padding: 0 15px" role="button" (click)="chat.replyingTo = null">
          <svg fill="currentColor" viewBox="0 0 24 24" width="24" height="24" class="">
            <path d="m19.1 17.2-5.3-5.3 5.3-5.3-1.8-1.8-5.3 5.4-5.3-5.3-1.8 1.7 5.3 5.3-5.3 5.3L6.7 19l5.3-5.3 5.3 5.3 1.8-1.8z"></path>
          </svg>
          </span>
      </div>

      <form (ngSubmit)="sendMessage()">
        <input #textInput class="input" [(ngModel)]="newMessage" name="newMessage" maxlength="1000" autocomplete="off"
               [placeholder]="chat.settings.writePlaceholder" (focus)="onInputFocus()"
               [disabled]="!chat.channel || chat.channel.disabled"/>
        <i role="button" class="send-icon fas fa-paper-plane" (click)="sendMessage()"></i>
      </form>
    </ng-template>
  `,
  styleUrls: ['ng-talk-send-message.component.less'],
  animations: [growAnimation]
})
export class NgTalkSendMessageComponent implements OnDestroy {

  @ViewChild('textInput', {static: false}) private _textInput: ElementRef<HTMLElement>;
  public newMessage: string;

  private _channelChangedSubscription: Subscription;

  constructor(public chat: NgTalkChannelComponent,
              @Optional() channelList: NgTalkChannelsComponent) {
    if (channelList) { // Detectar cambio de canal si estamos en un listado
      this._channelChangedSubscription = channelList.channelChanged.subscribe((c) => this._onChannelChanged(c));
    }

    chat.focus = () => this.focus();
  }

  public sendMessage() {
    if (this.chat.channel && !this.chat.channel.disabled && this.newMessage?.trim().length > 0) {
      const message: ChatMessage = {
        type: ChatMessageType.Text,
        from: this.chat.user,
        content: this.newMessage,
        replyTo: this.chat.replyingTo
      };
      this.chat.adapter.sendMessage(this.chat.channel, message)
        .then(() => this.chat.messageSent.emit(message));

      this.newMessage = '';
      this.chat.replyingTo = null;
    }
  }

  public focus() {
    this._textInput?.nativeElement.focus();
  }

  public onInputFocus() {
    // Mark as read if component is focused
    if (this.chat.channel && this.chat.channel.unread > 0 && document.hasFocus()) {
      this.chat.adapter.markAsRead(this.chat.channel);
    }
  }

  private _onChannelChanged(c: ChatChannel) {
    this.focus();
  }

  public ngOnDestroy() {
    if (this._channelChangedSubscription) {
      this._channelChangedSubscription.unsubscribe();
    }
  }
}
