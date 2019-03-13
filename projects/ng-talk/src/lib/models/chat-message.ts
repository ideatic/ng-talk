import {ChatUser} from './chat-user';

export enum ChatMessageType {
    Text = 'text',
    Writing = 'writing'
}


export interface ChatMessage {
    type?: ChatMessageType;
    from: ChatUser;
    content: string;
    date?: Date;
    // dateSeen?: number;
}
