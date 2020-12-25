export enum ChatUserStatus {
  Online,
  Writing,
  Busy,
  Away,
  Offline
}


export interface ChatUser<T = any> {
  id: any;
  name: string;
  avatar?: string;
  status?: ChatUserStatus;
  color?: string;
  data?: T;
}
