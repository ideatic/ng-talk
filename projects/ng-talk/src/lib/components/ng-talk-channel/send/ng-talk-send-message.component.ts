import {Component, ElementRef, OnDestroy, Optional, ViewChild} from '@angular/core';
import {NgTalkChannelComponent} from '../ng-talk-channel.component';
import {ChatMessage, ChatMessageType} from '../../../models/chat-message';
import {Subscription} from 'rxjs';
import {NgTalkChannelsComponent} from '../../ng-talk-channels/ng-talk-channels.component';
import {ChatChannel} from '../../../models/chat-channel';
import {growAnimation} from './grow-animation';


@Component({
  selector: 'ng-talk-send-message',
  template: `
    <p *ngIf="chat.channel?.blocked; else sendMessageForm" style="margin: 1em 0; text-align: center">{{ chat.settings.disabledMessage }}</p>

    <ng-template #sendMessageForm>
      <!-- Selector de emojis -->
      <ng-talk-send-emoji *ngIf="showEmojiSelector" (emojiSelected)="newMessage = newMessage + $event" [@grow]></ng-talk-send-emoji>

      <!-- Reply to message -->
      <div *ngIf="chat.replyingTo" style="display: flex; align-items: center" [@grow]>
        <ng-talk-channel-message-ref [message]="chat.replyingTo"></ng-talk-channel-message-ref>
        <span style="cursor: pointer; padding: 0 15px" role="button" (click)="chat.replyingTo = null">
          <svg fill="currentColor" viewBox="0 0 24 24" width="24" height="24">
            <path d="m19.1 17.2-5.3-5.3 5.3-5.3-1.8-1.8-5.3 5.4-5.3-5.3-1.8 1.7 5.3 5.3-5.3 5.3L6.7 19l5.3-5.3 5.3 5.3 1.8-1.8z"></path>
          </svg>
        </span>
      </div>

      <form (ngSubmit)="sendMessage()">
        <span role="button" (click)="showEmojiSelector = !showEmojiSelector" class="emoji-btn" [style.color]="showEmojiSelector ? '#008069' : null">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor"
                  d="M9.153 11.603c.795 0 1.439-.879 1.439-1.962s-.644-1.962-1.439-1.962-1.439.879-1.439 1.962.644 1.962 1.439 1.962zm-3.204 1.362c-.026-.307-.131 5.218 6.063 5.551 6.066-.25 6.066-5.551 6.066-5.551-6.078 1.416-12.129 0-12.129 0zm11.363 1.108s-.669 1.959-5.051 1.959c-3.505 0-5.388-1.164-5.607-1.959 0 0 5.912 1.055 10.658 0zM11.804 1.011C5.609 1.011.978 6.033.978 12.228s4.826 10.761 11.021 10.761S23.02 18.423 23.02 12.228c.001-6.195-5.021-11.217-11.216-11.217zM12 21.354c-5.273 0-9.381-3.886-9.381-9.159s3.942-9.548 9.215-9.548 9.548 4.275 9.548 9.548c-.001 5.272-4.109 9.159-9.382 9.159zm3.108-9.751c.795 0 1.439-.879 1.439-1.962s-.644-1.962-1.439-1.962-1.439.879-1.439 1.962.644 1.962 1.439 1.962z"></path>
          </svg>
        </span>
        <input #textInput class="input" [(ngModel)]="newMessage" name="newMessage" maxlength="1000" autocomplete="off"
               [placeholder]="chat.settings.writePlaceholder" (focus)="onInputFocus()"
               [disabled]="!chat.channel || chat.channel.disabled"/>
        <span role="button" class="send-btn" [class.disabled]="!newMessage || !chat.channel || chat.channel.disabled" (click)="sendMessage()"
              [title]="chat.settings.sendBtnTitle">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M1.101 21.757 23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"></path>
          </svg>
        </span>
      </form>
    </ng-template>
  `,
  styleUrls: ['ng-talk-send-message.component.less'],
  animations: [growAnimation]
})
export class NgTalkSendMessageComponent implements OnDestroy {

  @ViewChild('textInput', {static: false}) private _textInput: ElementRef<HTMLElement>;

  protected newMessage = '';
  protected showEmojiSelector = false;

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
      this.showEmojiSelector = false;
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
    this._channelChangedSubscription?.unsubscribe();
  }
}
