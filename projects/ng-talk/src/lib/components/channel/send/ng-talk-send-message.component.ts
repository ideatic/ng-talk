import {ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, signal, viewChild} from "@angular/core";
import {FormsModule} from "@angular/forms";
import {ChatChannel} from '../../../models/chat-channel';
import {ChatMessage, ChatMessageType} from '../../../models/chat-message';
import {NG_TALK_CHANNEL_LIST_TOKEN} from "../../../tokens";
import {NgTalkChannelMessageRefComponent} from "../message/ref/ng-talk-channel-message-ref.component";
import {NgTalkChannelComponent} from '../ng-talk-channel.component';
import {NgTalkSendEmojiComponent} from "./emoji/ng-talk-send-emoji.component";
import {NgTalkSendGifComponent} from "./gif/ng-talk-send-gif.component";
import {growAnimation} from './grow-animation';

@Component({
  selector: 'ng-talk-send-message',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NgTalkSendEmojiComponent, NgTalkChannelMessageRefComponent, NgTalkSendGifComponent, NgTalkSendEmojiComponent],
  template: `
    @if (chat.channel()?.blocked) {
      <p style="margin: 1em 0; text-align: center">{{ chat.settings().disabledMessage }}</p>
    } @else {
      <!-- Selector de emojis -->
      @if (mediaSelector == 'emoji') {
        <ng-talk-send-emoji [@grow] (emojiSelected)="newMessage = newMessage + $event"/>
      } @else if (mediaSelector == 'gif') {
        <ng-talk-send-gif [@grow] (gifSelected)="sendPhoto($event)"/>
      }

      <!-- Reply to message -->
      @if (chat.replyingTo) {
        <div style="display: flex; align-items: center" [@grow]>
          <ng-talk-channel-message-ref [message]="chat.replyingTo"/>
          <span style="cursor: pointer; padding: 0 15px" role="button" (click)="chat.replyingTo = null">
          <svg fill="currentColor" viewBox="0 0 24 24" width="24" height="24">
            <path
              d="m19.1 17.2-5.3-5.3 5.3-5.3-1.8-1.8-5.3 5.4-5.3-5.3-1.8 1.7 5.3 5.3-5.3 5.3L6.7 19l5.3-5.3 5.3 5.3 1.8-1.8z"/>
          </svg>
        </span>
        </div>
      }

      <form (ngSubmit)="sendTextMessage()">
        <!-- Emoji -->
        <span role="button" class="emoji-btn" [style.color]="mediaSelector == 'emoji' ? '#008069' : null"
              (click)="mediaSelector = mediaSelector == 'emoji' ? null : 'emoji'">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor"
                  d="M9.153 11.603c.795 0 1.439-.879 1.439-1.962s-.644-1.962-1.439-1.962-1.439.879-1.439 1.962.644 1.962 1.439 1.962zm-3.204 1.362c-.026-.307-.131 5.218 6.063 5.551 6.066-.25 6.066-5.551 6.066-5.551-6.078 1.416-12.129 0-12.129 0zm11.363 1.108s-.669 1.959-5.051 1.959c-3.505 0-5.388-1.164-5.607-1.959 0 0 5.912 1.055 10.658 0zM11.804 1.011C5.609 1.011.978 6.033.978 12.228s4.826 10.761 11.021 10.761S23.02 18.423 23.02 12.228c.001-6.195-5.021-11.217-11.216-11.217zM12 21.354c-5.273 0-9.381-3.886-9.381-9.159s3.942-9.548 9.215-9.548 9.548 4.275 9.548 9.548c-.001 5.272-4.109 9.159-9.382 9.159zm3.108-9.751c.795 0 1.439-.879 1.439-1.962s-.644-1.962-1.439-1.962-1.439.879-1.439 1.962.644 1.962 1.439 1.962z"/>
          </svg>
        </span>

        <!-- Gif -->
        @if (chat.settings().giphyApiKey || chat.settings().tenorApiKey) {
          <span role="button" class="emoji-btn" [style.color]="mediaSelector == 'gif' ? '#008069' : null"
                (click)="mediaSelector = mediaSelector == 'gif' ? null : 'gif'">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor"
                  d="m13.177 12.013-.001-.125v-1.053c0-.464 0-.827-.002-1.178a.723.723 0 0 0-.557-.7.715.715 0 0 0-.826.4c-.05.115-.072.253-.073.403-.003 1.065-.003 1.917-.002 3.834v.653c0 .074.003.136.009.195a.72.72 0 0 0 .57.619c.477.091.878-.242.881-.734.002-.454.003-.817.002-1.633l-.001-.681zm-3.21-.536a35.751 35.751 0 0 0-1.651-.003c-.263.005-.498.215-.565.48a.622.622 0 0 0 .276.7.833.833 0 0 0 .372.104c.179.007.32.008.649.005l.137-.001v.102c-.001.28-.001.396.003.546.001.044-.006.055-.047.081-.242.15-.518.235-.857.275-.767.091-1.466-.311-1.745-1.006a2.083 2.083 0 0 1-.117-1.08 1.64 1.64 0 0 1 1.847-1.41c.319.044.616.169.917.376.196.135.401.184.615.131a.692.692 0 0 0 .541-.562c.063-.315-.057-.579-.331-.766-.789-.542-1.701-.694-2.684-.482-2.009.433-2.978 2.537-2.173 4.378.483 1.105 1.389 1.685 2.658 1.771.803.054 1.561-.143 2.279-.579.318-.193.498-.461.508-.803.014-.52.015-1.046.001-1.578-.009-.362-.29-.669-.633-.679zM18 4.25H6A4.75 4.75 0 0 0 1.25 9v6A4.75 4.75 0 0 0 6 19.75h12A4.75 4.75 0 0 0 22.75 15V9A4.75 4.75 0 0 0 18 4.25zM21.25 15A3.25 3.25 0 0 1 18 18.25H6A3.25 3.25 0 0 1 2.75 15V9A3.25 3.25 0 0 1 6 5.75h12A3.25 3.25 0 0 1 21.25 9v6zm-2.869-6.018H15.3c-.544 0-.837.294-.837.839V14.309c0 .293.124.525.368.669.496.292 1.076-.059 1.086-.651.005-.285.006-.532.004-1.013v-.045l-.001-.46v-.052h1.096l1.053-.001a.667.667 0 0 0 .655-.478c.09-.298-.012-.607-.271-.757a.985.985 0 0 0-.468-.122 82.064 82.064 0 0 0-1.436-.006h-.05l-.523.001h-.047v-1.051h1.267l1.22-.001c.458-.001.768-.353.702-.799-.053-.338-.35-.56-.737-.561z"/>
          </svg>
        </span>
        }

        <!-- Text -->
        <input #textInput class="input" name="newMessage" maxlength="1000" autocomplete="off"
               [placeholder]="chat.settings().writePlaceholder"
               [disabled]="!chat.channel() || chat.channel().disabled" [(ngModel)]="newMessage"
               (focus)="onInputFocus()"/>
        <span role="button" class="send-btn" [class.disabled]="!newMessage || !chat.channel() || chat.channel().disabled"
              [title]="chat.settings().sendBtnTitle"
              (click)="sendTextMessage()">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor"
                  d="M1.101 21.757 23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"/>
          </svg>
        </span>
      </form>
    }
  `,
  styleUrl: 'ng-talk-send-message.component.less',
  animations: [growAnimation]
})
export class NgTalkSendMessageComponent {
  protected readonly chat = inject(NgTalkChannelComponent);

