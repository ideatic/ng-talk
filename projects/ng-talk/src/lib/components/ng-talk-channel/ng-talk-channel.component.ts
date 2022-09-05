import {AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild} from '@angular/core';
import {ChatAdapter} from '../../models/chat-adapter';
import {ChatChannel} from '../../models/chat-channel';
import {ChatMessage, ChatMessageType} from '../../models/chat-message';
import {ChatUser} from '../../models/chat-user';
import {Subscription} from 'rxjs';
import {NgTalkSettings} from '../ng-talk-settings';
import {isSameDay, nameof} from '../../utils/utils';
import {InViewportDirective} from '../../directives/in-viewport.directive';

interface ExtendedChatMessage extends ChatMessage {
  isDaySeparator: boolean;
  showAuthor: boolean;
  className: string;
  highlighted: boolean;
  wrapper: ElementRef<HTMLElement>;
}

@Component({
  selector: 'ng-talk-channel',
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
  @ViewChild('textInput') private _textInput: ElementRef<HTMLElement>;

  private _visibleMessages = 20;
  public messages: ExtendedChatMessage[] = [];

  private _messagesSubscription: Subscription;

  public replyingTo: ChatMessage;

  // UI
  public loading = false;
  public scrollWatcherEnabled = false;
  public readonly viewportDetectionAvailable = InViewportDirective.intersectionObserverFeatureDetection();

  // Import types and enums
  public readonly MessageType = ChatMessageType;

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

  public ngOnDestroy() {
    this._messagesSubscription?.unsubscribe();
  }

  public reloadMessages(scrollToBottom = true) {
    this._messagesSubscription?.unsubscribe();

    this.loading = true;

    this._messagesSubscription = this.adapter.getMessages(this.channel, 0, this._visibleMessages)
      .subscribe((messages: ExtendedChatMessage[]) => {
        this.messages = messages;
        this.loading = false;

        // Preprocess messages
        let prevMessage: ExtendedChatMessage;
        for (const message of messages) {
          message.className = this.settings.messageClass + ' ' + (message.from.id == this.user.id ? 'sent' : 'received') + ' ' + (this.settings.showAvatars ? 'with-avatar' : '');

          if (!prevMessage || !isSameDay(prevMessage.date, message.date)) {
            message.isDaySeparator = true;
          }

          message.showAuthor = !prevMessage || prevMessage.from.id != message.from.id || message.isDaySeparator;

          if (!message.showAuthor && prevMessage) { //
            prevMessage.className += ' narrow';
          }

          prevMessage = message;
        }

        if (scrollToBottom && !this.disableRendering) {
          this.scrollToBottom();
        }

        // Mark as read if component is focused
        if (this.channel?.unread > 0 && document.hasFocus()) {
          this.adapter.markAsRead(this.channel);
        }
      });
  }

  public trackMessage(i, message: ExtendedChatMessage) {
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

  public onInputFocus() {
    this._textInput.nativeElement.scrollIntoView();
  }

  // Pagination & History

  public loadOldMessages() {
    this.scrollWatcherEnabled = false;
    this._visibleMessages += this.settings.pageSize;

    this.reloadMessages(false);
  }

  public watcherInViewportChanged(isVisible: boolean) {
    if (isVisible) {
      this.loadOldMessages();
    }
  }

  public replyTo(message: ExtendedChatMessage) {
    this.replyingTo = message;
  }

  public goToMessage(message: ExtendedChatMessage) {
    message.wrapper?.nativeElement.scrollIntoView();
    message.highlighted = true;
    setTimeout(() => message.highlighted = false, 1000);
  }
}
