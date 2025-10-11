import type {Observable} from 'rxjs';
import type {ChatChannel} from './chat-channel';
import type {ChatMessage} from './chat-message';
import type {ChatUser} from './chat-user';

export abstract class ChatAdapter {
  public abstract getChannels(user: ChatUser): Observable<ChatChannel[]>;

  public abstract getMessages(channel: ChatChannel, offset: number, count: number): Observable<ChatMessage[]>;

  public abstract sendMessage(channel: ChatChannel, message: ChatMessage, replyTo?: ChatMessage): Promise<any>;

  public abstract markAsRead(channel: ChatChannel): Promise<void>;

  public abstract deleteChannel?(channel: ChatChannel): Promise<void>;

  public abstract toggleBlock?(channel: ChatChannel): Promise<boolean>;
}
