import {ChatAdapter} from "../../../projects/ng-talk/src/lib/models/chat-adapter";
import {ChatUser, ChatUserStatus} from "../../../projects/ng-talk/src/lib/models/chat-user";
import {BehaviorSubject, Observable, of} from "rxjs";
import {ChatMessage, ChatMessageType} from "../../../projects/ng-talk/src/lib/models/chat-message";
import {Injectable} from "@angular/core";
import {ChatChannel, ChatChannelType} from "../../../projects/ng-talk/src/lib/models/chat-channel";

@Injectable({
    providedIn: 'root',
})
export class DemoAdapter extends ChatAdapter {
    public static mockedUsers: ChatUser[] = [
        {
            id: 1,
            name: "Arya Stark",
            avatar: "http://pm1.narvii.com/6552/2e7146c7f5fd05764264e78b3678873c868dcc7c_hq.jpg",
            status: ChatUserStatus.Online
        },
        {
            id: 2,
            name: "Cersei Lannister",
            avatar: null,
            status: ChatUserStatus.Online
        },
        {
            id: 3,
            name: "Daenerys Targaryen",
            avatar: "https://68.media.tumblr.com/avatar_d28d7149f567_128.png",
            status: ChatUserStatus.Busy
        },
        {
            id: 4,
            name: "Eddard Stark",
            avatar: "https://pbs.twimg.com/profile_images/600707945911844864/MNogF757_400x400.jpg",
            status: ChatUserStatus.Offline
        },
        {
            id: 5,
            name: "Hodor",
            avatar: "https://pbs.twimg.com/profile_images/378800000449071678/27f2e27edd119a7133110f8635f2c130.jpeg",
            status: ChatUserStatus.Offline
        },
        {
            id: 6,
            name: "Jaime Lannister",
            avatar: "https://pbs.twimg.com/profile_images/378800000243930208/4fa8efadb63777ead29046d822606a57.jpeg",
            status: ChatUserStatus.Busy
        },
        {
            id: 7,
            name: "John Snow",
            avatar: "https://pbs.twimg.com/profile_images/3456602315/aad436e6fab77ef4098c7a5b86cac8e3.jpeg",
            status: ChatUserStatus.Busy
        },
        {
            id: 8,
            name: "Lorde Petyr 'Littlefinger' Baelish",
            avatar: "http://68.media.tumblr.com/avatar_ba75cbb26da7_128.png",
            status: ChatUserStatus.Offline
        },
        {
            id: 9,
            name: "Sansa Stark",
            avatar: "http://pm1.narvii.com/6201/dfe7ad75cd32130a5c844d58315cbca02fe5b804_128.jpg",
            status: ChatUserStatus.Online
        },
        {
            id: 10,
            name: "Theon Greyjoy",
            avatar: "https://thumbnail.myheritageimages.com/502/323/78502323/000/000114_884889c3n33qfe004v5024_C_64x64C.jpg",
            status: ChatUserStatus.Away
        }
    ];

    public getChannels(user: ChatUser): Observable<ChatChannel[]> {
        return of(DemoAdapter.mockedUsers.map(user => {
            return {
                id: user.id,
                type: ChatChannelType.User,
                name: user.name,
                icon: user.avatar,
                lastMessage: {
                    from: user,
                    content: "Hi there, just type any message bellow to test this Angular module.",
                    date: new Date()
                },
                unread: Math.floor(Math.random() * 10)
            };
        }));
    }

    private _channelMessages: { [key: string]: BehaviorSubject<ChatMessage[]> } = {};

    public getMessages(room: ChatChannel, count: number): BehaviorSubject<ChatMessage[]> {
        if (!this._channelMessages[room.id]) {
            this._channelMessages[room.id] = new BehaviorSubject<ChatMessage[]>([]);

            setTimeout(() => this._sendMessage(room, {
                type: ChatMessageType.Writing,
                from: DemoAdapter.mockedUsers.find(u => u.id == room.id),
                content: ''
            }), 100);

            setTimeout(() => {
                // Remove writing message
                const messages = this._channelMessages[room.id].getValue();
                const index = messages.findIndex(m => m.type == ChatMessageType.Writing);
                if (index >= 0) {
                    messages.splice(index, 1);
                }

                this._sendMessage(room, {
                    from: DemoAdapter.mockedUsers.find(u => u.id == room.id),
                    content: "Hi there, just type any message bellow to test this Angular module."
                });
            }, 5000);
        } else { // Emit stored messages
            setTimeout(() => this._channelMessages[room.id].next(this._channelMessages[room.id].getValue()), 10);
        }

        return this._channelMessages[room.id];
    }

    public sendMessage(room: ChatChannel, message: ChatMessage) {
        this._sendMessage(room, message);

        setTimeout(() => this._sendMessage(room, {
            from: DemoAdapter.mockedUsers.find(u => u.id == room.id),
            content: "You have typed '" + message.content + "'"
        }), 2000);

        return Promise.resolve();
    }

    private _sendMessage(room: ChatChannel, message: ChatMessage) {
        if (!message.date) {
            message.date = new Date();
        }
        if (!message.type) {
            message.type = ChatMessageType.Text;
        }

        const roomMessages = this._channelMessages[room.id].getValue();
        roomMessages.push(message);
        this._channelMessages[room.id].next(roomMessages);
    }


    public markAsRead(channel: ChatChannel): Promise<any> {
        return Promise.resolve();
    }
}