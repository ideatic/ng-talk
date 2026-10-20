import type { CdkDragEnd, CdkDragMove } from '@angular/cdk/drag-drop';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { NgComponentOutlet } from '@angular/common';
import type { AfterViewInit, OnInit } from '@angular/core';
import { Component, ElementRef, effect, input, linkedSignal, output, signal, untracked, viewChild, viewChildren } from '@angular/core';
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

@Component({
  selector: 'ng-talk-channel',
  imports: [NgComponentOutlet, FnPipe, NgTalkSendMessageComponent, RelativeDatePipe, InViewportDirective, NgTalkChannelMessageComponent, CdkDrag],
  templateUrl: './ng-talk-channel.component.html',
  styleUrls: ['./ng-talk-channel.component.less', './styles/loading-spinner.less']
})
export class NgTalkChannelComponent implements OnInit, AfterViewInit {
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
  private readonly _sendMessageComponent = viewChild(NgTalkSendMessageComponent);
  private readonly _messageComponents = viewChildren(NgTalkChannelMessageComponent);

  private _visibleMessages = 20;
  public readonly messages = signal<ChatMessage[]>([]);
  public readonly replyingTo = signal<ChatMessage | null>(null);

  // Cada valor nuevo fuerza recargar los mensajes; vuelve a `reset` al cambiar de canal o adapter
  private readonly _reload = linkedSignal({
    source: () => ({ adapter: this.adapter(), channel: this.channel() }),
    computation: () => ({ reset: true, scrollToBottom: true })
  });

  // UI
  protected readonly loading = signal(false);
  protected readonly scrollWatcherEnabled = signal(false);
  protected readonly viewportDetectionAvailable = InViewportDirective.intersectionObserverFeatureDetection();

  // Import types and enums
  protected readonly MessageType = ChatMessageType;

  constructor() {
    // Suscribe a los mensajes al cambiar canal o adapter, o al pedir una recarga
    effect(onCleanup => {
      const adapter = this.adapter();
      const channel = this.channel();
      const reload = this._reload();

      untracked(() => {
        if (reload.reset) {
          this.messages.set([]);
          this._visibleMessages = this.settings().pageSize;
        }

        if (!adapter || !channel) {
          this.loading.set(false);
          return;
        }

        this.loading.set(true);

        const subscription = adapter.getMessages(channel, 0, this._visibleMessages).subscribe((messages: ChatMessage[]) => {
          this.messages.set(messages);
          this.loading.set(false);

          if (reload.scrollToBottom && !this.disableRendering()) {
            this.scrollToBottom();
          }

          // Mark as read if component is focused
          if (channel.unread() > 0 && document.hasFocus()) {
            adapter.markAsRead(channel);
          }
        });

        onCleanup(() => subscription.unsubscribe());
      });
    });
  }

  public ngOnInit() {
    if (!this.user()) {
      throw new Error('Chat current user must be defined');
    }
  }

  public ngAfterViewInit() {
    this.scrollToBottom();
  }

  public reloadMessages(scrollToBottom = true) {
    this._reload.set({ reset: false, scrollToBottom });
  }

  protected isSeparatorVisible(message: ChatMessage, prevMessage: ChatMessage | null): boolean {
    return !prevMessage || !isSameDay(prevMessage.date, message.date);
  }

  protected trackMessage(i, message: ChatMessage) {
    return message.date.toString() + message.content;
  }

  public scrollToBottom() {
    setTimeout(() => {
      // Wait until new messages are drawn
      if (this._chatBox()) {
        this._chatBox().nativeElement.scrollTop = this._chatBox().nativeElement.scrollHeight;

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

  protected loadOldMessages() {
    this.scrollWatcherEnabled.set(false);
    this._visibleMessages += this.settings().pageSize;

    this.reloadMessages(false);
  }

  protected watcherInViewportChanged(isVisible: boolean) {
    if (isVisible) {
      this.loadOldMessages();
    }
  }

  public replyTo(message: ChatMessage) {
    this.replyingTo.set(message);
    this.focus();
  }

  public goToMessage(message: ChatMessage) {
    const wrapper = this._messageComponents()?.find(m => m.message() === message || (m.message()?.id && message.id && m.message()?.id === message.id));
    wrapper?.highlight();
  }

  protected onDrag(event: CdkDragMove) {
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
