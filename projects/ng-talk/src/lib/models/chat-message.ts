import {ChatUser} from './chat-user';

export enum ChatMessageType {
  Text = 'text',
  Image = 'image',
  Gif = 'gif',
  Writing = 'writing'
}

export interface ChatMessage<T = any> {
  id?: number | string;
  type?: ChatMessageType;
  from: ChatUser;
  content: string;
  date?: Date;
  replyTo?: ChatMessage;
  // dateSeen?: number;
  data?: T;
}
