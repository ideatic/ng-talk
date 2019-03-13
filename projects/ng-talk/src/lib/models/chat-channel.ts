import {ChatMessage} from './chat-message';

export enum ChatChannelType {
    User,
    Group
}


export interface ChatChannel {
    id: string;
    type: ChatChannelType;
    name: string;
    icon: string;

    unread?: number;
    lastMessage?: ChatMessage;
    data?: any;
}
