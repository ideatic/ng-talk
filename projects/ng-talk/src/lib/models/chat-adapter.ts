import {Observable} from 'rxjs';
import {ChatChannel} from './chat-channel';
import {ChatMessage} from './chat-message';
import {ChatUser} from './chat-user';

export abstract class ChatAdapter {
  public abstract getChannels(user: ChatUser): Observable<ChatChannel[]>;

  public abstract getMessages(channel: ChatChannel, offset: number, count: number): Observable<ChatMessage[]>;

  public abstract sendMessage(channel: ChatChannel, message: ChatMessage): Promise<any>;

  public abstract markAsRead(channel: ChatChannel): Promise<any>;

  public abstract toggleBlock?(channel: ChatChannel): Promise<boolean>;
}
