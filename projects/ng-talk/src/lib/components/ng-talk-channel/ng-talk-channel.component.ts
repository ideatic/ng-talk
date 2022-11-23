import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  SimpleChanges,
  ViewChild,
  ViewChildren
} from '@angular/core';
import {ChatAdapter} from '../../models/chat-adapter';
import {ChatChannel} from '../../models/chat-channel';
import {ChatMessage, ChatMessageType} from '../../models/chat-message';
import {ChatUser} from '../../models/chat-user';
import {Subscription} from 'rxjs';
import {isSameDay, nameof} from '../../utils/utils';
import {InViewportDirective} from '../../directives/in-viewport.directive';
import {CdkDragEnd, CdkDragMove, DragDropModule} from '@angular/cdk/drag-drop';
import {FormatDatePipe} from "../../pipes/formatDate.pipe";
import {NgIf} from "@angular/common";
import {FnPipe} from "../../pipes/fn.pipe";
import {NgTalkChannelMessageComponent} from './message/ng-talk-channel-message.component';
import {NgTalkSendMessageComponent} from "./send/ng-talk-send-message.component";
import {NgTalkSettings} from "../ng-talk-settings";

declare const ngDevMode: boolean;

@Component({
  selector: 'ng-talk-channel',
  standalone: true,
  imports: [NgIf, FnPipe, DragDropModule, NgTalkChannelMessageComponent, NgTalkSendMessageComponent, FormatDatePipe, InViewportDirective],
  templateUrl: './ng-talk-channel.component.html',
  styleUrls: [
    './ng-talk-channel.component.less',
    './styles/loading-spinner.less'
  ]
})
export class NgTalkChannelComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {

  @Input() public user: ChatUser;
  @Input() public adapter: ChatAdapter;
  @Input() public channel: ChatChannel;
  @Input() public settings: NgTalkSettings;
  @Input() public disableRendering = false;

  @Output() public messageSent = new EventEmitter<ChatMessage>();
  @Output() public userClicked = new EventEmitter<ChatUser>();
  @Output() public deleted = new EventEmitter<void>();

  @ViewChild('chatBox') private _chatBox: ElementRef<HTMLElement>;
  @ViewChild(NgTalkSendMessageComponent) private _sendMessageComponent: NgTalkSendMessageComponent;
  @ViewChildren(NgTalkChannelMessageComponent) private _messageComponents: QueryList<NgTalkChannelMessageComponent>;

  private _visibleMessages = 20;
  protected messages: ChatMessage[] = [];

  private _messagesSubscription: Subscription;

  public replyingTo: ChatMessage;

  // UI
  protected loading = false;
  protected scrollWatcherEnabled = false;
  protected readonly viewportDetectionAvailable = InViewportDirective.intersectionObserverFeatureDetection();

  // Import types and enums
  protected readonly MessageType = ChatMessageType;

  public ngOnInit() {
    if (!this.user) {
      throw new Error('Chat current user must be defined');
    }
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (!this.settings) {
      this.settings = new NgTalkSettings();
    }

    if (changes[nameof<NgTalkChannelComponent>('adapter')] || changes[nameof<NgTalkChannelComponent>('channel')]) {
      this.messages = [];

      this._messagesSubscription?.unsubscribe();

      this._visibleMessages = this.settings.pageSize;

      if (this.adapter && this.channel) {
        this.reloadMessages();
      }
    }
  }

  public ngAfterViewInit() {
    this.scrollToBottom();
  }

  public reloadMessages(scrollToBottom = true) {
    this._messagesSubscription?.unsubscribe();

    this.loading = true;

    this._messagesSubscription = this.adapter.getMessages(this.channel, 0, this._visibleMessages)
      .subscribe((messages: ChatMessage[]) => {
        this.messages = messages;
        this.loading = false;

        if (scrollToBottom && !this.disableRendering) {
          this.scrollToBottom();
        }

        // Mark as read if component is focused
        if (this.channel?.unread > 0 && document.hasFocus()) {
          this.adapter.markAsRead(this.channel);
        }
      });
  }

  protected isSeparatorVisible(message: ChatMessage, prevMessage: ChatMessage | null): boolean {
    return !prevMessage || !isSameDay(prevMessage.date, message.date);
  }

  protected trackMessage(i, message: ChatMessage) {
    return message.date.toString() + message.content;
  }

  public scrollToBottom() {
    setTimeout(() => {  // Wait until new messages are drawn
      if (this._chatBox) {
        this._chatBox.nativeElement.scrollTop = this._chatBox.nativeElement.scrollHeight;

        if (this.messages.length >= this._visibleMessages) { // Enable scroll watcher if there is more messages pending
          this.scrollWatcherEnabled = true;
        }
      }
    }, 10);
  }

  public focus() {
    this._sendMessageComponent?.focus();
  }

  // Pagination & History

  protected loadOldMessages() {
    this.scrollWatcherEnabled = false;
    this._visibleMessages += this.settings.pageSize;

    this.reloadMessages(false);
  }

  protected watcherInViewportChanged(isVisible: boolean) {
    if (isVisible) {
      this.loadOldMessages();
    }
  }

  public replyTo(message: ChatMessage) {
    this.replyingTo = message;
    this.focus();
  }

  public goToMessage(message: ChatMessage) {
    const wrapper = this._messageComponents?.find(m => m.message === message || (m.message.id && message.id && m.message.id === message.id));
    wrapper?.highlight();
  }

  protected onDrag(event: CdkDragMove) {
    if (event.distance.x < 0) { // Solo permitir arrastrar hacia la derecha
      event.source.reset();
    }
  }

  protected onDragEnded(event: CdkDragEnd, message: ChatMessage) {
    event.source.reset();

    if (ngDevMode) {
      console.log('Drag ended', event.distance);
    }

    if (event.distance.x > 50) {
      this.replyTo(message);
    }
  }

  public ngOnDestroy() {
    this._messagesSubscription?.unsubscribe();
  }
}
