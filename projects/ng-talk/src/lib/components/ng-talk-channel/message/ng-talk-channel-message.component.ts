import {Component, ElementRef, HostBinding, Input, OnChanges} from '@angular/core';
import {ChatMessage, ChatMessageType} from '../../../models/chat-message';
import {NgTalkChannelComponent} from '../ng-talk-channel.component';
import {isSameDay} from '../../../utils/utils';

@Component({
  selector: 'ng-talk-channel-message',
  template: `
    <div *ngIf="chat.settings.showAvatars && showAuthor" class="avatar">
      <img [src]="message.from.avatar || chat.settings.defaultAvatar" (click)="chat.userClicked.emit(message.from)"/>
    </div>
    <div class="speech-balloon">
      <!-- Actions menu -->
      <span *ngIf="message.type != MessageType.Writing && chat.settings.allowReplies" class="action-menu" role="button"
            #menuTrigger="matMenuTrigger" [matMenuTriggerFor]="toolsMenu" [class.opened]="menuTrigger.menuOpen">
            <svg viewBox="0 0 18 18" width="18" height="18" class=""><path fill="currentColor" d="M3.3 4.6 9 10.3l5.7-5.7 1.6 1.6L9 13.4 1.7 6.2l1.6-1.6z"></path></svg>
          </span>
      <mat-menu #toolsMenu>
        <ng-template matMenuContent>
          <button mat-menu-item (click)="chat.replyTo(message)">{{ chat.settings.replyBtn }}</button>
        </ng-template>
      </mat-menu>

      <!-- Replied message -->
      <ng-talk-channel-message-ref *ngIf="message.replyTo" [message]="message.replyTo" role="button" (click)="chat.goToMessage(message.replyTo)"></ng-talk-channel-message-ref>

      <!-- Author, body and date -->
      <div *ngIf="chat.settings.showNames && showAuthor" class="author" [ngStyle]="{color: message.from.color }"
           (click)="chat.userClicked.emit(message.from)">{{ message.from.name }}</div>

      <ng-talk-channel-message-body [message]="message"></ng-talk-channel-message-body>

      <div *ngIf="message.type != MessageType.Writing" class="date">{{ message.date | date:chat.settings.datePipe }}</div>

      <div *ngIf="highlighted" class="overlay"></div>
    </div>
  `,
  styleUrls: ['ng-talk-channel-message.component.less']
})
export class NgTalkChannelMessageComponent implements OnChanges {
  @Input() public message: ChatMessage;
  @Input() public prevMessage: ChatMessage;

  @HostBinding('class') private _className: string;
  protected showAuthor = true;
  protected highlighted = false;

  // Import types and enums
  public readonly MessageType = ChatMessageType;

  constructor(protected chat: NgTalkChannelComponent,
              private _host: ElementRef<HTMLElement>) {
  }

  public ngOnChanges() {
    this.showAuthor = !this.prevMessage || this.prevMessage.from.id != this.message.from.id || !isSameDay(this.prevMessage.date, this.message.date);

    this._className = this.chat.settings.messageClass
      + (this.message.from.id == this.chat.user.id ? ' sent' : 'received')
      + (this.chat.settings.showAvatars ? ' with-avatar' : '')
      + (!this.showAuthor && this.prevMessage ? ' narrow' : '');
  }

  public highlight() {
    this._host.nativeElement.scrollIntoView();
    this.highlighted = true;
    setTimeout(() => this.highlighted = false, 1000);
  }
}
