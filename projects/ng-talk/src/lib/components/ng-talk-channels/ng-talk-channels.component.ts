import {Component, ContentChild, ElementRef, EventEmitter, HostBinding, HostListener, Input, OnChanges, OnDestroy, Output, SimpleChanges, TemplateRef} from '@angular/core';
import {ChatAdapter} from '../../models/chat-adapter';
import {ChatUser} from '../../models/chat-user';
import {ChannelMessagesLoading, NgTalkSettings} from '../ng-talk-settings';
import {ChatChannel, ChatChannelType} from '../../models/chat-channel';
import {BehaviorSubject, Observable, of, Subscription} from 'rxjs';
import {nameof, observableToBehaviorSubject} from '../../utils/utils';
import {ChatMessage} from '../../models/chat-message';
import {BubbleChannelRef, BubbleChannelService} from '../../service/bubble-channel.service';
import {first} from 'rxjs/operators';

@Component({
    selector: 'ng-talk-channels',
    templateUrl: './ng-talk-channels.component.html',
    styleUrls: [
        './ng-talk-channels.component.less'
    ]
})
export class NgTalkChannelsComponent implements OnChanges, OnDestroy {

    @Input() public user: ChatUser;
    @Input() public adapter: ChatAdapter;
    @Input() public settings = new NgTalkSettings();
    @Output() public channelChanged: EventEmitter<ChatChannel> = new EventEmitter();

    // Forwarded events from single channel
    @Output() public messageSent: EventEmitter<ChatMessage> = new EventEmitter();
    @Output() public userClicked: EventEmitter<ChatUser> = new EventEmitter();

    // Single channel header template
    @ContentChild('channelHeader') public channelHeaderTemplate: TemplateRef<any>;

    @HostBinding('class')
    public displayMode: 'desktop' | 'mobile';

    public intermediateAdapter: IntermediateAdapter;

    public activeChannel: ChatChannel;
    public channelsSubscription: Subscription;
    public channels: ChatChannel[];

    public filterQuery: string;

    private _isDestroyed = false;

    // Import types
    public readonly ChannelType = ChatChannelType;
    public readonly MessagesLoading = ChannelMessagesLoading;

    constructor(private _host: ElementRef<HTMLElement>,
                public bubbleChannelSvc: BubbleChannelService) {
        this.onResized();
    }

    public ngOnChanges(changes: SimpleChanges) {
        if (changes[nameof<NgTalkChannelsComponent>('adapter')]) {
            if (this.intermediateAdapter) {
                this.intermediateAdapter.destroy();
            }

            this.intermediateAdapter = new IntermediateAdapter(this.adapter);
        }

        if (changes[nameof<NgTalkChannelsComponent>('adapter')] || changes[nameof<NgTalkChannelsComponent>('user')]) {
            if (this.channelsSubscription) {
                this.channelsSubscription.unsubscribe();
            }

            this.channelsSubscription = this.adapter.getChannels(this.user).subscribe(channels => {
                this.channels = channels;

                if (this.settings.channelMessagesLoading == ChannelMessagesLoading.all) {
                    channels.forEach(c => this.intermediateAdapter.getMessages(c, 0, this.settings.pageSize));
                }

                // Select current message (when a message to a new channel is sent, the new channel is selected automatically)
                if (this.activeChannel) {
                    const activeChannel = this.channels.find(c => c.id == this.activeChannel.id);
                    if (activeChannel && activeChannel != this.activeChannel) {
                        this.selectChannel(activeChannel);
                    }
                }
            });
        }
    }

    public trackChannel(i, channel: ChatChannel) {
        return channel.id;
    }

    public selectChannel(channel: ChatChannel) {
        this.activeChannel = channel;
        this.filterQuery = '';

        this.channelChanged.emit(channel);
    }

    @HostListener('window:resize')
    @HostListener('window:deviceorientation')
    @HostListener('window:scroll')
    public onResized() {
        this.displayMode = this._host.nativeElement.clientWidth < this.settings.mobileBreakpoint ? 'mobile' : 'desktop';
    }

    public ngOnDestroy() {
        this._isDestroyed = true;

        if (this.channelsSubscription) {
            this.channelsSubscription.unsubscribe();
        }
        if (this.intermediateAdapter) {
            this.intermediateAdapter.destroy(this.bubbleChannelSvc.activeChannelIDs);
        }
    }

    public inViewportChangedChannel(channel: ChatChannel, isVisible: boolean) {
        if (isVisible && this.settings.channelMessagesLoading == ChannelMessagesLoading.lazy) {
            this.intermediateAdapter.getMessages(channel, 0, this.settings.pageSize);
        }
    }

    public openBubbleChat(channel: ChatChannel): BubbleChannelRef {
        if (channel && !this.bubbleChannelSvc.hasInstance(channel)) {
            const bubbleRef = this.bubbleChannelSvc.show(channel, this.intermediateAdapter, this.user, this.settings);

            bubbleRef.onDestroyed.pipe(first()).subscribe(() => {
                if (this._isDestroyed && this.bubbleChannelSvc.activeChannelIDs.length == 0) {
                    this.intermediateAdapter.destroy();
                }
            });

            return bubbleRef;
        }
    }
}

/**
 * Converts Observables to BehaviorSubject to read channels messages before selecting them
 */
class IntermediateAdapter implements ChatAdapter {
    private _channels$: { [key: string]: BehaviorSubject<ChatMessage[]> } = {};
    private _subscriptions: { [key: string]: Subscription } = {};

    constructor(private _parentAdapter: ChatAdapter) {

    }

    public getChannels(user: ChatUser): Observable<ChatChannel[]> {
        return this._parentAdapter.getChannels(user);
    }

    public getMessages(channel: ChatChannel, offset: number, count: number): Observable<ChatMessage[]> {
        if (!channel.id) { // Nuevo canal no guardado aún, sin mensajes
            return of([]);
        }

        if (!this._channels$[channel.id]) {
            const subject = observableToBehaviorSubject(this._parentAdapter.getMessages(channel, offset, count), []);
            this._channels$[channel.id] = subject[0];
            this._subscriptions[channel.id] = subject[1];
        }
        return this._channels$[channel.id];
    }


    public sendMessage(channel: ChatChannel, message: ChatMessage): Promise<any> {
        return this._parentAdapter.sendMessage(channel, message);
    }

    public destroy(keepChannels?: string[]) {
        for (const channelID of Object.keys(this._subscriptions)) {
            if (!keepChannels || keepChannels.indexOf(channelID) < 0) {
                this._subscriptions[channelID].unsubscribe();
                delete this._subscriptions[channelID];
            }
        }
    }

    public markAsRead(channel: ChatChannel): Promise<any> {
        return this._parentAdapter.markAsRead(channel);
    }
}