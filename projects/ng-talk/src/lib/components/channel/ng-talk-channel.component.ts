import type { CdkDragEnd, CdkDragMove } from '@angular/cdk/drag-drop';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { NgComponentOutlet } from '@angular/common';
import type { AfterViewInit, OnInit } from '@angular/core';
import { Component, ElementRef, effect, input, linkedSignal, output, resource, signal, untracked, viewChild, viewChildren } from '@angular/core';
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

  // Número de mensajes visibles; vuelve al tamaño de página al cambiar de canal o adapter
  private readonly _visibleMessages = linkedSignal({
    source: () => ({ adapter: this.adapter(), channel: this.channel() }),
    computation: () => this.settings().pageSize
  });

  // El número de mensajes no forma parte de los params, para no vaciar la lista al cargar mensajes antiguos (se recarga)
  public readonly messagesResource = resource({
    params: () => {
      const adapter = this.adapter();
      const channel = this.channel();
      return adapter && channel ? { adapter, channel } : undefined;
    },
    stream: ({ params, abortSignal }) =>
      params.adapter.getMessages({ channel: params.channel, offset: 0, count: untracked(this._visibleMessages), abortSignal }),
    defaultValue: []
  });
  public readonly replyingTo = signal<ChatMessage | null>(null);

  // Al cargar mensajes antiguos, mantener la posición del scroll en lugar de bajar al final
  private _keepScrollPosition = false;

  // UI
  protected readonly scrollWatcherEnabled = signal(false);
  protected readonly viewportDetectionAvailable = InViewportDirective.intersectionObserverFeatureDetection();

  // Import types and enums
  protected readonly MessageType = ChatMessageType;

  constructor() {
    // Al recibir mensajes, bajar al final y marcar como leído si la ventana tiene el foco
    effect(() => {
      // Solo con mensajes recibidos, no con el valor por defecto mientras carga
      if (this.messagesResource.status() !== 'resolved') {
        return;
      }
      this.messagesResource.value();

      untracked(() => {
        if (this._keepScrollPosition) {
          this._keepScrollPosition = false;
        } else if (!this.disableRendering()) {
          this.scrollToBottom();
        }

        // Mark as read if component is focused
        const adapter = this.adapter();
        const channel = this.channel();
        if (adapter && channel?.unread() > 0 && document.hasFocus()) {
          adapter.markAsRead(channel);
        }
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

        if (this.messagesResource.hasValue() && this.messagesResource.value().length >= this._visibleMessages()) {
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
    this._visibleMessages.update(count => count + this.settings().pageSize);
    this._keepScrollPosition = true;
    this.messagesResource.reload();
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
