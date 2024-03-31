import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit, output,
  Output,
  QueryList,
  signal,
  SimpleChanges,
  ViewChild, viewChildren,
  ViewChildren
} from '@angular/core';
import {ChatAdapter} from '../../models/chat-adapter';
import {ChatChannel} from '../../models/chat-channel';
import {ChatMessage, ChatMessageType} from '../../models/chat-message';
import {ChatUser} from '../../models/chat-user';
import {Subscription} from 'rxjs';
import {NgTalkSettings} from '../ng-talk-settings';
import {isSameDay, nameof} from '../../utils/utils';
import {InViewportDirective} from '../../directives/in-viewport.directive';
import {CdkDrag, CdkDragEnd, CdkDragMove} from '@angular/cdk/drag-drop';
import {RelativeDatePipe} from "../../pipes/relativeDate.pipe";
import {NgComponentOutlet} from "@angular/common";
import {FnPipe} from "../../pipes/fn.pipe";
import {NgTalkChannelMessageComponent} from './message/ng-talk-channel-message.component';
import {NgTalkSendMessageComponent} from './send/ng-talk-send-message.component';
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

declare const ngDevMode: boolean;

@Component({
  selector: 'ng-talk-channel',
  standalone: true,
  imports: [NgComponentOutlet, FnPipe, NgTalkSendMessageComponent, RelativeDatePipe, InViewportDirective, NgTalkChannelMessageComponent, CdkDrag],
  templateUrl: './ng-talk-channel.component.html',
  styleUrls: [
    './ng-talk-channel.component.less',
    './styles/loading-spinner.less'
  ]
})
export class NgTalkChannelComponent implements OnInit, OnChanges, AfterViewInit {

  @Input() public user: ChatUser;
  @Input() public adapter: ChatAdapter;
  @Input() public channel: ChatChannel;
  @Input() public settings: NgTalkSettings;
  @Input() public disableRendering = false;

  public messageSent = output<ChatMessage>();
  public userClicked = output<ChatUser>();
  public deleted = output<void>();

  @ViewChild('chatBox') private _chatBox: ElementRef<HTMLElement>;
  @ViewChild(NgTalkSendMessageComponent) private _sendMessageComponent: NgTalkSendMessageComponent;
  private _messageComponents = viewChildren(NgTalkChannelMessageComponent);

  private _visibleMessages = 20;
  public messages = signal<ChatMessage[]>([]);

  private _messagesSubscription: Subscription;

  public replyingTo: ChatMessage;

  // UI
  public loading = signal(false);
  public scrollWatcherEnabled = signal(false);
  protected readonly viewportDetectionAvailable = InViewportDirective.intersectionObserverFeatureDetection();

  // Import types and enums
  protected readonly MessageType = ChatMessageType;

  constructor(private _destroyRef: DestroyRef) {
  }

  public ngOnInit() {
    if (!this.user) {
      throw new Error('Chat current user must be defined');
    }
  }

  public ngOnChanges(changes: SimpleChanges) {
    this.settings ??= new NgTalkSettings();

    if (changes[nameof<NgTalkChannelComponent>('adapter')] || changes[nameof<NgTalkChannelComponent>('channel')]) {
      this.messages.set([]);

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

    this.loading.set(true);

    this._messagesSubscription = this.adapter.getMessages(this.channel, 0, this._visibleMessages)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((messages: ChatMessage[]) => {
        this.messages.set(messages);
        this.loading.set(false);

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

  public trackMessage(i, message: ChatMessage) {
    return message.date.toString() + message.content;
  }

  public scrollToBottom() {
    setTimeout(() => {  // Wait until new messages are drawn
      if (this._chatBox) {
        this._chatBox.nativeElement.scrollTop = this._chatBox.nativeElement.scrollHeight;

        if (this.messages().length >= this._visibleMessages) { // Enable scroll watcher if there is more messages pending
          this.scrollWatcherEnabled.set(true);
        }
      }
    }, 10);
  }

  public focus() {
    this._sendMessageComponent?.focus();
  }

  // Pagination & History

  public loadOldMessages() {
    this.scrollWatcherEnabled.set(false);
    this._visibleMessages += this.settings.pageSize;

    this.reloadMessages(false);
  }

  public watcherInViewportChanged(isVisible: boolean) {
    if (isVisible) {
      this.loadOldMessages();
    }
  }

  public replyTo(message: ChatMessage) {
    this.replyingTo = message;
    this.focus();
  }

  public goToMessage(message: ChatMessage) {
    const wrapper = this._messageComponents()?.find(m => m.message === message || (m.message.id && message.id && m.message.id === message.id));
    wrapper?.highlight();
  }

  public onDrag(event: CdkDragMove) {
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
}
