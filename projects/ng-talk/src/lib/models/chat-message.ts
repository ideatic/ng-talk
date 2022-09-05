import {ChatUser} from './chat-user';

export enum ChatMessageType {
  Text = 'text',
  Writing = 'writing'
}


export interface ChatMessage {
  id?: number | string;
  type?: ChatMessageType;
  from: ChatUser;
  content: string;
  date?: Date;
  replyTo?: ChatMessage;
  // dateSeen?: number;
}
