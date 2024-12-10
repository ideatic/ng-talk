import {ChangeDetectionStrategy, Component, ElementRef, HostBinding, inject, Input, OnChanges, OnDestroy, viewChild} from "@angular/core";
import {normalizePassiveListenerOptions} from '@angular/cdk/platform';
import {DatePipe} from "@angular/common";
import {MatMenu, MatMenuContent, MatMenuItem, MatMenuTrigger} from "@angular/material/menu";
import {fromEvent} from 'rxjs';
import {ChatMessage, ChatMessageType} from '../../../models/chat-message';
import {isSameDay} from '../../../utils/utils';
import {NgTalkChannelComponent} from '../ng-talk-channel.component';
import {NgTalkChannelMessageBodyComponent} from "./body/ng-talk-channel-message-body.component";
import {NgTalkChannelMessageRefComponent} from "./ref/ng-talk-channel-message-ref.component";

@Component({
    selector: 'ng-talk-channel-message',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [DatePipe, NgTalkChannelMessageRefComponent, NgTalkChannelMessageBodyComponent, MatMenuTrigger, MatMenu, MatMenuContent, MatMenuItem],
    template: `
    @if (chat.settings.showAvatars && showAuthor) {
      <div class="avatar">
        <img [src]="message.from().avatar ?? chat.settings.defaultAvatar" (click)="chat.userClicked.emit(message.from())"/>
      </div>
    }
    <div class="speech-balloon">
      <!-- Actions menu -->
      @if (message.type != MessageType.Writing && chat.settings.allowReplies) {
        <span #menuTrigger="matMenuTrigger" class="action-menu"
              role="button" [matMenuTriggerFor]="toolsMenu" [class.opened]="menuTrigger.menuOpen">
            <svg viewBox="0 0 18 18" width="18" height="18" class=""><path fill="currentColor" d="M3.3 4.6 9 10.3l5.7-5.7 1.6 1.6L9 13.4 1.7 6.2l1.6-1.6z"/></svg>
          </span>
        <mat-menu #toolsMenu>
          <ng-template matMenuContent>
            <button mat-menu-item (click)="chat.replyTo(message)">{{ chat.settings.replyBtn }}</button>
          </ng-template>
        </mat-menu>
      }

      <!-- Replied message -->
      @if (message.replyTo) {
        <ng-talk-channel-message-ref role="button" [message]="message.replyTo" (click)="chat.goToMessage(message.replyTo)"/>
      }

      <!-- Author, body and date -->
      @if (chat.settings.showNames && showAuthor) {
        <div class="author" [style.color]="message.from().color" (click)="chat.userClicked.emit(message.from())">{{ message.from().name }}</div>
      }

      <ng-talk-channel-message-body [message]="message"/>

      @if (message.type != MessageType.Writing) {
        <div class="date">{{ message.date | date:chat.settings.datePipe }}</div>
      }

      @if (highlighted) {
        <div class="overlay"></div>
      }
    </div>
  `,
    styleUrl: 'ng-talk-channel-message.component.less'
})
export class NgTalkChannelMessageComponent implements OnChanges, OnDestroy {
  // Deps
  protected readonly chat = inject(NgTalkChannelComponent);
  private readonly _host = inject(ElementRef<HTMLElement>);

  // Bindings
  @Input() public message: ChatMessage;
  @Input() public prevMessage: ChatMessage;

  // State
  private readonly _toolsMenu = viewChild(MatMenuTrigger);

  @HostBinding('class') private _className: string;
  protected showAuthor = true;
  protected highlighted = false;

  private _touchEventSubscription = fromEvent(this._host.nativeElement, 'touchstart', normalizePassiveListenerOptions({passive: true}) as any)
    .subscribe(() => this._onTouchStart());

  // Import types and enums
  protected readonly MessageType = ChatMessageType;

  public ngOnChanges() {
    this.showAuthor = !this.prevMessage || this.prevMessage.from().id != this.message.from().id || !isSameDay(this.prevMessage.date, this.message.date);

    this._className = this.chat.settings.messageClass
      + (this.message.from().id == this.chat.user.id ? ' sent' : 'received')
      + (this.chat.settings.showAvatars ? ' with-avatar' : '')
      + (this.showAuthor && this.prevMessage ? ' wide' : '');
  }

  public highlight() {
    this._host.nativeElement.scrollIntoView();
    this.highlighted = true;
    setTimeout(() => this.highlighted = false, 1000);
  }

  private _showTimeout: ReturnType<typeof setTimeout>;

  private _onTouchStart() {
    this._touchEventSubscription.add(
      fromEvent(this._host.nativeElement, 'touchend').subscribe(() => clearTimeout(this._showTimeout))
    );
    this._touchEventSubscription.add(
      fromEvent(this._host.nativeElement, 'touchmove').subscribe(() => clearTimeout(this._showTimeout))
    );

    this._showTimeout = setTimeout(() => this._toolsMenu()?.openMenu(), 1_000);
  }

  public ngOnDestroy() {
    this._touchEventSubscription?.unsubscribe();
  }
}
