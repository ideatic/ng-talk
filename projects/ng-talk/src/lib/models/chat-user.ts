export enum ChatUserStatus {
    Online,
    Writing,
    Busy,
    Away,
    Offline
}


export interface ChatUser {
    id: any;
    name: string;
    avatar?: string;
    status?: ChatUserStatus;
    color?: string;
    data?: any;
}
