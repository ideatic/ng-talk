import type { CdkDragEnd, CdkDragMove } from '@angular/cdk/drag-drop';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { NgComponentOutlet } from '@angular/common';
import type {
  AfterViewInit,
  OnChanges,
  OnInit,
  SimpleChanges
} from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
  viewChildren
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { Subscription } from 'rxjs';
import { InViewportDirective } from '../../directives/in-viewport.directive';
import type { ChatAdapter } from '../../models/chat-adapter';
import type { ChatChannel } from '../../models/chat-channel';
import type { ChatMessage } from '../../models/chat-message';
import { ChatMessageType } from '../../models/chat-message';
import type { ChatUser } from '../../models/chat-user';
import { FnPipe } from '../../pipes/fn.pipe';
import { RelativeDatePipe } from '../../pipes/relativeDate.pipe';
import { isSameDay } from '../../utils/utils';
import { NgTalkSettings } from '../ng-talk-settings';
import { NgTalkChannelMessageComponent } from './message/ng-talk-channel-message.component';
import { NgTalkSendMessageComponent } from './send/ng-talk-send-message.component';

declare const ngDevMode: boolean;

@Component({
  selector: 'ng-talk-channel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgComponentOutlet,
    FnPipe,
    NgTalkSendMessageComponent,
    RelativeDatePipe,
    InViewportDirective,
    NgTalkChannelMessageComponent,
    CdkDrag
  ],
  templateUrl: './ng-talk-channel.component.html',
  styleUrls: [
    './ng-talk-channel.component.less',
    './styles/loading-spinner.less'
  ]
})
export class NgTalkChannelComponent
  implements OnInit, OnChanges, AfterViewInit
{
  // Deps
  private _destroyRef = inject(DestroyRef);

  // Bindings
  public readonly user = input<ChatUser>();
  public readonly adapter = input<ChatAdapter>();
  public readonly channel = input<ChatChannel>();
  public readonly settings = input<NgTalkSettings>(new NgTalkSettings());
  public readonly disableRendering = input(false);

  public readonly messageSent = output<ChatMessage>();
  public readonly userClicked = output<ChatUser>();
  public readonly deleted = output<void>();

  // State
  private readonly _chatBox = viewChild('chatBox', {
    read: ElementRef<HTMLElement>
  });
  private readonly _sendMessageComponent = viewChild(
    NgTalkSendMessageComponent
  );
  private readonly _messageComponents = viewChildren(
    NgTalkChannelMessageComponent
  );

  private _visibleMessages = 20;
  public readonly messages = signal<ChatMessage[]>([]);

  private _messagesSubscription: Subscription;

  public replyingTo: ChatMessage;

  // UI
  protected readonly loading = signal(false);
  protected readonly scrollWatcherEnabled = signal(false);
  protected readonly viewportDetectionAvailable =
    InViewportDirective.intersectionObserverFeatureDetection();

  // Import types and enums
  protected readonly MessageType = ChatMessageType;

  public ngOnInit() {
    if (!this.user()) {
      throw new Error('Chat current user must be defined');
    }
  }

  public ngOnChanges(changes: SimpleChanges<NgTalkChannelComponent>) {
    const settings = this.settings();

    if (changes.adapter || changes.channel) {
      this.messages.set([]);

      this._messagesSubscription?.unsubscribe();

      this._visibleMessages = settings.pageSize;

      if (this.adapter() && this.channel()) {
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

    this._messagesSubscription = this.adapter()
      .getMessages(this.channel(), 0, this._visibleMessages)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((messages: ChatMessage[]) => {
        this.messages.set(messages);
        this.loading.set(false);

        if (scrollToBottom && !this.disableRendering()) {
          this.scrollToBottom();
        }

        // Mark as read if component is focused
        const channel = this.channel();
        if (channel?.unread() > 0 && document.hasFocus()) {
          this.adapter().markAsRead(channel);
        }
      });
  }

  protected isSeparatorVisible(
    message: ChatMessage,
    prevMessage: ChatMessage | null
  ): boolean {
    return !prevMessage || !isSameDay(prevMessage.date, message.date);
  }

  public trackMessage(i, message: ChatMessage) {
    return message.date.toString() + message.content;
  }

  public scrollToBottom() {
    setTimeout(() => {
      // Wait until new messages are drawn
      if (this._chatBox()) {
        this._chatBox().nativeElement.scrollTop =
          this._chatBox().nativeElement.scrollHeight;

        if (this.messages().length >= this._visibleMessages) {
          // Enable scroll watcher if there is more messages pending
          this.scrollWatcherEnabled.set(true);
        }
      }
    }, 10);
  }

  public focus() {
    this._sendMessageComponent()?.focus();
  }

  // Pagination & History

  public loadOldMessages() {
    this.scrollWatcherEnabled.set(false);
    this._visibleMessages += this.settings().pageSize;

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
    const wrapper = this._messageComponents()?.find(
      m =>
        m.message === message ||
        (m.message.id && message.id && m.message.id === message.id)
    );
    wrapper?.highlight();
  }

  public onDrag(event: CdkDragMove) {
    if (event.distance.x < 0) {
      // Solo permitir arrastrar hacia la derecha
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