  private readonly _textInput = viewChild('textInput', {read: ElementRef<HTMLInputElement>});

  protected newMessage = '';
  protected mediaSelector: string = null;

  constructor() {
    const channelList = inject(NG_TALK_CHANNEL_LIST_TOKEN, {optional: true});

    if (channelList) { // Detectar cambio de canal si estamos en un listado
      const subscription = channelList.channelChanged.subscribe((c) => this._onChannelChanged(c));
      inject(DestroyRef).onDestroy(() => subscription.unsubscribe());
    }

    this.chat.focus = () => this.focus();
  }

  private _sendMessage(message: Partial<ChatMessage>) {
    if (this.chat.channel() && !this.chat.channel().disabled) {
      const fullMessage = {
        replyTo: this.chat.replyingTo,
        from: signal(this.chat.user()),
        ...message
      } as ChatMessage;

      this.chat.adapter().sendMessage(this.chat.channel(), fullMessage)
        .then(() => this.chat.messageSent.emit(fullMessage));

      this.mediaSelector = null;
      this.chat.replyingTo = null;
    }
  }

  protected sendTextMessage() {
    if (this.newMessage?.trim().length > 0) {
      this._sendMessage({
        type: ChatMessageType.Text,
        content: this.newMessage
      });
      this.newMessage = '';
    }
  }

  public focus() {
    this._textInput()?.nativeElement.focus();
  }

  protected onInputFocus() {
    // Mark as read if component is focused
    if (this.chat.channel && this.chat.channel().unread() > 0 && document.hasFocus()) {
      this.chat.adapter().markAsRead(this.chat.channel());
    }
  }

  // eslint-disable-next-line
  private _onChannelChanged(c: ChatChannel) {
    this.focus();
  }

  protected sendPhoto(url: string) {
    this._sendMessage({
      type: ChatMessageType.Gif,
      content: url
    });
  }
}
