import {ChatMessage} from './chat-message';
import {WritableSignal} from "@angular/core";

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
  unread: WritableSignal<number>;
  lastMessage: WritableSignal<ChatMessage | null>;
  data?: T;
}
