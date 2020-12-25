import {ChatMessage} from './chat-message';

export enum ChatChannelType {
  User,
  Group
}


export interface ChatChannel<T = any> {
  id: string;
  type: ChatChannelType;
  name: string;
  icon: string;

  disabled?: boolean;
  blocked?: boolean;
  unread?: number;
  lastMessage?: ChatMessage;
  data?: T;
}
