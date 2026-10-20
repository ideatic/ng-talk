import { computed, Service, signal } from '@angular/core';
import type { Signal, WritableSignal } from '@angular/core';
import { ChatAdapter } from '../../../projects/ng-talk/src/lib/models/chat-adapter';
import type { ChatChannelsParams, ChatMessagesParams, ChatStream } from '../../../projects/ng-talk/src/lib/models/chat-adapter';
import type { ChatUser } from '../../../projects/ng-talk/src/lib/models/chat-user';
import { ChatUserStatus } from '../../../projects/ng-talk/src/lib/models/chat-user';
import type { ChatMessage } from '../../../projects/ng-talk/src/lib/models/chat-message';
import { ChatMessageType } from '../../../projects/ng-talk/src/lib/models/chat-message';
import type { ChatChannel } from '../../../projects/ng-talk/src/lib/models/chat-channel';
import { ChatChannelType } from '../../../projects/ng-talk/src/lib/models/chat-channel';

@Service()
export class DemoAdapter extends ChatAdapter {
  public static mockedUsers: ChatUser[] = [
    {
      id: 1,
      name: 'Arya Stark',
      avatar: 'http://pm1.narvii.com/6552/2e7146c7f5fd05764264e78b3678873c868dcc7c_hq.jpg',
      status: ChatUserStatus.Online
    },
    {
      id: 2,
      name: 'Cersei Lannister',
      avatar: null,
      status: ChatUserStatus.Online
    },
    {
      id: 3,
      name: 'Daenerys Targaryen',
      avatar: 'https://68.media.tumblr.com/avatar_d28d7149f567_128.png',
      status: ChatUserStatus.Busy
    },
    {
      id: 4,
      name: 'Eddard Stark',
      avatar: 'https://pbs.twimg.com/profile_images/600707945911844864/MNogF757_400x400.jpg',
      status: ChatUserStatus.Offline
    },
    {
      id: 5,
      name: 'Hodor',
      avatar: 'https://pbs.twimg.com/profile_images/378800000449071678/27f2e27edd119a7133110f8635f2c130.jpeg',
      status: ChatUserStatus.Offline
    },
    {
      id: 6,
      name: 'Jaime Lannister',
      avatar: 'https://pbs.twimg.com/profile_images/378800000243930208/4fa8efadb63777ead29046d822606a57.jpeg',
      status: ChatUserStatus.Busy
    },
    {
      id: 7,
      name: 'John Snow',
      avatar: 'https://pbs.twimg.com/profile_images/3456602315/aad436e6fab77ef4098c7a5b86cac8e3.jpeg',
      status: ChatUserStatus.Busy
    },
    {
      id: 8,
      name: 'Lorde Petyr \'Littlefinger\' Baelish',
      avatar: 'http://68.media.tumblr.com/avatar_ba75cbb26da7_128.png',
      status: ChatUserStatus.Offline
    },
    {
      id: 9,
      name: 'Sansa Stark',
      avatar: 'http://pm1.narvii.com/6201/dfe7ad75cd32130a5c844d58315cbca02fe5b804_128.jpg',
      status: ChatUserStatus.Online
    },
    {
      id: 10,
      name: 'Theon Greyjoy',
      avatar: 'https://thumbnail.myheritageimages.com/502/323/78502323/000/000114_884889c3n33qfe004v5024_C_64x64C.jpg',
      status: ChatUserStatus.Away
    }
  ];

  private readonly _channels = signal<ChatChannel[]>(
    DemoAdapter.mockedUsers.map(user => ({
      id: user.id,
      type: ChatChannelType.User,
      name: user.name,
      icon: user.avatar,
      blocked: user.id == 8,
      lastMessage: signal<ChatMessage | null>({
        from: signal(user),
        content: 'Hi there, just type any message bellow to test this Angular module.',
        date: new Date()
      }),
      unread: signal(Math.floor(Math.random() * 10))
    }))
  );

  // Mensajes de cada canal, indexados por el id del canal
  private readonly _channelMessages: Record<string, WritableSignal<ChatMessage[]>> = {};

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public getChannels(params: ChatChannelsParams): ChatStream<ChatChannel[]> {
    return computed(() => ({ value: this._channels() }));
  }

  // El adapter de demo no tiene ningún listener real, así que ignora `offset`, `count` y `abortSignal`
  public getMessages({ channel }: ChatMessagesParams): ChatStream<ChatMessage[]> {
    let messages = this._channelMessages[channel.id];

    if (!messages) {
      messages = this._channelMessages[channel.id] = signal<ChatMessage[]>([]);

      setTimeout(() => this._sendMessage(channel, {
        from: this._userOf(channel),
        content: 'Hi there, just type any message bellow to test this Angular module.'
      }), 1000);

      setTimeout(() => this._sendMessage(channel, {
        type: ChatMessageType.Writing,
        from: this._userOf(channel),
        content: ''
      }), 1000);

      setTimeout(() => {
        // Se quita el mensaje de "escribiendo"
        messages.update(list => list.filter(m => m.type != ChatMessageType.Writing));

        this._sendMessage(channel, {
          from: this._userOf(channel),
          content: 'How are you?'
        });
      }, 5000);
    }

    return computed(() => ({ value: messages() }));
  }

  public sendMessage(channel: ChatChannel, message: ChatMessage, replyTo?: ChatMessage): Promise<any> {
    this._sendMessage(channel, message);

    setTimeout(() => this._sendMessage(channel, {
      from: this._userOf(channel),
      content: `You have typed '${message.content}'`,
      replyTo: replyTo
    }), 2000);

    return Promise.resolve();
  }

  private _sendMessage(channel: ChatChannel, message: ChatMessage): void {
    message.id ??= Math.floor(Math.random() * 1000000);
    message.date ??= new Date();
    message.type ??= ChatMessageType.Text;

    this._channelMessages[channel.id].update(messages => [...messages, message]);
  }

  // Usuario simulado que responde en el canal
  private _userOf(channel: ChatChannel): Signal<ChatUser> {
    return signal(DemoAdapter.mockedUsers.find(u => u.id == channel.id) as ChatUser);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public markAsRead(channel: ChatChannel): Promise<void> {
    return Promise.resolve();
  }

  public toggleBlock(channel: ChatChannel): Promise<boolean> {
    return Promise.resolve(channel.blocked = !channel.blocked);
  }

  public deleteChannel(channel: ChatChannel): Promise<void> {
    this._channels.update(channels => channels.filter(c => c.id != channel.id));
    return Promise.resolve();
  }
}
