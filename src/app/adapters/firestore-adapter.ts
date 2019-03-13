import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {Injectable} from "@angular/core";
import {AngularFirestore} from "@angular/fire/firestore";
import {ChatAdapter} from "../../../projects/ng-talk/src/lib/models/chat-adapter";
import {ChatUser} from "../../../projects/ng-talk/src/lib/models/chat-user";
import {ChatMessage} from "../../../projects/ng-talk/src/lib/models/chat-message";
import {DemoAdapter} from "./demo-adapter";
import {ChatChannel, ChatChannelType} from "../../../projects/ng-talk/src/lib/models/chat-channel";

interface FirestoreRoom {
    createdAt?: number;
    messages: FirestoreRoomMessage[];
    last: number;
}

interface FirestoreRoomMessage {
    content: any;
    uid: number;
    date: number;
}

const nameof = <T>(name: keyof T) => name;

@Injectable({
    providedIn: 'root'
})
export class FirestoreAdapter extends ChatAdapter {
    constructor(private _firestore: AngularFirestore) {
        super();
    }

    public getChannels(user: ChatUser): Observable<ChatChannel[]> {
        return this._firestore
            .collection<FirestoreRoom>('rooms'/*, ref => ref.where('uid', '==', user.id)*/)
            .snapshotChanges()
            .pipe(
                map(rooms => rooms.map(room => {
                        const data = room.payload.doc.data();
                        const id = room.payload.doc.id;

                        return {
                            id: id,
                            type: ChatChannelType.User,
                            name: (data as any).name || id.toString(),
                            icon: (data as any).icon,
                            unread: Math.floor(Math.random() * 10)
                        };
                    })
                )
            );
    }

    public getMessages(room: ChatChannel, count: number): Observable<ChatMessage[]> {
        return this._firestore
            .collection<FirestoreRoom>('rooms')
            .doc(room.id)
            .collection<FirestoreRoomMessage>('messages', query => query
                .orderBy(nameof<FirestoreRoomMessage>('date'), 'desc')
                .limit(count)
            )
            .snapshotChanges()
            .pipe(
                map(messages => messages.reverse().map(message => {
                        const data = message.payload.doc.data();

                        return {
                            from: DemoAdapter.mockedUsers.find(u => u.id == data.uid) || DemoAdapter.mockedUsers[0],
                            content: data.content,
                            date: new Date(data.date)
                        };
                    })
                )
            );
    }

    public sendMessage(room: ChatChannel, message: ChatMessage) {
        return this._firestore
            .collection<FirestoreRoom>('rooms')
            .doc(room.id)
            .collection<FirestoreRoomMessage>('messages')
            .add({
                uid: message.from.id,
                content: message.content,
                date: Date.now()
            }) as any;
    }

    public markAsRead(channel: ChatChannel): Promise<any> {
        return Promise.resolve();
    }
}
