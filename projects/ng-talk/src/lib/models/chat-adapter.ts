import type { ResourceStreamItem, Signal } from '@angular/core';
import type { ChatChannel } from './chat-channel';
import type { ChatMessage } from './chat-message';
import type { ChatUser } from './chat-user';

/**
 * Carga de un `resource({ stream })`: la señal cambia con cada valor nuevo, y el adapter deja de enviarlos cuando se aborta
 * el `abortSignal` de la carga. Si es una promesa, el recurso sigue cargando hasta que se resuelve
 */
export type ChatStream<T> = Signal<ResourceStreamItem<T>> | PromiseLike<Signal<ResourceStreamItem<T>>>;

/** Parámetros de `ChatAdapter.getChannels()` */
export interface ChatChannelsParams {
  user: ChatUser;
  abortSignal: AbortSignal;
}

/** Parámetros de `ChatAdapter.getMessages()` */
export interface ChatMessagesParams<C extends ChatChannel = ChatChannel> {
  channel: C;
  offset: number;
  count: number;
  abortSignal: AbortSignal;
}

export abstract class ChatAdapter {
  public abstract getChannels(params: ChatChannelsParams): ChatStream<ChatChannel[]>;

  public abstract getMessages(params: ChatMessagesParams): ChatStream<ChatMessage[]>;

  public abstract sendMessage(channel: ChatChannel, message: ChatMessage, replyTo?: ChatMessage): Promise<any>;

  public abstract markAsRead(channel: ChatChannel): Promise<void>;

  public abstract deleteChannel?(channel: ChatChannel): Promise<void>;

  public abstract toggleBlock?(channel: ChatChannel): Promise<boolean>;
}
